import apiClient from './apiClient';

export const speakersApi = {
  // Matches GET /api/v1/speakers/
  listSpeakers: async ({ includeOrphans = false } = {}) => {
    const response = await apiClient.get('/api/v1/speakers/', {
      params: { include_orphans: includeOrphans },
    });
    return response.data;
  },
};
