import { useCallback, useMemo, useRef } from 'react';
import { StatsFiltersContext } from './statsFiltersContext';

function filtersEqual(previous, next) {
  if (previous === next) return true;
  if (!previous || !next) return false;
  return JSON.stringify(previous) === JSON.stringify(next);
}

const EMPTY_FILTERS_STATE = {
  'frequent-words': null,
  languages: null,
  dates: null,
  speakers: null,
};

function StatsFiltersProvider({ children }) {
  const categoryFiltersRef = useRef({ ...EMPTY_FILTERS_STATE });

  const setCategoryFilters = useCallback((category, filters) => {
    if (filtersEqual(categoryFiltersRef.current[category], filters)) return;
    categoryFiltersRef.current = {
      ...categoryFiltersRef.current,
      [category]: filters,
    };
  }, []);

  const getCategoryFilters = useCallback(
    () => categoryFiltersRef.current,
    [],
  );

  const value = useMemo(
    () => ({ setCategoryFilters, getCategoryFilters }),
    [setCategoryFilters, getCategoryFilters],
  );

  return (
    <StatsFiltersContext.Provider value={value}>
      {children}
    </StatsFiltersContext.Provider>
  );
}

export default StatsFiltersProvider;
