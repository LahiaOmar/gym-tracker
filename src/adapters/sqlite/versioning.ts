/**
 * Storage versioning (MVP §7.1). Adapter layer only.
 * storageEngine and schemaVersion stored in DB; read/write here only.
 */

export const STORAGE_ENGINE_KEY = 'storageEngine';
export const SCHEMA_VERSION_KEY = 'schemaVersion';

export const CURRENT_STORAGE_ENGINE = 'sqlite';
export const CURRENT_SCHEMA_VERSION = 1;

export interface StorageMeta {
  storageEngine: string;
  schemaVersion: number;
}
