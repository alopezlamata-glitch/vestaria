import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient } from "./client";

/**
 * Email OTP is the one auth method that needs nothing beyond a Supabase
 * project (no Apple/Google developer account, no deep-link handling for a
 * magic-link redirect). Sign in with Apple/Google are natural additions
 * later — see README "Cloud backup setup" — but need their own consoles.
 */
export async function requestEmailCode(email: string): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: "Cloud backup isn't set up yet." };

  const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  return { error: error?.message ?? null };
}

export async function verifyEmailCode(email: string, code: string): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: "Cloud backup isn't set up yet." };

  const { error } = await client.auth.verifyOtp({ email, token: code, type: "email" });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const { data } = client.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
