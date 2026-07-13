import { createContext, useCallback, useContext } from 'react';

export const StatsFiltersContext = createContext(null);

export function useStatsFiltersRegistry(category) {
  const { setCategoryFilters } = useContext(StatsFiltersContext) ?? {};

  return useCallback((filters) => {
    setCategoryFilters?.(category, filters);
  }, [category, setCategoryFilters]);
}

export function useStatsFiltersSnapshot() {
  const context = useContext(StatsFiltersContext);
  if (!context) {
    throw new Error('useStatsFiltersSnapshot must be used within StatsFiltersProvider');
  }
  return context.getCategoryFilters;
}
