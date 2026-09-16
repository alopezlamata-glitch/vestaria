/**
 * Cloud backup is opt-in and entirely optional — the app is fully usable
 * offline without it (see product spec §27/§67). These env vars don't exist
 * until someone creates a Supabase project and fills in `.env.local`
 * (see README "Cloud backup setup"). Every cloud call in this app must go
 * through `isCloudConfigured()` first and degrade quietly when it's false.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isCloudConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
