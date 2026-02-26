import type { SQLiteDatabase } from 'expo-sqlite';
import type { TrainingCategory } from '@/src/domain';
import type { TrainingCategoryRepository as IRepo, ListOptions } from '@/src/domain';
import { generateId, now } from '../helpers';

type Row = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

function rowToCategory(r: Row): TrainingCategory {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function createTrainingCategoryRepository(db: SQLiteDatabase): IRepo {
  return {
    async create(entity) {
      const id = entity.id ?? generateId();
      const ts = now();
      await db.runAsync(
        'INSERT INTO training_category (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        id,
        entity.userId,
        entity.name,
        ts,
        ts
      );
      return { ...entity, id, createdAt: ts, updatedAt: ts };
    },
    async update(id, patch) {
      const ts = now();
      const updates: string[] = ['updated_at = ?'];
      const params: (string | number)[] = [ts];
      if (patch.name !== undefined) {
        updates.push('name = ?');
        params.push(patch.name);
      }
      params.push(id);
      await db.runAsync(`UPDATE training_category SET ${updates.join(', ')} WHERE id = ?`, params);
      const cat = await this.getById(id);
      if (!cat) throw new Error('TrainingCategory not found after update');
      return cat;
    },
    async delete(id) {
      await db.runAsync('DELETE FROM training_category WHERE id = ?', id);
    },
    async getById(id) {
      const row = await db.getFirstAsync<Row>('SELECT * FROM training_category WHERE id = ?', id);
      return row ? rowToCategory(row) : null;
    },
    async list(options) {
      const userId = options?.filter?.userId;
      if (!userId) return [];
      const limit = options?.limit ?? 100;
      const offset = options?.offset ?? 0;
      const rows = await db.getAllAsync<Row>(
        'SELECT * FROM training_category WHERE user_id = ? ORDER BY name ASC LIMIT ? OFFSET ?',
        userId,
        limit,
        offset
      );
      return rows.map(rowToCategory);
    },
  };
}
