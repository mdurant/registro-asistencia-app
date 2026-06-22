import type { SQLiteDatabase } from 'expo-sqlite';

import { MIGRATIONS } from './migrations';
import { resetSyncToCleanState } from './repair';
import { seedDatabaseAsync } from './seed';

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<SQLiteDatabase | null> | null = null;

function isSqliteSupportedOnWeb(): boolean {
  return (
    typeof SharedArrayBuffer !== 'undefined' &&
    typeof globalThis.crossOriginIsolated === 'boolean' &&
    globalThis.crossOriginIsolated
  );
}

async function runMigrationsAsync(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1',
  );
  const currentVersion = row?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      await db.execAsync(migration.sql);
      await db.runAsync(
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
    throw new Error(
      'SQLite no está disponible en web. Usa Expo Go en tu dispositivo móvil (escanea el QR).',
    );
  }
  return dbInstance;
}

export async function initDatabase(): Promise<SQLiteDatabase | null> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!isSqliteSupportedOnWeb()) {
      console.warn(
        '[Mi Asistencia] SQLite web requiere SharedArrayBuffer (COOP/COEP). ' +
          'Usa Expo Go en móvil para la experiencia completa.',
      );
      return null;
    }

    const { openDatabaseAsync } = await import('expo-sqlite');
    const db = await openDatabaseAsync('mi-asistencia.db');
    await runMigrationsAsync(db);
    await seedDatabaseAsync(db);
    await resetSyncToCleanState(db);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}
