import { createContext, useContext, ReactNode } from 'react';
import { useWorkDashboard } from '@/hooks/useWorkDashboard';

/**
 * useWorkDashboard issues ~16 queries per fetchAll. Index and WorkDashboard used
 * to call it separately, and the desktop/mobile WorkDashboard blocks are both
 * mounted (only CSS hides one), so every request went out 2-3 times. Index owns
 * the single instance now and hands it down through this context.
 */
type WorkDashboardValue = ReturnType<typeof useWorkDashboard>;

const WorkDashboardContext = createContext<WorkDashboardValue | null>(null);

export function WorkDashboardProvider({
  value,
  children,
}: {
  value: WorkDashboardValue;
  children: ReactNode;
}) {
  return <WorkDashboardContext.Provider value={value}>{children}</WorkDashboardContext.Provider>;
}

export function useWorkDashboardContext(): WorkDashboardValue {
  const ctx = useContext(WorkDashboardContext);
  if (!ctx) {
    throw new Error('useWorkDashboardContext must be used inside a WorkDashboardProvider');
  }
  return ctx;
}
