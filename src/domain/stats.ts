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

/** Session duration in minutes (from startedAt to endedAt). */
export function getSessionDurationMins(session: WorkoutSession): number {
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : start;
  return Math.round((end - start) / 60000);
}

/** Consecutive days with at least one session, counting from today backward. */
export function computeStreak(sessionStartedAts: string[]): number {
  const uniqueDays = Array.from(
    new Set(sessionStartedAts.map((s) => new Date(s).toDateString()))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  if (uniqueDays.length === 0) return 0;
  let streak = 0;
  const today = new Date().toDateString();
  let expected = today;
  for (const d of uniqueDays) {
    if (d !== expected) break;
    streak++;
    const next = new Date(expected);
    next.setDate(next.getDate() - 1);
    expected = next.toDateString();
  }
  return streak;
}
