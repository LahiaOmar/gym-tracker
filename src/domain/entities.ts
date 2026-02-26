/**
 * Domain entities (MVP §4). Types only; no database code.
 */

export type WeightUnit = 'kg' | 'lb';

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

export interface User extends Timestamped {
  id: string;
  displayName: string;
  weightUnit: WeightUnit;
}

export interface TrainingCategory extends Timestamped {
  id: string;
  userId: string;
  name: string;
}

export interface Exercise extends Timestamped {
  id: string;
  userId: string | null;
  name: string;
  isBuiltIn: boolean;
}

export interface WorkoutSession extends Timestamped {
  id: string;
  userId: string;
  categoryId: string;
  startedAt: string;
  endedAt: string | null;
  notes?: string | null;
}

export interface WorkoutExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  order: number;
  machineName?: string | null;
  seatHeight?: string | null;
  benchAngleDeg?: number | null;
  grip?: string | null;
}

export interface WorkoutSet extends Timestamped {
  id: string;
  workoutExerciseId: string;
  order: number;
  reps: number;
  weight: number;
}

/** Derived: volume = reps × weight */
export function setVolume(set: WorkoutSet): number {
  return set.reps * set.weight;
}
