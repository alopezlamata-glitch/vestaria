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

## Cloud backup setup

Cloud backup is entirely optional — every screen works fully offline without it. It's
gated behind two env vars; until they're set, the Backup screen just says so and
nothing else changes.

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor**, paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and run
   it. This creates the tables, Row Level Security policies, and the `garments`
   storage bucket for photos.
3. In **Project Settings → API**, copy the **Project URL** and **anon public** key.
4. Copy `.env.example` to `.env.local` and paste those two values in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. Restart `npx expo start` (env vars are read at bundle time).
6. In the app, open **Today → Backup**, enter an email, and enter the 6-digit code
   Supabase emails you. No password, no separate account system.

Sign-in only supports email OTP right now — it's the one method that needs nothing
beyond the Supabase project itself. Adding "Sign in with Apple" / "Sign in with
Google" later is straightforward (Supabase Auth supports both) but each needs its own
developer console (Apple Developer Program, Google Cloud OAuth client) — do that
whenever those are actually set up, wiring into `src/cloud/auth.ts`.

## Status

Phase 1 (foundation), Phases 2–7 (Closet, garment capture, outfits, calendar,
Today/wear history, offline — offline needed no extra work since nothing talks to the
network otherwise), and a first pass at Phase 8 (cloud backup: email-OTP auth, full
push/pull sync, photo upload to Supabase Storage) are in place. See ARCHITECTURE.md
for what's simplified and why, and what still needs a real device to verify (gesture
feel, camera capture, grid scroll performance at 500+ garments, and the actual
Supabase round-trip, since no backend has been created against this schema yet).
