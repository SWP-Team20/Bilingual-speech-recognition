export const SPEAKER_LIMIT_DEFAULT = 20;

export const EMPTY_SPEAKER_FILTERS = {
  langs: [],
  dateFrom: '',
  dateTo: '',
  audioIds: [],
  limit: SPEAKER_LIMIT_DEFAULT,
};

/** Фильтры для SpeakersPanel (без limit графика). */
export function speakerFiltersForWordsPanel(filters) {
  return {
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    audioIds: filters.audioIds || [],
    langs: filters.langs || [],
  };
}

/** Слияние фильтров слов обратно в общий объект статистики. */
export function mergeSpeakerWordFilters(base, wordFilters) {
  return {
    ...base,
    dateFrom: wordFilters.dateFrom || '',
    dateTo: wordFilters.dateTo || '',
    audioIds: wordFilters.audioIds || [],
    langs: wordFilters.langs || [],
  };
}
