# Vestaria

A premium, local-first digital wardrobe app: save your clothes, build outfits, plan
what you wear on a calendar, and track what you actually wore.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the technical layout and
[CLAUDE.md](CLAUDE.md) for the product/engineering rules this repo follows.

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator. SQLite, the outfit
canvas gestures, and the camera capture flow only work on iOS/Android — there's no
supported web backend for `expo-sqlite` here.

## Status

Phase 1 (foundation: routing, theme, SQLite schema, domain layer, fixtures) and a
working slice of Phases 2–6 (Closet grid + search/filter + garment detail, garment
capture with optimistic insert, outfit canvas with drag/pinch/duplicate, calendar
month view + planning, Today + "Wore it") are in place. Cloud backup (Phase 8) is not
started. See ARCHITECTURE.md for known simplifications.
