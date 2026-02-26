import { useCallback, useEffect, useState } from 'react';
import type { SqliteRepositories } from '@/src/adapters/sqlite';
import { totalVolumeFromSets, maxWeightFromSets } from '@/src/domain';
import type { WorkoutSet } from '@/src/domain';

function getWeekRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

function getMonthRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function useGlobalStats(repositories: SqliteRepositories | null, userId: string | null) {
  const [weekVolume, setWeekVolume] = useState(0);
  const [monthVolume, setMonthVolume] = useState(0);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);

  const load = useCallback(async () => {
    if (!repositories || !userId) return;
    const week = getWeekRange();
    const month = getMonthRange();
    const weekSessions = await repositories.workoutSession.listSessionsByDateRange(
      userId,
      week.from,
      week.to
    );
    const monthSessions = await repositories.workoutSession.listSessionsByDateRange(
      userId,
      month.from,
      month.to
    );
    setSessionsThisWeek(weekSessions.length);

    let wVol = 0;
    let mVol = 0;
    for (const s of weekSessions) {
      const weList = await repositories.workoutExercise.list({ filter: { sessionId: s.id } });
      for (const we of weList) {
        const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
        wVol += totalVolumeFromSets(sets);
      }
    }
    for (const s of monthSessions) {
      const weList = await repositories.workoutExercise.list({ filter: { sessionId: s.id } });
      for (const we of weList) {
        const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
        mVol += totalVolumeFromSets(sets);
      }
    }
    setWeekVolume(wVol);
    setMonthVolume(mVol);
  }, [repositories, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { weekVolume, monthVolume, sessionsThisWeek, refresh: load };
}

export function useExerciseStats(
  repositories: SqliteRepositories | null,
  userId: string | null,
  exerciseId: string | null
) {
  const [maxWeight, setMaxWeight] = useState(0);
  const [bestVolume, setBestVolume] = useState(0);

  const load = useCallback(async () => {
    if (!repositories || !userId || !exerciseId) {
      setMaxWeight(0);
      setBestVolume(0);
      return;
    }
    const sets = await repositories.workoutSet.listSetsByExercise(userId, exerciseId);
    setMaxWeight(maxWeightFromSets(sets));

    const bySession = new Map<string, WorkoutSet[]>();
    for (const set of sets) {
      const we = await repositories.workoutExercise.getById(set.workoutExerciseId);
      if (we) {
        const list = bySession.get(we.sessionId) ?? [];
        list.push(set);
        bySession.set(we.sessionId, list);
      }
    }
    let best = 0;
    for (const sessionSets of bySession.values()) {
      const vol = totalVolumeFromSets(sessionSets);
      if (vol > best) best = vol;
    }
    setBestVolume(best);
  }, [repositories, userId, exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { maxWeight, bestVolume, refresh: load };
}
