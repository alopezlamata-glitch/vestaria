import { getDb } from "../db/client";
import { garmentFromRow, type GarmentRow } from "../db/rows";
import { generateId, nowIso, toDateString } from "./id";
import type { Garment, GarmentCategory, SemanticColor } from "./types";

export interface CreateGarmentInput {
  name: string;
  category: GarmentCategory;
  primaryColor: SemanticColor;
  subcategory?: string | null;
  imageLocalUri?: string | null;
  thumbLocalUri?: string | null;
}

/** Creates a garment locally and returns it immediately (optimistic, no network). */
export function createGarment(input: CreateGarmentInput): Garment {
  const db = getDb();
  const id = generateId();
  const timestamp = nowIso();

  db.runSync(
    `INSERT INTO garments
      (id, user_id, name, category, subcategory, primary_color, image_local_uri, thumb_local_uri, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name,
    input.category,
    input.subcategory ?? null,
    input.primaryColor,
    input.imageLocalUri ?? null,
    input.thumbLocalUri ?? null,
    timestamp,
    timestamp,
  );

  return {
    id,
    userId: null,
    name: input.name,
    category: input.category,
    subcategory: input.subcategory ?? null,
    primaryColor: input.primaryColor,
    imageLocalUri: input.imageLocalUri ?? null,
    imageRemoteUrl: null,
    thumbLocalUri: input.thumbLocalUri ?? null,
    thumbRemoteUrl: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
    purchasePrice: null,
    currency: null,
  };
}

export interface GarmentFilters {
  category?: GarmentCategory;
  color?: SemanticColor;
  search?: string;
  includeArchived?: boolean;
  /** Only garments never worn, or not worn within this many days. */
  notWornInDays?: number;
}

export function listGarments(filters: GarmentFilters = {}): Garment[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (!filters.includeArchived) {
    clauses.push("archived_at IS NULL");
  }
  if (filters.category) {
    clauses.push("category = ?");
    params.push(filters.category);
  }
  if (filters.color) {
    clauses.push("primary_color = ?");
    params.push(filters.color);
  }
  if (filters.search) {
    clauses.push("(name LIKE ? OR category LIKE ? OR primary_color LIKE ?)");
    const like = `%${filters.search.toLowerCase()}%`;
    params.push(like, like, like);
  }
  if (filters.notWornInDays !== undefined) {
    clauses.push(`id NOT IN (
      SELECT oi.garment_id FROM outfit_items oi
      JOIN wear_events we ON we.actual_outfit_id = oi.outfit_id
      WHERE we.date >= ?
    )`);
    params.push(toDateString(new Date(Date.now() - filters.notWornInDays * 86400000)));
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db.getAllSync<GarmentRow>(
    `SELECT * FROM garments ${where} ORDER BY created_at DESC`,
    ...params,
  );
  return rows.map(garmentFromRow);
}

export function getGarment(id: string): Garment | null {
  const db = getDb();
  const row = db.getFirstSync<GarmentRow>("SELECT * FROM garments WHERE id = ?", id);
  return row ? garmentFromRow(row) : null;
}

export function updateGarment(id: string, patch: Partial<CreateGarmentInput>): void {
  const db = getDb();
  const existing = getGarment(id);
  if (!existing) return;

  db.runSync(
    `UPDATE garments SET name = ?, category = ?, subcategory = ?, primary_color = ?, updated_at = ? WHERE id = ?`,
    patch.name ?? existing.name,
    patch.category ?? existing.category,
    patch.subcategory !== undefined ? patch.subcategory : existing.subcategory,
    patch.primaryColor ?? existing.primaryColor,
    nowIso(),
    id,
  );
}

/** Swaps in the processed (resized/cropped) image once the pipeline finishes. */
export function updateGarmentImages(id: string, images: { imageLocalUri: string; thumbLocalUri: string }): void {
  const db = getDb();
  db.runSync(
    "UPDATE garments SET image_local_uri = ?, thumb_local_uri = ?, updated_at = ? WHERE id = ?",
    images.imageLocalUri,
    images.thumbLocalUri,
    nowIso(),
    id,
  );
}

/** Records where a garment's photo landed after cloud backup uploaded it. */
export function updateGarmentRemoteUrls(id: string, urls: { imageRemoteUrl: string; thumbRemoteUrl: string }): void {
  const db = getDb();
  db.runSync(
    "UPDATE garments SET image_remote_url = ?, thumb_remote_url = ? WHERE id = ?",
    urls.imageRemoteUrl,
    urls.thumbRemoteUrl,
    id,
  );
}

/**
 * Merges a garment pulled from the cloud into the local database —
 * last-write-wins by `updatedAt`, and never clobbers a local file path with
 * `null` just because the remote row doesn't know about this device's files.
 */
export function upsertGarmentFromRemote(remote: Garment): void {
  const db = getDb();
  const local = getGarment(remote.id);
  if (local && local.updatedAt >= remote.updatedAt) return;

  db.runSync(
    `INSERT INTO garments
      (id, user_id, name, category, subcategory, primary_color, image_local_uri, image_remote_url, thumb_local_uri, thumb_remote_url, created_at, updated_at, archived_at, purchase_price, currency)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       category = excluded.category,
       subcategory = excluded.subcategory,
       primary_color = excluded.primary_color,
       image_remote_url = excluded.image_remote_url,
       thumb_remote_url = excluded.thumb_remote_url,
       updated_at = excluded.updated_at,
       archived_at = excluded.archived_at,
       purchase_price = excluded.purchase_price,
       currency = excluded.currency`,
    remote.id,
    remote.userId,
    remote.name,
    remote.category,
    remote.subcategory,
    remote.primaryColor,
    local?.imageLocalUri ?? null,
    remote.imageRemoteUrl,
    local?.thumbLocalUri ?? null,
    remote.thumbRemoteUrl,
    remote.createdAt,
    remote.updatedAt,
    remote.archivedAt,
    remote.purchasePrice,
    remote.currency,
  );
}

export function archiveGarment(id: string): void {
  const db = getDb();
  db.runSync("UPDATE garments SET archived_at = ? WHERE id = ?", nowIso(), id);
}

/** Wear count derived from confirmed wear events whose outfit included this garment. */
export function getGarmentWearCount(garmentId: string): number {
  const db = getDb();
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(DISTINCT we.id) as count
     FROM wear_events we
     JOIN outfit_items oi ON oi.outfit_id = we.actual_outfit_id
     WHERE oi.garment_id = ?`,
    garmentId,
  );
  return row?.count ?? 0;
}

export function getGarmentLastWorn(garmentId: string): string | null {
  const db = getDb();
  const row = db.getFirstSync<{ date: string }>(
    `SELECT we.date as date
     FROM wear_events we
     JOIN outfit_items oi ON oi.outfit_id = we.actual_outfit_id
     WHERE oi.garment_id = ?
     ORDER BY we.date DESC
     LIMIT 1`,
    garmentId,
  );
  return row?.date ?? null;
}

/** Garments never worn, or not worn within `days` — used by Insights. */
export function getGarmentsNotWornSince(days: number, limit = 12): Garment[] {
  return listGarments({ notWornInDays: days }).slice(0, limit);
}
