import type { SQLiteDatabase } from 'expo-sqlite';
import type { Exercise } from '@/src/domain';
import type { ExerciseRepository as IRepo, ListOptions } from '@/src/domain';
import { generateId, now } from '../helpers';

type Row = {
  id: string;
  user_id: string | null;
  name: string;
  is_built_in: number;
  created_at: string;
  updated_at: string;
};

function rowToExercise(r: Row): Exercise {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    isBuiltIn: r.is_built_in !== 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function createExerciseRepository(db: SQLiteDatabase): IRepo {
  return {
    async create(entity) {
      const id = entity.id ?? generateId();
      const ts = now();
      await db.runAsync(
        'INSERT INTO exercise (id, user_id, name, is_built_in, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        entity.userId ?? null,
        entity.name,
        entity.isBuiltIn ? 1 : 0,
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
      await db.runAsync(`UPDATE exercise SET ${updates.join(', ')} WHERE id = ?`, params);
      const ex = await this.getById(id);
      if (!ex) throw new Error('Exercise not found after update');
      return ex;
    },
    async delete(id) {
      await db.runAsync('DELETE FROM exercise WHERE id = ?', id);
    },
    async getById(id) {
      const row = await db.getFirstAsync<Row>('SELECT * FROM exercise WHERE id = ?', id);
      return row ? rowToExercise(row) : null;
    },
    async list(options) {
      const filter = options?.filter;
      const search = filter?.search?.trim().toLowerCase();
      let sql = 'SELECT * FROM exercise WHERE 1=1';
      const params: (string | number)[] = [];

      if (filter?.userId !== undefined && filter?.isBuiltIn !== undefined) {
        if (filter.userId === null && filter.isBuiltIn) {
          sql += ' AND user_id IS NULL AND is_built_in = 1';
        } else if (filter.userId) {
          sql += ' AND (user_id = ? OR (user_id IS NULL AND is_built_in = 1))';
          params.push(filter.userId as string);
        }
      } else if (filter?.userId !== undefined && filter.userId !== null) {
        sql += ' AND (user_id = ? OR user_id IS NULL)';
        params.push(filter.userId);
      } else if (filter?.isBuiltIn !== undefined) {
        sql += ' AND is_built_in = ?';
        params.push(filter.isBuiltIn ? 1 : 0);
      }

      if (search) {
        sql += ' AND LOWER(name) LIKE ?';
        params.push(`%${search}%`);
      }

      sql += ' ORDER BY name ASC';
      const limit = options?.limit ?? 200;
      const offset = options?.offset ?? 0;
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = await db.getAllAsync<Row>(sql, params);
      return rows.map(rowToExercise);
    },
  };
}
