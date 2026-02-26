/**
 * SQLite database init and migrations. Adapter layer only.
 */

import * as SQLite from 'expo-sqlite';
import {
  STORAGE_ENGINE_KEY,
  SCHEMA_VERSION_KEY,
  CURRENT_STORAGE_ENGINE,
  CURRENT_SCHEMA_VERSION,
} from './versioning';
import { up as migration001 } from './migrations/001_initial';

const DB_NAME = 'gym_tracker.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export type SQLiteDatabase = SQLite.SQLiteDatabase;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(dbInstance);
  return dbInstance;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(migration001);

  const existingVersion = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM _meta WHERE key = ?',
    SCHEMA_VERSION_KEY
  );
  const version = existingVersion ? parseInt(existingVersion.value, 10) : 0;

  if (version < 1) {
    // Already applied in execAsync above; just set meta
    await setMeta(db, STORAGE_ENGINE_KEY, CURRENT_STORAGE_ENGINE);
    await setMeta(db, SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
  }
}

function setMeta(db: SQLite.SQLiteDatabase, key: string, value: string) {
  return db.runAsync('INSERT OR REPLACE INTO _meta (key, value) VALUES (?, ?)', key, value);
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
