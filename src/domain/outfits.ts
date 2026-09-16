import { getDb } from "../db/client";
import { garmentFromRow, outfitFromRow, outfitItemFromRow, type GarmentRow, type OutfitItemRow, type OutfitRow } from "../db/rows";
import { generateId, nowIso } from "./id";
import type { Outfit, OutfitItem, OutfitWithItems } from "./types";

export function createOutfit(name: string | null = null): Outfit {
  const db = getDb();
  const id = generateId();
  const timestamp = nowIso();
  db.runSync(
    "INSERT INTO outfits (id, user_id, name, created_at, updated_at) VALUES (?, NULL, ?, ?, ?)",
    id,
    name,
    timestamp,
    timestamp,
  );
  return { id, userId: null, name, createdAt: timestamp, updatedAt: timestamp };
}

export function listOutfits(): Outfit[] {
  const db = getDb();
  const rows = db.getAllSync<OutfitRow>("SELECT * FROM outfits ORDER BY updated_at DESC");
  return rows.map(outfitFromRow);
}

export function getOutfitWithItems(outfitId: string): OutfitWithItems | null {
  const db = getDb();
  const outfitRow = db.getFirstSync<OutfitRow>("SELECT * FROM outfits WHERE id = ?", outfitId);
  if (!outfitRow) return null;

  // Two queries instead of a JOIN with SELECT * to avoid the `id` column
  // from garments silently overwriting outfit_items.id in the result object.
  const itemRows = db.getAllSync<OutfitItemRow>(
    "SELECT * FROM outfit_items WHERE outfit_id = ? ORDER BY z_index ASC",
    outfitId,
  );
  const garmentRows = db.getAllSync<GarmentRow>(
    `SELECT * FROM garments WHERE id IN (${itemRows.map(() => "?").join(",") || "NULL"})`,
    ...itemRows.map((r) => r.garment_id),
  );
  const garmentsById = new Map(garmentRows.map((row) => [row.id, garmentFromRow(row)]));

  return {
    ...outfitFromRow(outfitRow),
    items: itemRows
      .map((row) => {
        const garment = garmentsById.get(row.garment_id);
        if (!garment) return null;
        return { ...outfitItemFromRow(row), garment };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };
}

export interface AddOutfitItemInput {
  outfitId: string;
  garmentId: string;
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  zIndex?: number;
}

export function addOutfitItem(input: AddOutfitItemInput): OutfitItem {
  const db = getDb();
  const id = generateId();
  const scale = input.scale ?? 1;
  const rotation = input.rotation ?? 0;
  const zIndex = input.zIndex ?? 0;

  db.runSync(
    `INSERT INTO outfit_items (id, outfit_id, garment_id, x, y, scale, rotation, z_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.outfitId,
    input.garmentId,
    input.x,
    input.y,
    scale,
    rotation,
    zIndex,
  );
  touchOutfit(input.outfitId);

  return { id, outfitId: input.outfitId, garmentId: input.garmentId, x: input.x, y: input.y, scale, rotation, zIndex };
}

export function updateOutfitItemTransform(
  itemId: string,
  transform: Partial<Pick<OutfitItem, "x" | "y" | "scale" | "rotation" | "zIndex">>,
): void {
  const db = getDb();
  const row = db.getFirstSync<OutfitItemRow>("SELECT * FROM outfit_items WHERE id = ?", itemId);
  if (!row) return;

  db.runSync(
    "UPDATE outfit_items SET x = ?, y = ?, scale = ?, rotation = ?, z_index = ? WHERE id = ?",
    transform.x ?? row.x,
    transform.y ?? row.y,
    transform.scale ?? row.scale,
    transform.rotation ?? row.rotation,
    transform.zIndex ?? row.z_index,
    itemId,
  );
  touchOutfit(row.outfit_id);
}

export function removeOutfitItem(itemId: string): void {
  const db = getDb();
  const row = db.getFirstSync<OutfitItemRow>("SELECT * FROM outfit_items WHERE id = ?", itemId);
  db.runSync("DELETE FROM outfit_items WHERE id = ?", itemId);
  if (row) touchOutfit(row.outfit_id);
}

export function renameOutfit(outfitId: string, name: string | null): void {
  const db = getDb();
  db.runSync("UPDATE outfits SET name = ?, updated_at = ? WHERE id = ?", name, nowIso(), outfitId);
}

function touchOutfit(outfitId: string): void {
  const db = getDb();
  db.runSync("UPDATE outfits SET updated_at = ? WHERE id = ?", nowIso(), outfitId);
}

/** Duplicates an outfit and all its items, ready for "duplicate & tweak". */
export function duplicateOutfit(outfitId: string): OutfitWithItems | null {
  const source = getOutfitWithItems(outfitId);
  if (!source) return null;

  const db = getDb();
  const newOutfit = createOutfit(source.name);

  db.withTransactionSync(() => {
    for (const item of source.items) {
      addOutfitItem({
        outfitId: newOutfit.id,
        garmentId: item.garmentId,
        x: item.x,
        y: item.y,
        scale: item.scale,
        rotation: item.rotation,
        zIndex: item.zIndex,
      });
    }
  });

  return getOutfitWithItems(newOutfit.id);
}

export function deleteOutfit(outfitId: string): void {
  const db = getDb();
  db.runSync("DELETE FROM outfits WHERE id = ?", outfitId);
}
