/**
 * Migration: Add notes column to workout_exercise table.
 */

export const up = `
ALTER TABLE workout_exercise ADD COLUMN notes TEXT;
`;
