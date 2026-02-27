import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { WorkoutSession } from '@/src/domain';
import { setVolume } from '@/src/domain';
import type { SqliteRepositories } from '@/src/adapters/sqlite';
import { useStorage } from '@/contexts/StorageContext';

export type SessionItem = {
  session: WorkoutSession;
  categoryName: string;
  durationMins: number;
  volume: number;
};

function getSessionDurationMins(session: WorkoutSession): number {
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : start;
  return Math.round((end - start) / 60000);
}

async function loadSessionItems(
  repositories: SqliteRepositories,
  userId: string
): Promise<SessionItem[]> {
  const list = await repositories.workoutSession.list({
    filter: { userId },
    limit: 100,
    sort: { field: 'startedAt', direction: 'desc' },
  });
  const items: SessionItem[] = [];
  for (const session of list) {
    const category = await repositories.trainingCategory.getById(session.categoryId);
    const exercises = await repositories.workoutExercise.list({
      filter: { sessionId: session.id },
    });
    let volume = 0;
    for (const we of exercises) {
      const sets = await repositories.workoutSet.list({
        filter: { workoutExerciseId: we.id },
      });
      for (const set of sets) volume += setVolume(set);
    }
    items.push({
      session,
      categoryName: category?.name ?? 'Workout',
      durationMins: getSessionDurationMins(session),
      volume,
    });
  }
  return items;
}

type SessionsContextValue = {
  sessionItems: SessionItem[];
  isLoading: boolean;
  refetch: (silent?: boolean) => Promise<void>;
};

const SessionsContext = createContext<SessionsContextValue | null>(null);

export function SessionsProvider({ children }: { children: React.ReactNode }) {
  const { user, repositories, isReady } = useStorage();
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async (silent = false) => {
    if (!repositories || !user) return;
    if (!silent) setIsLoading(true);
    try {
      const items = await loadSessionItems(repositories, user.id);
      setSessionItems(items);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [repositories, user]);

  useEffect(() => {
    if (!isReady || !user || !repositories) return;
    refetch();
  }, [isReady, user?.id, repositories, refetch]);

  const value: SessionsContextValue = {
    sessionItems,
    isLoading,
    refetch,
  };

  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
}

export function useSessions() {
  const ctx = useContext(SessionsContext);
  if (!ctx) throw new Error('useSessions must be used within SessionsProvider');
  return ctx;
}
