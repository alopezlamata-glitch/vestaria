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

/** Every calendar entry — used by cloud backup to push/pull the whole calendar in one pass. */
export function listAllCalendarEntries(): CalendarEntry[] {
  const db = getDb();
  const rows = db.getAllSync<CalendarEntryRow>("SELECT * FROM calendar_entries ORDER BY date ASC");
  return rows.map(calendarEntryFromRow);
}

export function upsertCalendarEntryFromRemote(remote: CalendarEntry): void {
  const db = getDb();
  const local = db.getFirstSync<CalendarEntryRow>("SELECT * FROM calendar_entries WHERE id = ?", remote.id);
  if (local && local.updated_at >= remote.updatedAt) return;

  db.runSync(
    `INSERT INTO calendar_entries (id, user_id, date, planned_outfit_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET planned_outfit_id = excluded.planned_outfit_id, updated_at = excluded.updated_at`,
    remote.id,
    remote.userId,
    remote.date,
    remote.plannedOutfitId,
    remote.createdAt,
    remote.updatedAt,
  );
}
