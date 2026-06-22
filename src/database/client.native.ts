import type { SQLiteDatabase } from 'expo-sqlite';

import { MIGRATIONS } from './migrations';
import { resetSyncToCleanState } from './repair';
import { seedDatabase } from './seed';

let dbInstance: SQLiteDatabase | null = null;

function runMigrations(db: SQLiteDatabase): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const row = db.getFirstSync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1',
  );
  const currentVersion = row?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      db.execSync(migration.sql);
      db.runSync(
        'INSERT OR REPLACE INTO schema_version (version) VALUES (?)',
        migration.version,
      );
    }
  }
}

export function isDatabaseAvailable(): boolean {
  return dbInstance !== null;
}

export function getDatabase(): SQLiteDatabase {
  if (!dbInstance) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return dbInstance;
}

export async function initDatabase(): Promise<SQLiteDatabase> {
  if (!dbInstance) {
    const { openDatabaseSync } = await import('expo-sqlite');
    dbInstance = openDatabaseSync('mi-asistencia.db');
    runMigrations(dbInstance);
    seedDatabase(dbInstance);
    await resetSyncToCleanState(dbInstance);
  }
  return dbInstance;
}
