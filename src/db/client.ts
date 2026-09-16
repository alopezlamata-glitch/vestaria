import * as SQLite from "expo-sqlite";

const DB_NAME = "vestaria.db";

let db: SQLite.SQLiteDatabase | null = null;

const SCHEMA_VERSION = 1;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
}

/** Runs schema migrations. Safe to call on every app start. */
export function migrate(): void {
  const database = getDb();
  const { user_version: currentVersion } = database.getFirstSync<{ user_version: number }>(
    "PRAGMA user_version",
  )!;

  if (currentVersion >= SCHEMA_VERSION) return;

  database.execSync("PRAGMA journal_mode = WAL");
  database.withTransactionSync(() => {
    database.execSync(`
      CREATE TABLE IF NOT EXISTS garments (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        primary_color TEXT NOT NULL,
        image_local_uri TEXT,
        image_remote_url TEXT,
        thumb_local_uri TEXT,
        thumb_remote_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        purchase_price REAL,
        currency TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_garments_category ON garments(category);
      CREATE INDEX IF NOT EXISTS idx_garments_archived ON garments(archived_at);

      CREATE TABLE IF NOT EXISTS outfits (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS outfit_items (
        id TEXT PRIMARY KEY NOT NULL,
        outfit_id TEXT NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
        garment_id TEXT NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
        x REAL NOT NULL,
        y REAL NOT NULL,
        scale REAL NOT NULL DEFAULT 1,
        rotation REAL NOT NULL DEFAULT 0,
        z_index INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit ON outfit_items(outfit_id);
      CREATE INDEX IF NOT EXISTS idx_outfit_items_garment ON outfit_items(garment_id);

      CREATE TABLE IF NOT EXISTS calendar_entries (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        date TEXT NOT NULL,
        planned_outfit_id TEXT REFERENCES outfits(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(date)
      );

      CREATE TABLE IF NOT EXISTS wear_events (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        date TEXT NOT NULL,
        actual_outfit_id TEXT REFERENCES outfits(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_wear_events_date ON wear_events(date);
    `);
    database.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}
