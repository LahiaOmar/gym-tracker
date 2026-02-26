/**
 * Seed built-in exercises and optional default categories. Run once after migrations.
 */

import type { SqliteRepositories } from './createRepositories';
import { generateId } from './helpers';

const BUILT_IN_EXERCISES = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Dumbbell Row',
  'Lat Pulldown',
  'Leg Press',
  'Leg Curl',
  'Leg Extension',
  'Calf Raise',
  'Bicep Curl',
  'Tricep Pushdown',
  'Lateral Raise',
  'Face Pull',
  'Incline Bench Press',
  'Romanian Deadlift',
  'Pull-up',
  'Push-up',
  'Dips',
];

const DEFAULT_CATEGORIES = ['Push', 'Pull', 'Legs'];

export async function seedBuiltInExercises(repos: SqliteRepositories): Promise<void> {
  const existing = await repos.exercise.list({ filter: { isBuiltIn: true }, limit: 1 });
  if (existing.length > 0) return;

  for (const name of BUILT_IN_EXERCISES) {
    await repos.exercise.create({
      id: generateId(),
      userId: null,
      name,
      isBuiltIn: true,
    });
  }
}

export async function seedDefaultCategories(repos: SqliteRepositories, userId: string): Promise<void> {
  const existing = await repos.trainingCategory.list({ filter: { userId }, limit: 1 });
  if (existing.length > 0) return;

  for (const name of DEFAULT_CATEGORIES) {
    await repos.trainingCategory.create({
      id: generateId(),
      userId,
      name,
    });
  }
}
