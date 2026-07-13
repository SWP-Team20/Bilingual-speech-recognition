import { createContext, useCallback, useContext } from 'react';

export const StatsFiltersContext = createContext(null);

export function useStatsFiltersRegistry(category) {
  const context = useContext(StatsFiltersContext);

  const registerFilters = useCallback((filters) => {
    context?.setCategoryFilters(category, filters);
  }, [category, context]);

  return registerFilters;
}

export function useAllStatsFilters() {
  const context = useContext(StatsFiltersContext);
  if (!context) {
    throw new Error('useAllStatsFilters must be used within StatsFiltersProvider');
  }
  return context.categoryFilters;
}
