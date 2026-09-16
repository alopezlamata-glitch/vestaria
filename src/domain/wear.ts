import { getDb } from "../db/client";
import { wearEventFromRow, type WearEventRow } from "../db/rows";
import { generateId, nowIso } from "./id";
import type { WearEvent } from "./types";

export function getWearEvent(date: string): WearEvent | null {
  const db = getDb();
  const row = db.getFirstSync<WearEventRow>("SELECT * FROM wear_events WHERE date = ?", date);
  return row ? wearEventFromRow(row) : null;
}

/**
 * Records that an outfit was actually worn on a date. This is the ONLY thing
 * that should increment a garment's wear count — planning an outfit must not.
 */
export function confirmWear(date: string, outfitId: string): WearEvent {
  const db = getDb();
  const existing = getWearEvent(date);
  const timestamp = nowIso();

  if (existing) {
    db.runSync("UPDATE wear_events SET actual_outfit_id = ? WHERE id = ?", outfitId, existing.id);
    return { ...existing, actualOutfitId: outfitId };
  }

  const id = generateId();
  db.runSync(
    "INSERT INTO wear_events (id, user_id, date, actual_outfit_id, created_at) VALUES (?, NULL, ?, ?, ?)",
    id,
    date,
    outfitId,
    timestamp,
  );
  return { id, userId: null, date, actualOutfitId: outfitId, createdAt: timestamp };
}

export function undoWear(date: string): void {
  const db = getDb();
  db.runSync("DELETE FROM wear_events WHERE date = ?", date);
}

export function listWearEvents(startDate: string, endDate: string): WearEvent[] {
  const db = getDb();
  const rows = db.getAllSync<WearEventRow>(
    "SELECT * FROM wear_events WHERE date BETWEEN ? AND ? ORDER BY date DESC",
    startDate,
    endDate,
  );
  return rows.map(wearEventFromRow);
}

export interface MonthlyInsights {
  garmentsWornCount: number;
  outfitsWornCount: number;
  mostWornGarmentIds: { garmentId: string; count: number }[];
}

export function getMonthlyInsights(startDate: string, endDate: string): MonthlyInsights {
  const db = getDb();

  const outfitsWorn = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM wear_events
     WHERE date BETWEEN ? AND ? AND actual_outfit_id IS NOT NULL`,
    startDate,
    endDate,
  );

  const garmentRows = db.getAllSync<{ garment_id: string; count: number }>(
    `SELECT oi.garment_id as garment_id, COUNT(*) as count
     FROM wear_events we
     JOIN outfit_items oi ON oi.outfit_id = we.actual_outfit_id
     WHERE we.date BETWEEN ? AND ?
     GROUP BY oi.garment_id
     ORDER BY count DESC`,
    startDate,
    endDate,
  );

  return {
    garmentsWornCount: garmentRows.length,
    outfitsWornCount: outfitsWorn?.count ?? 0,
    mostWornGarmentIds: garmentRows.map((r) => ({ garmentId: r.garment_id, count: r.count })),
  };
}
