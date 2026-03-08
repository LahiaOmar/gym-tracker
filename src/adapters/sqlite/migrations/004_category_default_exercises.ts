/**
 * Migration 004: Add category_default_exercise table.
 * Links training categories with their default exercises.
 */

export const up = `
CREATE TABLE IF NOT EXISTS category_default_exercise (
  id TEXT PRIMARY KEY NOT NULL,
  category_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES training_category(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercise(id)
);
CREATE INDEX IF NOT EXISTS idx_category_default_exercise_category ON category_default_exercise(category_id);
`;
