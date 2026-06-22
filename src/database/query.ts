import type { SQLiteDatabase } from 'expo-sqlite';

type SqlParam = string | number | null;

export async function queryAll<T>(
  db: SQLiteDatabase,
  sql: string,
  ...params: SqlParam[]
): Promise<T[]> {
  return db.getAllAsync<T>(sql, ...params);
}

export async function queryFirst<T>(
  db: SQLiteDatabase,
  sql: string,
  ...params: SqlParam[]
): Promise<T | null> {
  return db.getFirstAsync<T>(sql, ...params);
}

export async function execute(
  db: SQLiteDatabase,
  sql: string,
  ...params: SqlParam[]
): Promise<void> {
  await db.runAsync(sql, ...params);
}
