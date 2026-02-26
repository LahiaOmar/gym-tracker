/**
 * Shared helpers for SQLite adapter. ID generation and date handling.
 * Uses Math.random() so IDs work in React Native (no crypto API).
 */

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateId(): string {
  return uuidv4();
}

export function now(): string {
  return new Date().toISOString();
}
