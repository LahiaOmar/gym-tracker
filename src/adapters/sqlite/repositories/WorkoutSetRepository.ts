import type { SQLiteDatabase } from 'expo-sqlite';
import type { WorkoutSet } from '@/src/domain';
import type { WorkoutSetRepository as IRepo, ListOptions } from '@/src/domain';
import { generateId, now } from '../helpers';

type Row = {
  id: string;
  workout_exercise_id: string;
  order: number;
  reps: number;
  weight: number;
  created_at: string;
  updated_at: string;
};

function rowToSet(r: Row): WorkoutSet {
  return {
    id: r.id,
    workoutExerciseId: r.workout_exercise_id,
    order: r.order,
    reps: r.reps,
    weight: r.weight,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function createWorkoutSetRepository(db: SQLiteDatabase): IRepo {
  return {
    async create(entity) {
      const id = entity.id ?? generateId();
      const ts = now();
      await db.runAsync(
        'INSERT INTO workout_set (id, workout_exercise_id, "order", reps, weight, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        id,
        entity.workoutExerciseId,
        entity.order,
        entity.reps,
        entity.weight,
        ts,
        ts
      );
      return { ...entity, id, createdAt: ts, updatedAt: ts };
    },
    async update(id, patch) {
      const ts = now();
      const updates: string[] = ['updated_at = ?'];
      const params: (string | number)[] = [ts];
      if (patch.reps !== undefined) {
        updates.push('reps = ?');
        params.push(patch.reps);
      }
      if (patch.weight !== undefined) {
        updates.push('weight = ?');
        params.push(patch.weight);
      }
      if (patch.order !== undefined) {
        updates.push('"order" = ?');
        params.push(patch.order);
      }
      params.push(id);
      await db.runAsync(`UPDATE workout_set SET ${updates.join(', ')} WHERE id = ?`, params);
      const s = await this.getById(id);
      if (!s) throw new Error('WorkoutSet not found after update');
      return s;
    },
    async delete(id) {
      await db.runAsync('DELETE FROM workout_set WHERE id = ?', id);
    },
    async getById(id) {
      const row = await db.getFirstAsync<Row>('SELECT * FROM workout_set WHERE id = ?', id);
      return row ? rowToSet(row) : null;
    },
    async list(options) {
      const workoutExerciseId = options?.filter?.workoutExerciseId;
      if (!workoutExerciseId) return [];
      const rows = await db.getAllAsync<Row>(
        'SELECT * FROM workout_set WHERE workout_exercise_id = ? ORDER BY "order" ASC',
        workoutExerciseId
      );
      return rows.map(rowToSet);
    },
    async listSetsByExercise(userId, exerciseId, from?, to?) {
      let sql = `SELECT s.* FROM workout_set s
        INNER JOIN workout_exercise we ON we.id = s.workout_exercise_id
        INNER JOIN workout_session ws ON ws.id = we.session_id
        WHERE ws.user_id = ? AND we.exercise_id = ?`;
      const params: (string | number)[] = [userId, exerciseId];
      if (from) {
        sql += ' AND ws.started_at >= ?';
        params.push(from);
      }
      if (to) {
        sql += ' AND ws.started_at <= ?';
        params.push(to);
      }
      sql += ' ORDER BY s.created_at ASC';
      const rows = await db.getAllAsync<Row>(sql, params);
      return rows.map(rowToSet);
    },
  };
}
