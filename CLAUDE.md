# Vestaria

Premium digital wardrobe app: save garments, build outfits, plan them on a calendar,
track what was actually worn. See [ARCHITECTURE.md](ARCHITECTURE.md) for the technical
layout.

## Product priority order

1. interaction speed
2. simplicity
3. native feel
4. visual hierarchy
5. reliability
6. maintainability
7. features

When two options trade off against each other, resolve in that order.

## Hard rules

- **Local-first.** SQLite (`src/db`, `src/domain`) is the source of truth. Screens read
  from it directly or through a thin hook in `src/hooks` — no ordinary interaction
  should wait on a network call.
- **No blocking on local interactions.** Inserts/updates are synchronous SQLite calls;
  the UI reflects them immediately. Anything genuinely async (image processing) updates
  the row silently afterward — never a full-screen spinner for it.
- **Use theme tokens, not literals.** All spacing/color/radius/typography/motion values
  come from `src/theme`. No ad-hoc `paddingHorizontal: 17` scattered in components.
- **No cloud AI / per-image paid APIs.** Background removal and classification are
  on-device or deferred, never a metered cloud call per garment (see ARCHITECTURE.md
  "Known gap").
- **No feature creep.** No shopping, social, AI stylist, gamification, or subscription
  gating unless explicitly requested — see the product spec's "NOT V1" list.
- **No generic AI/startup aesthetic.** No gradient backgrounds, glassmorphism, sparkle
  icons, or decorative shadows without a specific reason. Garments provide the color;
  the chrome stays quiet.
- **Planned vs. worn are different tables** (`calendar_entries` vs `wear_events`).
  Never infer a wear count from a planned outfit.
- **Animate transform/opacity only**, via Reanimated + Gesture Handler for anything
  gesture-driven (the outfit canvas). Respect `prefers-reduced-motion`.
- **Thumbnails in grids, full images only in detail/canvas.** See
  `src/components/GarmentThumb.tsx` and `src/imaging/pipeline.ts`.
- **Test gestures/perf on a real device before calling a screen done** — the web
  preview is convenience-only and can't validate 60fps scrolling or camera capture.
- **Cloud is optional and additive.** Everything in `src/cloud/*` must check
  `isCloudConfigured()` / a signed-in session first and degrade quietly — local
  behavior never depends on whether backup is set up. See ARCHITECTURE.md "Cloud /
  sync" before touching sync, auth, or the Supabase schema.
