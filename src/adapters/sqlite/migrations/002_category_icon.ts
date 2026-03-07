/**
 * Migration: Add icon column to training_category table.
 */

export const up = `
ALTER TABLE training_category ADD COLUMN icon TEXT;
`;
