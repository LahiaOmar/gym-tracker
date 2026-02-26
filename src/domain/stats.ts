/**
 * Basic statistics (MVP §2.4, §9.7). Pure domain: no DB imports.
 * Consumes data from repositories; callers pass in the data.
 */

import type { WorkoutSet, WorkoutSession } from './entities';
import { setVolume } from './entities';

export function totalVolumeFromSets(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => sum + setVolume(s), 0);
}

export function maxWeightFromSets(sets: WorkoutSet[]): number {
  return sets.length ? Math.max(...sets.map((s) => s.weight)) : 0;
}

/** Group sets by session (caller must pass sets with sessionId or pre-group). */
export function bestVolumeSession(
  setsBySession: Map<string, WorkoutSet[]>
): { sessionId: string; volume: number } | null {
  let best: { sessionId: string; volume: number } | null = null;
  for (const [sessionId, sets] of setsBySession) {
    const vol = totalVolumeFromSets(sets);
    if (!best || vol > best.volume) best = { sessionId, volume: vol };
  }
  return best;
}

export function sessionsCountInRange(
  sessions: WorkoutSession[],
  from: string,
  to: string
): number {
  return sessions.filter(
    (s) => s.startedAt >= from && s.startedAt <= to
  ).length;
}
