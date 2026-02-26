/**
 * Repository interfaces (MVP §6.2). Domain layer only.
 */

import type {
  User,
  TrainingCategory,
  Exercise,
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
} from './entities';

export interface ListOptions<TFilter = object> {
  filter?: TFilter;
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

export interface UserRepository {
  create(entity: { displayName: string; weightUnit: User['weightUnit']; id?: string }): Promise<User>;
  update(id: string, patch: Partial<Pick<User, 'displayName' | 'weightUnit' | 'updatedAt'>>): Promise<User>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<User | null>;
  list(options?: ListOptions): Promise<User[]>;
}

export interface TrainingCategoryRepository {
  create(entity: Omit<TrainingCategory, 'createdAt' | 'updatedAt'>): Promise<TrainingCategory>;
  update(id: string, patch: Partial<Pick<TrainingCategory, 'name' | 'updatedAt'>>): Promise<TrainingCategory>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<TrainingCategory | null>;
  list(options?: ListOptions<{ userId: string }>): Promise<TrainingCategory[]>;
}

export interface ExerciseRepository {
  create(entity: Omit<Exercise, 'createdAt' | 'updatedAt'>): Promise<Exercise>;
  update(id: string, patch: Partial<Pick<Exercise, 'name' | 'updatedAt'>>): Promise<Exercise>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Exercise | null>;
  list(options?: ListOptions<{ userId?: string | null; isBuiltIn?: boolean; search?: string }>): Promise<Exercise[]>;
}

export interface WorkoutSessionRepository {
  create(entity: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<WorkoutSession>;
  update(id: string, patch: Partial<Pick<WorkoutSession, 'endedAt' | 'notes' | 'updatedAt'>>): Promise<WorkoutSession>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<WorkoutSession | null>;
  list(options?: ListOptions<{ userId: string }>): Promise<WorkoutSession[]>;
  listSessionsByDateRange(userId: string, from: string, to: string): Promise<WorkoutSession[]>;
}

export interface WorkoutExerciseRepository {
  create(entity: Omit<WorkoutExercise, 'id'>): Promise<WorkoutExercise>;
  update(id: string, patch: Partial<Omit<WorkoutExercise, 'id' | 'sessionId'>>): Promise<WorkoutExercise>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<WorkoutExercise | null>;
  list(options?: ListOptions<{ sessionId: string }>): Promise<WorkoutExercise[]>;
}

export interface WorkoutSetRepository {
  create(entity: Omit<WorkoutSet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<WorkoutSet>;
  update(id: string, patch: Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'order' | 'updatedAt'>>): Promise<WorkoutSet>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<WorkoutSet | null>;
  list(options?: ListOptions<{ workoutExerciseId: string }>): Promise<WorkoutSet[]>;
  listSetsByExercise(userId: string, exerciseId: string, from?: string, to?: string): Promise<WorkoutSet[]>;
}
