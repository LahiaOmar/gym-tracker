/**
 * SQLite adapter: migrations and repository implementations.
 * Only storage implementation; no domain logic.
 */

export { getDb, closeDb, type SQLiteDatabase } from './db';
export { createRepositories, type SqliteRepositories } from './createRepositories';
export { seedBuiltInExercises, seedDefaultCategories } from './seed';
export * from './versioning';
