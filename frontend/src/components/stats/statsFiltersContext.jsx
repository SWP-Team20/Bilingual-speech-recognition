import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const StatsFiltersContext = createContext(null);

export function StatsFiltersProvider({ children }) {
  const [categoryFilters, setCategoryFiltersState] = useState({
    'frequent-words': null,
    languages: null,
    dates: null,
    speakers: null,
  });

  const setCategoryFilters = useCallback((category, filters) => {
    setCategoryFiltersState((prev) => ({
      ...prev,
      [category]: filters,
    }));
  }, []);

  const value = useMemo(
    () => ({ categoryFilters, setCategoryFilters }),
    [categoryFilters, setCategoryFilters],
  );

  return (
    <StatsFiltersContext.Provider value={value}>
      {children}
    </StatsFiltersContext.Provider>
  );
}

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
