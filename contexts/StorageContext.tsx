import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@/src/domain';
import type { SqliteRepositories } from '@/src/adapters/sqlite';
import { getDb, createRepositories, seedBuiltInExercises, seedDefaultCategories } from '@/src/adapters/sqlite';

type StorageContextValue = {
  user: User | null;
  setUser: (u: User | null) => void;
  repositories: SqliteRepositories | null;
  isReady: boolean;
};

const StorageContext = createContext<StorageContextValue | null>(null);

async function getOrCreateGuestUser(repos: SqliteRepositories): Promise<User> {
  const list = await repos.user.list({ limit: 1 });
  if (list.length > 0) return list[0];
  return repos.user.create({
    displayName: 'Guest',
    weightUnit: 'kg',
  });
}

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [repositories, setRepositories] = useState<SqliteRepositories | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDb();
        const repos = createRepositories(db);
        setRepositories(repos);
        if (cancelled) return;
        await seedBuiltInExercises(repos);
        const guest = await getOrCreateGuestUser(repos);
        if (cancelled) return;
        await seedDefaultCategories(repos, guest.id);
        if (cancelled) return;
        setUser(guest);
      } catch (e) {
        console.error('Storage init failed', e);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setUserCallback = useCallback((u: User | null) => setUser(u), []);

  const value: StorageContextValue = {
    user,
    setUser: setUserCallback,
    repositories,
    isReady,
  };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within StorageProvider');
  return ctx;
}
