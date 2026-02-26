import type { SQLiteDatabase } from 'expo-sqlite';
import type { WorkoutExercise } from '@/src/domain';
import type { WorkoutExerciseRepository as IRepo, ListOptions } from '@/src/domain';
import { generateId } from '../helpers';

type Row = {
  id: string;
  session_id: string;
  exercise_id: string;
  order: number;
  machine_name: string | null;
  seat_height: string | null;
  bench_angle_deg: number | null;
  grip: string | null;
};

function rowToWorkoutExercise(r: Row): WorkoutExercise {
  return {
    id: r.id,
    sessionId: r.session_id,
    exerciseId: r.exercise_id,
    order: r.order,
    machineName: r.machine_name,
    seatHeight: r.seat_height,
    benchAngleDeg: r.bench_angle_deg,
    grip: r.grip,
  };
}

export function createWorkoutExerciseRepository(db: SQLiteDatabase): IRepo {
  return {
    async create(entity) {
      const id = generateId();
      await db.runAsync(
        `INSERT INTO workout_exercise (id, session_id, exercise_id, "order", machine_name, seat_height, bench_angle_deg, grip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        entity.sessionId,
        entity.exerciseId,
        entity.order,
        entity.machineName ?? null,
        entity.seatHeight ?? null,
        entity.benchAngleDeg ?? null,
        entity.grip ?? null
      );
      return rowToWorkoutExercise({
        id,
        session_id: entity.sessionId,
        exercise_id: entity.exerciseId,
        order: entity.order,
        machine_name: entity.machineName ?? null,
        seat_height: entity.seatHeight ?? null,
        bench_angle_deg: entity.benchAngleDeg ?? null,
        grip: entity.grip ?? null,
      });
    },
    async update(id, patch) {
      const updates: string[] = [];
      const params: (string | number | null)[] = [];
      if (patch.exerciseId !== undefined) {
        updates.push('exercise_id = ?');
        params.push(patch.exerciseId);
      }
      if (patch.order !== undefined) {
        updates.push('"order" = ?');
        params.push(patch.order);
      }
      if (patch.machineName !== undefined) {
        updates.push('machine_name = ?');
        params.push(patch.machineName);
      }
      if (patch.seatHeight !== undefined) {
        updates.push('seat_height = ?');
        params.push(patch.seatHeight);
      }
      if (patch.benchAngleDeg !== undefined) {
        updates.push('bench_angle_deg = ?');
        params.push(patch.benchAngleDeg);
      }
      if (patch.grip !== undefined) {
        updates.push('grip = ?');
        params.push(patch.grip);
      }
      if (updates.length === 0) {
        const ex = await this.getById(id);
        if (!ex) throw new Error('WorkoutExercise not found');
        return ex;
      }
      params.push(id);
      await db.runAsync(`UPDATE workout_exercise SET ${updates.join(', ')} WHERE id = ?`, params);
      const ex = await this.getById(id);
      if (!ex) throw new Error('WorkoutExercise not found after update');
      return ex;
    },
    async delete(id) {
      await db.runAsync('DELETE FROM workout_set WHERE workout_exercise_id = ?', id);
      await db.runAsync('DELETE FROM workout_exercise WHERE id = ?', id);
    },
    async getById(id) {
      const row = await db.getFirstAsync<Row>('SELECT * FROM workout_exercise WHERE id = ?', id);
      return row ? rowToWorkoutExercise(row) : null;
    },
    async list(options) {
      const sessionId = options?.filter?.sessionId;
      if (!sessionId) return [];
      const rows = await db.getAllAsync<Row>(
        'SELECT * FROM workout_exercise WHERE session_id = ? ORDER BY "order" ASC',
        sessionId
      );
      return rows.map(rowToWorkoutExercise);
    },
  };
}
