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

Every screen reads/writes SQLite directly, so "offline support" was never a separate
feature to build — it's the default. The only network calls in the app are the ones
in `src/cloud/*`, and they only run when the user explicitly taps "Sync now" on the
Backup screen; nothing else waits on them, and a failed sync just surfaces an inline
error on that screen rather than blocking anything.

**Known gap:** there's no queue for offline mutations yet. If "Sync now" is tapped
without a connection, it fails once with an error and nothing is queued to retry
automatically — the user just taps it again later. That's an acceptable simplification
today because sync is manual and opt-in; it stops being acceptable if backup ever
becomes automatic/background, at which point failed pushes need to persist and retry.

## Cloud / sync (`src/cloud/*`, `supabase/migrations/0001_init.sql`)

Optional and gated: `isCloudConfigured()` (in `src/cloud/config.ts`) is false until
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set (see README "Cloud
backup setup"), and every cloud entry point checks it first and degrades quietly.
Nothing about local behavior changes based on whether cloud is configured.

- **Auth** (`src/cloud/auth.ts`): email OTP only (Supabase sends a 6-digit code, no
  password). Sign in with Apple/Google are natural next additions but need their own
  developer consoles — not something to fake with a stubbed button.
- **Schema** (`supabase/migrations/0001_init.sql`): mirrors the local SQLite schema
  columns-for-columns, with `user_id` added and Row Level Security scoping every table
  to `auth.uid()`. `outfit_items` has no `user_id` column (matches local) — its policy
  checks ownership through the parent `outfits` row instead.
- **Images**: uploaded to a public-read, write-scoped-by-folder Supabase Storage
  bucket (`garments/<user_id>/<garment_id>/{image,thumb}.jpg`) — never the original
  camera photo, matching the local pipeline's normalized outputs. Public-read because
  photos of your own clothes aren't sensitive and it avoids signed-URL expiry
  complexity; tightening to signed URLs later is a storage-policy change, not a schema
  one.
- **Sync** (`src/cloud/backup.ts`): `syncNow()` does a full push then a full pull,
  last-write-wins by `updated_at` (see product spec §28 — explicitly no CRDT). It's
  whole-table, not incremental, which is fine at personal-wardrobe scale (hundreds of
  rows, not millions) and much easier to reason about. `garments.image_local_uri` /
  `thumb_local_uri` are never sent remotely (device-specific paths); pulling a garment
  down on a fresh device fills in `imageRemoteUrl`/`thumbRemoteUrl` only;
  `GarmentThumb` falls back to those (loaded straight from Supabase Storage over the
  network) when there's no local file yet, which is what makes "restore on a new
  phone" actually show photos before any re-download step exists.
- **Known edge case**: `calendar_entries` has `UNIQUE(user_id, date)` remotely (and
  `UNIQUE(date)` locally). Two devices planning the same date before ever syncing can
  collide on insert; `backup.ts` swallows that one row's error (`safely()`) rather than
  aborting the whole sync, but the losing device's plan for that day is silently
  dropped rather than merged. Acceptable for now, worth revisiting if multi-device
  planning (not just backup/restore on one device) becomes a real use case.
- **Verified against a real project**: schema, RLS, and the storage bucket have been
  confirmed live (all 5 tables + `garments` bucket exist; an unauthenticated insert is
  correctly rejected by RLS; the auth endpoint responds). What's *not* verified yet is
  the RN runtime path — AsyncStorage session persistence, the actual OTP email round
  trip, and `syncNow()` end-to-end from the app — since that needs a device/simulator
  this environment doesn't have.

## Known simplifications vs. the full product spec

- Image processing runs as a single async pipeline step, not a multi-stage queue —
  acceptable because `expo-image-manipulator` resize+compress is fast enough that the
  optimistic insert (raw photo) already covers the "no waiting" requirement.
- No offline mutation queue exists yet because there's no remote backend to queue
  against; SQLite alone already makes every core flow (Closet, Outfits, Calendar,
  Today, wear logging) fully offline.
