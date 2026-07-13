import apiClient from './apiClient';

function parseFilename(contentDisposition) {
  if (!contentDisposition) return null;
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return match?.[1] || null;
}

function clampLimit(value, fallback = 30) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(500, Math.round(parsed)));
}

function appendListParams(params, key, values) {
  if (!values?.length) return;
  values.forEach((value) => params.append(key, value));
}

function speakerList(filters) {
  if (Array.isArray(filters.speakers) && filters.speakers.length) return filters.speakers;
  if (filters.speaker?.trim()) return [filters.speaker.trim()];
  return [];
}

function buildFrequentWordsParams(filters = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(clampLimit(filters.limit)));
  appendListParams(params, 'lang', filters.langs);
  appendListParams(params, 'speaker', speakerList(filters));
  appendListParams(params, 'audio_id', filters.audioIds);
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  return params;
}

function buildSpeakerStatsParams(filters = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(clampLimit(filters.limit ?? 20, 20)));
  appendListParams(params, 'lang', filters.langs);
  appendListParams(params, 'audio_id', filters.audioIds);
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  return params;
}

function buildLanguageStatsParams(filters = {}) {
  const params = new URLSearchParams();
  appendListParams(params, 'speaker', speakerList(filters));
  appendListParams(params, 'audio_id', filters.audioIds);
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  return params;
}

function buildDateStatsParams(filters = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(clampLimit(filters.limit ?? 30, 30)));
  appendListParams(params, 'lang', filters.langs);
  appendListParams(params, 'speaker', speakerList(filters));
  appendListParams(params, 'audio_id', filters.audioIds);
  return params;
}

const EXPORT_ENDPOINTS = {
  'frequent-words': {
    path: '/api/v1/stats/words/frequent/export',
    buildParams: buildFrequentWordsParams,
    fallbackName: 'stats_frequent_words',
  },
  languages: {
    path: '/api/v1/stats/languages/words/export',
    buildParams: buildLanguageStatsParams,
    fallbackName: 'stats_languages',
  },
  dates: {
    path: '/api/v1/stats/dates/words/export',
    buildParams: buildDateStatsParams,
    fallbackName: 'stats_dates',
  },
  speakers: {
    path: '/api/v1/stats/speakers/words/export',
    buildParams: buildSpeakerStatsParams,
    fallbackName: 'stats_speakers',
  },
};

function toCategoryFiltersPayload(filters = {}) {
  return {
    langs: filters.langs || [],
    speakers: filters.speakers || [],
    date_from: filters.dateFrom || null,
    date_to: filters.dateTo || null,
    audio_ids: filters.audioIds || [],
    limit: Number.isFinite(Number(filters.limit)) ? Number(filters.limit) : null,
  };
}

const DEFAULT_CATEGORY_FILTERS = {
  frequent_words: {
    langs: [],
    speakers: [],
    date_from: null,
    date_to: null,
    audio_ids: [],
    limit: 30,
  },
  languages: {
    langs: [],
    speakers: [],
    date_from: null,
    date_to: null,
    audio_ids: [],
    limit: null,
  },
  dates: {
    langs: [],
    speakers: [],
    date_from: null,
    date_to: null,
    audio_ids: [],
    limit: 30,
  },
  speakers: {
    langs: [],
    speakers: [],
    date_from: null,
    date_to: null,
    audio_ids: [],
    limit: 20,
  },
};

async function triggerBlobDownload(response, fallbackName) {
  const fileName = parseFilename(response.headers['content-disposition']) || fallbackName;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
async function downloadExport(category, format, filters = {}) {
  const config = EXPORT_ENDPOINTS[category];
  if (!config) {
    throw new Error(`Неизвестная категория статистики: ${category}`);
  }

  const params = config.buildParams(filters);
  params.set('format', format);

  const response = await apiClient.get(config.path, {
    params,
    responseType: 'blob',
  });

  await triggerBlobDownload(response, `${config.fallbackName}.${format}`);
}

async function downloadAllExport(format, categoryFilters = {}) {
  const response = await apiClient.post('/api/v1/stats/export/all', {
    format,
    frequent_words: categoryFilters['frequent-words']
      ? toCategoryFiltersPayload(categoryFilters['frequent-words'])
      : DEFAULT_CATEGORY_FILTERS.frequent_words,
    languages: categoryFilters.languages
      ? toCategoryFiltersPayload(categoryFilters.languages)
      : DEFAULT_CATEGORY_FILTERS.languages,
    dates: categoryFilters.dates
      ? toCategoryFiltersPayload(categoryFilters.dates)
      : DEFAULT_CATEGORY_FILTERS.dates,
    speakers: categoryFilters.speakers
      ? toCategoryFiltersPayload(categoryFilters.speakers)
      : DEFAULT_CATEGORY_FILTERS.speakers,
  }, {
    responseType: 'blob',
  });

  await triggerBlobDownload(response, `stats_all.${format}`);
}

export const statsApi = {
  fetchFrequentWords: async (filters = {}) => {
    const response = await apiClient.get('/api/v1/stats/words/frequent', {
      params: buildFrequentWordsParams(filters),
    });
    return response.data;
  },

  fetchSpeakerWordStats: async (filters = {}) => {
    const response = await apiClient.get('/api/v1/stats/speakers/words', {
      params: buildSpeakerStatsParams(filters),
    });
    return response.data;
  },

  fetchLanguageWordStats: async (filters = {}) => {
    const response = await apiClient.get('/api/v1/stats/languages/words', {
      params: buildLanguageStatsParams(filters),
    });
    return response.data;
  },

  fetchDateWordStats: async (filters = {}) => {
    const response = await apiClient.get('/api/v1/stats/dates/words', {
      params: buildDateStatsParams(filters),
    });
    return response.data;
  },

  downloadStatsExport: downloadExport,
  downloadAllStatsExport: downloadAllExport,
};
