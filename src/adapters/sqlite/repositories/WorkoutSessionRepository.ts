import type { SQLiteDatabase } from 'expo-sqlite';
import type { WorkoutSession } from '@/src/domain';
import type { WorkoutSessionRepository as IRepo, ListOptions } from '@/src/domain';
import { generateId, now } from '../helpers';

type Row = {
  id: string;
  user_id: string;
  category_id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function rowToSession(r: Row): WorkoutSession {
  return {
    id: r.id,
    userId: r.user_id,
    categoryId: r.category_id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function createWorkoutSessionRepository(db: SQLiteDatabase): IRepo {
  return {
    async create(entity) {
      const id = entity.id ?? generateId();
      const ts = now();
      await db.runAsync(
        `INSERT INTO workout_session (id, user_id, category_id, started_at, ended_at, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        entity.userId,
        entity.categoryId,
        entity.startedAt,
        entity.endedAt ?? null,
        entity.notes ?? null,
        ts,
        ts
      );
      return {
        ...entity,
        id,
        createdAt: ts,
        updatedAt: ts,
      };
    },
    async update(id, patch) {
      const ts = now();
      const updates: string[] = ['updated_at = ?'];
      const params: (string | number | null)[] = [ts];
      if (patch.endedAt !== undefined) {
        updates.push('ended_at = ?');
        params.push(patch.endedAt);
      }
      if (patch.notes !== undefined) {
        updates.push('notes = ?');
        params.push(patch.notes);
      }
      params.push(id);
      await db.runAsync(`UPDATE workout_session SET ${updates.join(', ')} WHERE id = ?`, params);
      const s = await this.getById(id);
      if (!s) throw new Error('WorkoutSession not found after update');
      return s;
    },
    async delete(id) {
      await db.runAsync('DELETE FROM workout_set WHERE workout_exercise_id IN (SELECT id FROM workout_exercise WHERE session_id = ?)', id);
      await db.runAsync('DELETE FROM workout_exercise WHERE session_id = ?', id);
      await db.runAsync('DELETE FROM workout_session WHERE id = ?', id);
    },
    async getById(id) {
      const row = await db.getFirstAsync<Row>('SELECT * FROM workout_session WHERE id = ?', id);
      return row ? rowToSession(row) : null;
    },
    async list(options) {
      const userId = options?.filter?.userId;
      if (!userId) return [];
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const sortDir = options?.sort?.direction === 'asc' ? 'ASC' : 'DESC';
      const rows = await db.getAllAsync<Row>(
        'SELECT * FROM workout_session WHERE user_id = ? ORDER BY started_at ' + sortDir + ' LIMIT ? OFFSET ?',
        userId,
        limit,
        offset
      );
      return rows.map(rowToSession);
    },
    async listSessionsByDateRange(userId, from, to) {
      const rows = await db.getAllAsync<Row>(
        'SELECT * FROM workout_session WHERE user_id = ? AND started_at >= ? AND started_at <= ? ORDER BY started_at ASC',
        userId,
        from,
        to
      );
      return rows.map(rowToSession);
    },
  };
}
