import { useCallback, useEffect, useState } from 'react';
import type { SqliteRepositories } from '@/src/adapters/sqlite';
import {
  totalVolumeFromSets,
  maxWeightFromSets,
  getSessionDurationMins,
  computeStreak,
} from '@/src/domain';
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

/** Date range for the last N weeks (for charts). */
export function getRangeForWeeks(weeks: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - weeks * 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

function getWeekKey(iso: string): string {
  const d = new Date(iso);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

export function useGlobalStats(repositories: SqliteRepositories | null, userId: string | null) {
  const [weekVolume, setWeekVolume] = useState(0);
  const [monthVolume, setMonthVolume] = useState(0);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);
  const [monthSessionsCount, setMonthSessionsCount] = useState(0);
  const [thisWeekMinutes, setThisWeekMinutes] = useState(0);
  const [streak, setStreak] = useState(0);

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
    setMonthSessionsCount(monthSessions.length);

    let totalMins = 0;
    for (const s of weekSessions) {
      totalMins += getSessionDurationMins(s);
    }
    setThisWeekMinutes(totalMins);

    const allSessions = await repositories.workoutSession.list({
      filter: { userId },
      limit: 500,
      sort: { field: 'startedAt', direction: 'desc' },
    });
    setStreak(computeStreak(allSessions.map((s) => s.startedAt)));

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

  return {
    weekVolume,
    monthVolume,
    sessionsThisWeek,
    monthSessionsCount,
    thisWeekMinutes,
    streak,
    refresh: load,
  };
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

export type WeekDataPoint = { label: string; value: number };

export function useTimeBucketedStats(
  repositories: SqliteRepositories | null,
  userId: string | null,
  weeks: number
) {
  const [volumeByWeek, setVolumeByWeek] = useState<WeekDataPoint[]>([]);
  const [sessionsByWeek, setSessionsByWeek] = useState<WeekDataPoint[]>([]);

  const load = useCallback(async () => {
    if (!repositories || !userId || weeks < 1) {
      setVolumeByWeek([]);
      setSessionsByWeek([]);
      return;
    }
    const { from, to } = getRangeForWeeks(weeks);
    const sessions = await repositories.workoutSession.listSessionsByDateRange(userId, from, to);

    const volumeByWeekMap = new Map<string, number>();
    const sessionsByWeekMap = new Map<string, number>();

    for (const s of sessions) {
      const key = getWeekKey(s.startedAt);
      sessionsByWeekMap.set(key, (sessionsByWeekMap.get(key) ?? 0) + 1);
    }

    for (const s of sessions) {
      const weList = await repositories.workoutExercise.list({ filter: { sessionId: s.id } });
      let vol = 0;
      for (const we of weList) {
        const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
        vol += totalVolumeFromSets(sets);
      }
      const key = getWeekKey(s.startedAt);
      volumeByWeekMap.set(key, (volumeByWeekMap.get(key) ?? 0) + vol);
    }

    const sortedKeys = Array.from(
      new Set([...volumeByWeekMap.keys(), ...sessionsByWeekMap.keys()])
    ).sort();
    setVolumeByWeek(
      sortedKeys.map((label) => ({ label: label.slice(5), value: volumeByWeekMap.get(label) ?? 0 }))
    );
    setSessionsByWeek(
      sortedKeys.map((label) => ({ label: label.slice(5), value: sessionsByWeekMap.get(label) ?? 0 }))
    );
  }, [repositories, userId, weeks]);

  useEffect(() => {
    load();
  }, [load]);

  return { volumeByWeek, sessionsByWeek, refresh: load };
}

export type ExerciseProgressPoint = { date: string; maxWeight: number; volume: number };

export function useExerciseProgress(
  repositories: SqliteRepositories | null,
  userId: string | null,
  exerciseId: string | null,
  weeks: number
) {
  const [dataPoints, setDataPoints] = useState<ExerciseProgressPoint[]>([]);

  const load = useCallback(async () => {
    if (!repositories || !userId || !exerciseId || weeks < 1) {
      setDataPoints([]);
      return;
    }
    const { from, to } = getRangeForWeeks(weeks);
    const sets = await repositories.workoutSet.listSetsByExercise(userId, exerciseId, from, to);

    const bySession = new Map<string, WorkoutSet[]>();
    for (const set of sets) {
      const we = await repositories.workoutExercise.getById(set.workoutExerciseId);
      if (we) {
        const list = bySession.get(we.sessionId) ?? [];
        list.push(set);
        bySession.set(we.sessionId, list);
      }
    }

    const sessionDates = new Map<string, string>();
    for (const sessionId of bySession.keys()) {
      const session = await repositories.workoutSession.getById(sessionId);
      if (session) sessionDates.set(sessionId, session.startedAt);
    }

    const points: ExerciseProgressPoint[] = [];
    for (const [sessionId, sessionSets] of bySession) {
      const startedAt = sessionDates.get(sessionId);
      if (!startedAt) continue;
      points.push({
        date: startedAt.slice(0, 10),
        maxWeight: maxWeightFromSets(sessionSets),
        volume: totalVolumeFromSets(sessionSets),
      });
    }
    points.sort((a, b) => a.date.localeCompare(b.date));
    setDataPoints(points);
  }, [repositories, userId, exerciseId, weeks]);

  useEffect(() => {
    load();
  }, [load]);

  return { dataPoints, refresh: load };
}

export type CategoryVolume = { categoryName: string; volume: number };

export function useVolumeByCategory(
  repositories: SqliteRepositories | null,
  userId: string | null,
  weeks: number
) {
  const [data, setData] = useState<CategoryVolume[]>([]);

  const load = useCallback(async () => {
    if (!repositories || !userId || weeks < 1) {
      setData([]);
      return;
    }
    const { from, to } = getRangeForWeeks(weeks);
    const sessions = await repositories.workoutSession.listSessionsByDateRange(userId, from, to);
    const categoryIds = [...new Set(sessions.map((s) => s.categoryId))];
    const categoryMap = new Map<string, string>();
    for (const id of categoryIds) {
      const cat = await repositories.trainingCategory.getById(id);
      if (cat) categoryMap.set(id, cat.name);
    }

    const volumeByCategory = new Map<string, number>();
    for (const s of sessions) {
      const weList = await repositories.workoutExercise.list({ filter: { sessionId: s.id } });
      let vol = 0;
      for (const we of weList) {
        const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
        vol += totalVolumeFromSets(sets);
      }
      const name = categoryMap.get(s.categoryId) ?? s.categoryId;
      volumeByCategory.set(name, (volumeByCategory.get(name) ?? 0) + vol);
    }

    setData(
      Array.from(volumeByCategory.entries())
        .map(([categoryName, volume]) => ({ categoryName, volume }))
        .sort((a, b) => b.volume - a.volume)
    );
  }, [repositories, userId, weeks]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, refresh: load };
}

export type TopExercise = { exerciseName: string; volume: number; sessionCount: number };

export function useTopExercises(
  repositories: SqliteRepositories | null,
  userId: string | null,
  weeks: number,
  limit: number = 10
) {
  const [data, setData] = useState<TopExercise[]>([]);

  const load = useCallback(async () => {
    if (!repositories || !userId || weeks < 1) {
      setData([]);
      return;
    }
    const { from, to } = getRangeForWeeks(weeks);
    const sessions = await repositories.workoutSession.listSessionsByDateRange(userId, from, to);

    const byExercise = new Map<
      string,
      { volume: number; sessionIds: Set<string> }
    >();
    for (const s of sessions) {
      const weList = await repositories.workoutExercise.list({ filter: { sessionId: s.id } });
      for (const we of weList) {
        const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
        const vol = totalVolumeFromSets(sets);
        const ex = byExercise.get(we.exerciseId) ?? {
          volume: 0,
          sessionIds: new Set<string>(),
        };
        ex.volume += vol;
        ex.sessionIds.add(s.id);
        byExercise.set(we.exerciseId, ex);
      }
    }

    const exerciseNames = new Map<string, string>();
    for (const id of byExercise.keys()) {
      const ex = await repositories.exercise.getById(id);
      if (ex) exerciseNames.set(id, ex.name);
    }

    const list = Array.from(byExercise.entries())
      .map(([exerciseId, { volume, sessionIds }]) => ({
        exerciseName: exerciseNames.get(exerciseId) ?? exerciseId,
        volume,
        sessionCount: sessionIds.size,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
    setData(list);
  }, [repositories, userId, weeks, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, refresh: load };
}

export function useSessionDurationByWeek(
  repositories: SqliteRepositories | null,
  userId: string | null,
  weeks: number
) {
  const [data, setData] = useState<WeekDataPoint[]>([]);

  const load = useCallback(async () => {
    if (!repositories || !userId || weeks < 1) {
      setData([]);
      return;
    }
    const { from, to } = getRangeForWeeks(weeks);
    const sessions = await repositories.workoutSession.listSessionsByDateRange(userId, from, to);
    const byWeek = new Map<string, number>();
    for (const s of sessions) {
      const key = getWeekKey(s.startedAt);
      const mins = getSessionDurationMins(s);
      byWeek.set(key, (byWeek.get(key) ?? 0) + mins);
    }
    const sortedKeys = Array.from(byWeek.keys()).sort();
    setData(
      sortedKeys.map((label) => ({ label: label.slice(5), value: byWeek.get(label) ?? 0 }))
    );
  }, [repositories, userId, weeks]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, refresh: load };
}

export type ActivityHeatmapDay = { date: string; sessions: number; volume: number };

export function useActivityHeatmap(
  repositories: SqliteRepositories | null,
  userId: string | null,
  weeks: number
) {
  const [data, setData] = useState<ActivityHeatmapDay[]>([]);

  const load = useCallback(async () => {
    if (!repositories || !userId || weeks < 1) {
      setData([]);
      return;
    }
    const { from, to } = getRangeForWeeks(weeks);
    const sessions = await repositories.workoutSession.listSessionsByDateRange(userId, from, to);
    const byDay = new Map<string, { sessions: number; volume: number }>();

    for (const s of sessions) {
      const key = s.startedAt.slice(0, 10);
      const cur = byDay.get(key) ?? { sessions: 0, volume: 0 };
      cur.sessions += 1;
      const weList = await repositories.workoutExercise.list({ filter: { sessionId: s.id } });
      let vol = 0;
      for (const we of weList) {
        const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
        vol += totalVolumeFromSets(sets);
      }
      cur.volume += vol;
      byDay.set(key, cur);
    }

    const sorted = Array.from(byDay.entries())
      .map(([date, { sessions: s, volume }]) => ({ date, sessions: s, volume }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setData(sorted);
  }, [repositories, userId, weeks]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, refresh: load };
}
