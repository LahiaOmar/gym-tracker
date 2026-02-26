/**
 * Re-export repository interfaces from domain for app consumption.
 */

export type {
  UserRepository,
  TrainingCategoryRepository,
  ExerciseRepository,
  WorkoutSessionRepository,
  WorkoutExerciseRepository,
  WorkoutSetRepository,
  ListOptions,
} from '@/src/domain';
