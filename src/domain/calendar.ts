import { getDb } from "../db/client";
import { calendarEntryFromRow, type CalendarEntryRow } from "../db/rows";
import { generateId, nowIso } from "./id";
import type { CalendarEntry } from "./types";

export function getCalendarEntry(date: string): CalendarEntry | null {
  const db = getDb();
  const row = db.getFirstSync<CalendarEntryRow>(
    "SELECT * FROM calendar_entries WHERE date = ?",
    date,
  );
  return row ? calendarEntryFromRow(row) : null;
}

export function listCalendarEntries(startDate: string, endDate: string): CalendarEntry[] {
  const db = getDb();
  const rows = db.getAllSync<CalendarEntryRow>(
    "SELECT * FROM calendar_entries WHERE date BETWEEN ? AND ? ORDER BY date ASC",
    startDate,
    endDate,
  );
  return rows.map(calendarEntryFromRow);
}

/** Plans (or replans) an outfit for a given date. Upserts on the unique date. */
export function planOutfitForDate(date: string, outfitId: string | null): CalendarEntry {
  const db = getDb();
  const existing = getCalendarEntry(date);
  const timestamp = nowIso();

  if (existing) {
    db.runSync(
      "UPDATE calendar_entries SET planned_outfit_id = ?, updated_at = ? WHERE id = ?",
      outfitId,
      timestamp,
      existing.id,
    );
    return { ...existing, plannedOutfitId: outfitId, updatedAt: timestamp };
  }

  const id = generateId();
  db.runSync(
    `INSERT INTO calendar_entries (id, user_id, date, planned_outfit_id, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?)`,
    id,
    date,
    outfitId,
    timestamp,
    timestamp,
  );
  return { id, userId: null, date, plannedOutfitId: outfitId, createdAt: timestamp, updatedAt: timestamp };
}

/** Moves a planned outfit from one date to another (e.g. drag on the calendar). */
export function movePlannedOutfit(fromDate: string, toDate: string): void {
  const entry = getCalendarEntry(fromDate);
  if (!entry || !entry.plannedOutfitId) return;
  planOutfitForDate(toDate, entry.plannedOutfitId);
  planOutfitForDate(fromDate, null);
}
