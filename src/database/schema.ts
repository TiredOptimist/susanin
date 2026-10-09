import * as SQLite from 'expo-sqlite';

export const DATABASE_VERSION = 1;

export async function initDatabase(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS markers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS marker_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marker_id INTEGER NOT NULL,
      uri TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marker_id) REFERENCES markers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_marker_images_marker_id
      ON marker_images(marker_id);

    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );

  if (!row) {
    await db.runAsync(
      'INSERT INTO schema_version (version) VALUES (?)',
      DATABASE_VERSION
    );

    if (__DEV__) {
      console.log(`[DB] Инициализирована схема версии ${DATABASE_VERSION}`);
    }
  }
}