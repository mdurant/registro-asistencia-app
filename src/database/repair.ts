import type { SQLiteDatabase } from 'expo-sqlite';

async function run(db: SQLiteDatabase, sql: string, ...params: (string | number)[]): Promise<void> {
  if ('runAsync' in db && typeof db.runAsync === 'function') {
    await db.runAsync(sql, ...params);
    return;
  }
  db.runSync(sql, ...params);
}

/** Limpia colas legacy corruptas (web + sync API mezclada). */
export async function repairQueues(db: SQLiteDatabase): Promise<void> {
  try {
    await run(db, 'DELETE FROM sync_queue');
    await run(db, 'DELETE FROM email_queue');
  } catch {
    // ignorar
  }
}

/**
 * Estado demo: cola de sync en cero y registros marcados como sincronizados.
 * Evita banners de error por intentos fallidos de sesiones anteriores.
 */
export async function resetSyncToCleanState(db: SQLiteDatabase): Promise<void> {
  try {
    await run(db, 'DELETE FROM sync_queue');
    await run(db, 'DELETE FROM email_queue');
    await run(
      db,
      `UPDATE attendance_events
       SET sync_status = 'synced', synced_at = datetime('now')
       WHERE sync_status = 'pending'`,
    );
    await run(
      db,
      `UPDATE login_events
       SET sync_status = 'synced', synced_at = datetime('now')
       WHERE sync_status = 'pending'`,
    );
  } catch {
    // ignorar
  }
}
