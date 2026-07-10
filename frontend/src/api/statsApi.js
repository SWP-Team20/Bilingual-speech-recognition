import apiClient from './apiClient';

function clampLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 30;
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

export const statsApi = {
  fetchFrequentWords: async (filters = {}) => {
    const params = new URLSearchParams();
    params.set('limit', String(clampLimit(filters.limit)));
    appendListParams(params, 'lang', filters.langs);
    appendListParams(params, 'speaker', speakerList(filters));
    appendListParams(params, 'audio_id', filters.audioIds);
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);

    const response = await apiClient.get('/api/v1/stats/words/frequent', {
      params,
    });
    return response.data;
  },

  fetchSpeakerWordStats: async (filters = {}) => {
    const params = new URLSearchParams();
    params.set('limit', String(clampLimit(filters.limit ?? 20)));
    appendListParams(params, 'lang', filters.langs);
    appendListParams(params, 'audio_id', filters.audioIds);
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);

    const response = await apiClient.get('/api/v1/stats/speakers/words', {
      params,
    });
    return response.data;
  },

  fetchLanguageWordStats: async (filters = {}) => {
    const params = new URLSearchParams();
    appendListParams(params, 'speaker', speakerList(filters));
    appendListParams(params, 'audio_id', filters.audioIds);
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);

    const response = await apiClient.get('/api/v1/stats/languages/words', {
      params,
    });
    return response.data;
  },

  fetchDateWordStats: async (filters = {}) => {
    const params = new URLSearchParams();
    params.set('limit', String(clampLimit(filters.limit ?? 30)));
    appendListParams(params, 'lang', filters.langs);
    appendListParams(params, 'speaker', speakerList(filters));
    appendListParams(params, 'audio_id', filters.audioIds);

    const response = await apiClient.get('/api/v1/stats/dates/words', {
      params,
    });
    return response.data;
  },
};
