import { useCallback, useMemo, useState } from 'react';
import { StatsFiltersContext } from './statsFiltersContext';

function StatsFiltersProvider({ children }) {
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

export default StatsFiltersProvider;
