import * as SQLite from 'expo-sqlite';

// Целевая версия схемы. Поднимай на 1 при каждом изменении структуры БД
// и добавляй соответствующую миграцию в реестр migrations.
export const DATABASE_VERSION = 1;

type Migration = (db: SQLite.SQLiteDatabase) => Promise<void>;

/**
 * Реестр миграций.
 * Ключ — версия, В КОТОРУЮ переводит миграция.
 * Старые миграции НЕ редактируем, только добавляем новые.
 * Каждая миграция должна быть идемпотентной (IF NOT EXISTS).
 */
const migrations: Record<number, Migration> = {
  1: async (db) => {
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
    `);
  },

  // Шаблон для будущей миграции (не удаляй комментарий — пригодится):
  // 2: async (db) => {
  //   await db.execAsync(`ALTER TABLE markers ADD COLUMN description TEXT;`);
  // },
};

export async function initDatabase(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  // PRAGMA нельзя ставить внутри транзакции — выносим наружу
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Таблица версий должна существовать ДО её чтения
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );

  const currentVersion = row?.version ?? 0;

  // Случай 1: БД новее кода — работать нельзя, бросаем понятную ошибку
  if (currentVersion > DATABASE_VERSION) {
    throw new Error(
      `Версия базы (${currentVersion}) больше поддерживаемой (${DATABASE_VERSION}). Обновите приложение.`
    );
  }

  // Случай 2: всё актуально — выходим
  if (currentVersion === DATABASE_VERSION) {
    if (__DEV__) {
      console.log(`[DB] Схема актуальна (v${currentVersion})`);
    }
    return;
  }

  // Случай 3: нужно применить миграции
  if (__DEV__) {
    console.log(
      `[DB] Миграция схемы: v${currentVersion} → v${DATABASE_VERSION}`
    );
  }

  // Всё в одной транзакции: если упадёт — откатится целиком
  await db.withTransactionAsync(async () => {
    for (let v = currentVersion + 1; v <= DATABASE_VERSION; v++) {
      const migration = migrations[v];

      if (!migration) {
        throw new Error(`Не найдена миграция для версии ${v}`);
      }

      if (__DEV__) {
        console.log(`[DB] Применяю миграцию v${v}`);
      }

      await migration(db);
    }

    // Обновляем номер версии в той же транзакции
    if (row) {
      await db.runAsync(
        'UPDATE schema_version SET version = ?',
        DATABASE_VERSION
      );
    } else {
      await db.runAsync(
        'INSERT INTO schema_version (version) VALUES (?)',
        DATABASE_VERSION
      );
    }
  });

  if (__DEV__) {
    console.log(`[DB] Схема обновлена до v${DATABASE_VERSION}`);
  }
}