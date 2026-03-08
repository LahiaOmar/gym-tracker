import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  UserRepository,
  TrainingCategoryRepository,
  ExerciseRepository,
  WorkoutSessionRepository,
  WorkoutExerciseRepository,
  WorkoutSetRepository,
  CategoryDefaultExerciseRepository,
} from '@/src/domain';
import { createUserRepository } from './repositories/UserRepository';
import { createTrainingCategoryRepository } from './repositories/TrainingCategoryRepository';
import { createExerciseRepository } from './repositories/ExerciseRepository';
import { createWorkoutSessionRepository } from './repositories/WorkoutSessionRepository';
import { createWorkoutExerciseRepository } from './repositories/WorkoutExerciseRepository';
import { createWorkoutSetRepository } from './repositories/WorkoutSetRepository';
import { createCategoryDefaultExerciseRepository } from './repositories/CategoryDefaultExerciseRepository';

export interface SqliteRepositories {
  user: UserRepository;
  trainingCategory: TrainingCategoryRepository;
  exercise: ExerciseRepository;
  workoutSession: WorkoutSessionRepository;
  workoutExercise: WorkoutExerciseRepository;
  workoutSet: WorkoutSetRepository;
  categoryDefaultExercise: CategoryDefaultExerciseRepository;
}

export function createRepositories(db: SQLiteDatabase): SqliteRepositories {
  return {
    user: createUserRepository(db),
    trainingCategory: createTrainingCategoryRepository(db),
    exercise: createExerciseRepository(db),
    workoutSession: createWorkoutSessionRepository(db),
    workoutExercise: createWorkoutExerciseRepository(db),
    workoutSet: createWorkoutSetRepository(db),
    categoryDefaultExercise: createCategoryDefaultExerciseRepository(db),
  };
}
