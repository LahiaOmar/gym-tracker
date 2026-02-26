import React, { createContext, useCallback, useContext, useState } from 'react';

type ActiveSessionContextValue = {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
};

const ActiveSessionContext = createContext<ActiveSessionContextValue | null>(null);

export function ActiveSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const set = useCallback((id: string | null) => setActiveSessionId(id), []);
  return (
    <ActiveSessionContext.Provider value={{ activeSessionId, setActiveSessionId: set }}>
      {children}
    </ActiveSessionContext.Provider>
  );
}

export function useActiveSession() {
  const ctx = useContext(ActiveSessionContext);
  if (!ctx) throw new Error('useActiveSession must be used within ActiveSessionProvider');
  return ctx;
}
