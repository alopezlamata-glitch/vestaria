# Vestaria — Architecture

Premium digital wardrobe app. React Native + Expo, local-first.

## Stack

- Expo SDK 57, Expo Router (file-based nav), TypeScript strict.
- SQLite (`expo-sqlite`, synchronous API) as the canonical local data store.
- Reanimated 4 + Gesture Handler for the outfit canvas (transform/opacity only).
- `expo-image` for cached, decoded-once thumbnails.
- `expo-image-picker` + `expo-image-manipulator` + `expo-file-system` for garment capture.
- No Redux/MobX/etc — domain hooks (`src/hooks`) wrap direct SQLite reads. The database
  is the single source of truth; screens don't keep a second copy of canonical state.
- Web (`react-dom` / `react-native-web`) is installed only for quick local UI iteration
  in a browser. **`expo-sqlite` has no working web backend in this Metro config**
  (wasm asset resolution + `SharedArrayBuffer`/COOP-COEP requirements) — that's fine,
  because iOS/Android are the only shipping targets.

## Local data model (`src/domain/types.ts`, schema in `src/db/client.ts`)

`Garment`, `Outfit` + `OutfitItem` (positioned garment references — outfits are
compositional, never flattened to an image), `CalendarEntry` (planned outfit per date),
`WearEvent` (confirmed actual wear per date).

**Planned vs. worn are separate tables.** Planning an outfit never touches wear counts;
only a `WearEvent` does. This is deliberate — see product spec §19/§20.

## Image pipeline (`src/imaging/pipeline.ts`)

Capture → optimistic `Garment` row created immediately with the raw photo → user
navigates to the garment instantly → in the background, `processGarmentPhoto` resizes
to a ~1024px display image and a ~256px thumbnail (JPEG) and persists them under
`Paths.document/garments/<id>/` → `updateGarmentImages` swaps the URIs in silently.

**Known gap:** on-device background removal (Vision / ML Kit) is not implemented —
Expo's JS layer doesn't expose those without a custom native module. Garments are
stored as plain normalized crops for now. Same for automatic color/category
classification: new garments default to `category: "other"`, `primaryColor:
"multicolor"` and are corrected with one tap from garment detail. Wiring up real
on-device segmentation/classification is the next step for the ingestion flow and
needs a small native module (or a library like `react-native-vision-camera` +
platform ML API) — deliberately deferred rather than faked with a cloud API, to keep
the zero-infra-cost constraint.

## Outfit canvas

`OutfitItem.x/y/scale/rotation/zIndex` are the canonical transform. Reanimated shared
values drive the drag/pinch gesture directly; on gesture end the final transform is
written back to SQLite (`updateOutfitItemTransform`). Duplicate-and-tweak
(`duplicateOutfit`) copies the outfit row + all items in one transaction.

## Fixtures (`src/fixtures/seed.ts`)

`seedFixtures(garmentCount, outfitCount)` seeds deterministic data and is called
automatically on first launch with a small starter wardrobe. Pass a larger
`garmentCount` (500–1000) to reproduce the Closet performance scenario from the spec;
there's currently no debug UI wired to trigger that — call it from a temporary line in
`app/_layout.tsx` when profiling.

## History & insights (`app/insights.tsx`)

Reachable from a small "History" link on Today. Derives everything from
`getMonthlyInsights` (outfits/garments worn this month, most-worn) and
`getGarmentsNotWornSince` — no separate analytics store, it's a read-only view over
the same wear-event data Today and garment detail already use.

## Calendar move

Long-press a day with a planned outfit to pick it up, then tap the destination day
(a banner confirms the mode, tap the source again or "Cancel" to back out). This is a
tap-based quick-assign rather than a physically dragged finger — a full cross-cell
drag-and-drop over a virtualized 7-column grid (autoscroll, reordering, etc.) was
judged not worth the added complexity for what is fundamentally a "move this to that
day" action. `movePlannedOutfit` in `src/domain/calendar.ts` is the primitive either
approach would use.

## Performance fixture

Long-press the "Closet" title (dev builds only, gated by `__DEV__`) to seed 500
garments via `seedFixtures(500, 40)` and exercise the grid's virtualization at the
scale described in the product spec. This is intentionally not reachable in
production builds — see spec §63 on debug-UI clutter.

## Offline (Phase 7)

Nothing in the app talks to a network yet — every screen reads/writes SQLite
directly, so "offline support" isn't a separate feature to build, it's the default.
This stops being free once Phase 8 (cloud backup) adds a remote call; at that point
mutations need to queue rather than fail when offline.

## Cloud / sync

Not implemented yet (Phase 8 in the product spec — backup only, after the local
experience holds up). The domain layer already separates local ids/timestamps from a
nullable `userId`, so Supabase auth + Postgres + object storage (R2 or equivalent) can
be layered on without changing the local schema.

## Known simplifications vs. the full product spec

- Image processing runs as a single async pipeline step, not a multi-stage queue —
  acceptable because `expo-image-manipulator` resize+compress is fast enough that the
  optimistic insert (raw photo) already covers the "no waiting" requirement.
- No offline mutation queue exists yet because there's no remote backend to queue
  against; SQLite alone already makes every core flow (Closet, Outfits, Calendar,
  Today, wear logging) fully offline.
