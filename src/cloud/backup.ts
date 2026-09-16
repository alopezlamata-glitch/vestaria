import type { SupabaseClient } from "@supabase/supabase-js";

import {
  calendarEntryFromRow,
  calendarEntryToRow,
  garmentFromRemoteRow,
  garmentToRemoteRow,
  outfitFromRow,
  outfitItemFromRow,
  outfitItemToRow,
  outfitToRow,
  wearEventFromRow,
  wearEventToRow,
  type CalendarEntryRow,
  type OutfitItemRow,
  type OutfitRow,
  type RemoteGarmentRow,
  type WearEventRow,
} from "../db/rows";
import { getSession } from "./auth";
import { getSupabaseClient } from "./client";
import { listAllCalendarEntries, upsertCalendarEntryFromRemote } from "../domain/calendar";
import { listGarments, updateGarmentRemoteUrls, upsertGarmentFromRemote } from "../domain/garments";
import { nowIso } from "../domain/id";
import {
  listAllOutfitItems,
  listOutfits,
  upsertOutfitFromRemote,
  upsertOutfitItemFromRemote,
} from "../domain/outfits";
import { listAllWearEvents, upsertWearEventFromRemote } from "../domain/wear";
import { setLastSyncedAt } from "./syncState";

const GARMENTS_BUCKET = "garments";

async function uploadGarmentAsset(
  client: SupabaseClient,
  userId: string,
  garmentId: string,
  localUri: string,
  filename: string,
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const path = `${userId}/${garmentId}/${filename}`;

  const { error } = await client.storage.from(GARMENTS_BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data } = client.storage.from(GARMENTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function pushGarments(client: SupabaseClient, userId: string): Promise<void> {
  const garments = listGarments({ includeArchived: true });

  for (const garment of garments) {
    if (garment.imageLocalUri && !garment.imageRemoteUrl) {
      const imageUrl = await uploadGarmentAsset(client, userId, garment.id, garment.imageLocalUri, "image.jpg");
      const thumbUrl = garment.thumbLocalUri
        ? await uploadGarmentAsset(client, userId, garment.id, garment.thumbLocalUri, "thumb.jpg")
        : imageUrl;
      updateGarmentRemoteUrls(garment.id, { imageRemoteUrl: imageUrl, thumbRemoteUrl: thumbUrl });
      garment.imageRemoteUrl = imageUrl;
      garment.thumbRemoteUrl = thumbUrl;
    }
  }

  if (garments.length === 0) return;
  const { error } = await client.from("garments").upsert(garments.map((g) => garmentToRemoteRow(g, userId)));
  if (error) throw new Error(error.message);
}

async function pushOutfits(client: SupabaseClient, userId: string): Promise<void> {
  const outfits = listOutfits();
  if (outfits.length > 0) {
    const { error } = await client.from("outfits").upsert(outfits.map((o) => outfitToRow(o, userId)));
    if (error) throw new Error(error.message);
  }

  const items = listAllOutfitItems();
  if (items.length > 0) {
    const { error } = await client.from("outfit_items").upsert(items.map(outfitItemToRow));
    if (error) throw new Error(error.message);
  }
}

async function pushCalendar(client: SupabaseClient, userId: string): Promise<void> {
  const entries = listAllCalendarEntries();
  if (entries.length === 0) return;
  const { error } = await client.from("calendar_entries").upsert(entries.map((e) => calendarEntryToRow(e, userId)));
  if (error) throw new Error(error.message);
}

async function pushWear(client: SupabaseClient, userId: string): Promise<void> {
  const events = listAllWearEvents();
  if (events.length === 0) return;
  const { error } = await client.from("wear_events").upsert(events.map((e) => wearEventToRow(e, userId)));
  if (error) throw new Error(error.message);
}

/** A bad row shouldn't abort the whole sync — see ARCHITECTURE.md on the calendar_entries UNIQUE(date) edge case. */
function safely(fn: () => void): void {
  try {
    fn();
  } catch {
    // Known edge case: two devices planning the same date before ever syncing
    // can collide on calendar_entries' UNIQUE(date). Skipped, not fatal.
  }
}

async function pullGarments(client: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await client.from("garments").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as RemoteGarmentRow[]) {
    safely(() => upsertGarmentFromRemote(garmentFromRemoteRow(row)));
  }
}

async function pullOutfits(client: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await client.from("outfits").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as OutfitRow[]) {
    safely(() => upsertOutfitFromRemote(outfitFromRow(row)));
  }
}

async function pullOutfitItems(client: SupabaseClient): Promise<void> {
  const { data, error } = await client.from("outfit_items").select("*");
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as OutfitItemRow[]) {
    safely(() => upsertOutfitItemFromRemote(outfitItemFromRow(row)));
  }
}

async function pullCalendar(client: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await client.from("calendar_entries").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as CalendarEntryRow[]) {
    safely(() => upsertCalendarEntryFromRemote(calendarEntryFromRow(row)));
  }
}

async function pullWear(client: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await client.from("wear_events").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as WearEventRow[]) {
    safely(() => upsertWearEventFromRemote(wearEventFromRow(row)));
  }
}

export interface SyncOutcome {
  error: string | null;
}

/**
 * Full push-then-pull, last-write-wins by `updated_at`. Deliberately not
 * incremental/CRDT — see product spec §28: keep it simple until the data
 * volume of a personal wardrobe actually demands otherwise.
 */
export async function syncNow(): Promise<SyncOutcome> {
  const client = getSupabaseClient();
  if (!client) return { error: "Cloud backup isn't set up yet." };

  const session = await getSession();
  if (!session) return { error: "Sign in first." };
  const userId = session.user.id;

  try {
    await pushGarments(client, userId);
    await pushOutfits(client, userId);
    await pushCalendar(client, userId);
    await pushWear(client, userId);

    await pullGarments(client, userId);
    await pullOutfits(client, userId);
    await pullOutfitItems(client);
    await pullCalendar(client, userId);
    await pullWear(client, userId);

    await setLastSyncedAt(nowIso());
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Sync failed." };
  }
}
