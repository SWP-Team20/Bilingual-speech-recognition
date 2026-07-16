import apiClient from './apiClient';

function appendListParams(params, key, values) {
  if (!values?.length) return;
  values.forEach((value) => params.append(key, value));
}

export const speakersApi = {
  listSpeakers: async ({ includeOrphans = false } = {}) => {
    const response = await apiClient.get('/api/v1/speakers/', {
      params: { include_orphans: includeOrphans },
    });
    return response.data;
  },

  fetchSpeakerWords: async (speakerId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);
    appendListParams(params, 'audio_id', filters.audioIds);
    if (filters.limit != null) params.set('limit', String(filters.limit));
    if (filters.offset != null) params.set('offset', String(filters.offset));

    const response = await apiClient.get(`/api/v1/speakers/${speakerId}/words?${params.toString()}`);
    return response.data;
  },
};
