/**
 * Initial schema (MVP §4). Tables + indexes.
 */

export const up = `
-- Storage versioning (MVP §7.1)
CREATE TABLE IF NOT EXISTS _meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

-- User (MVP §4)
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  weight_unit TEXT NOT NULL DEFAULT 'kg',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- TrainingCategory (MVP §4.1)
CREATE TABLE IF NOT EXISTS training_category (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id)
);
CREATE INDEX IF NOT EXISTS idx_training_category_user_id ON training_category(user_id);

-- Exercise (MVP §4.2)
CREATE TABLE IF NOT EXISTS exercise (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  is_built_in INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exercise_user_builtin ON exercise(user_id, is_built_in);

-- WorkoutSession (MVP §4.3)
CREATE TABLE IF NOT EXISTS workout_session (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (category_id) REFERENCES training_category(id)
);
CREATE INDEX IF NOT EXISTS idx_workout_session_user_started ON workout_session(user_id, started_at);

-- WorkoutExercise (MVP §4.4)
CREATE TABLE IF NOT EXISTS workout_exercise (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  machine_name TEXT,
  seat_height TEXT,
  bench_angle_deg INTEGER,
  grip TEXT,
  FOREIGN KEY (session_id) REFERENCES workout_session(id),
  FOREIGN KEY (exercise_id) REFERENCES exercise(id)
);
CREATE INDEX IF NOT EXISTS idx_workout_exercise_session ON workout_exercise(session_id);

-- WorkoutSet (MVP §4.5)
CREATE TABLE IF NOT EXISTS workout_set (
  id TEXT PRIMARY KEY NOT NULL,
  workout_exercise_id TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercise(id)
);
CREATE INDEX IF NOT EXISTS idx_workout_set_workout_exercise ON workout_set(workout_exercise_id);
`;
