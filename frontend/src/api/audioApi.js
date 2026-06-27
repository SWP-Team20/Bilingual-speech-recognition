import apiClient from './apiClient';

export const audioApi = {
  // Matches GET /api/v1/audio/
  fetchAudioList: async () => {
    const response = await apiClient.get('/api/v1/audio/');
    return response.data;
  },

  // Matches POST /api/v1/upload-audio/
  uploadAudioFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/v1/upload-audio/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Matches GET /api/v1/audio/{audio_id}/status
  fetchAudioStatus: async (audioId) => {
    const response = await apiClient.get(`/api/v1/audio/${audioId}/status`);
    return response.data;
  },

  // Matches GET /api/v1/audio/{audio_id}?type=processed
  fetchAudioFile: async (audioId, type) => {
    const response = await apiClient.get(`/api/v1/audio/${audioId}?type=${type}`, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  },

  // Matches GET /api/v1/transcriptions/{audio_id}
  fetchTranscription: async (audioId) => {
    const response = await apiClient.get(`/api/v1/transcriptions/${audioId}`);
    return response.data;
  },

  // Matches DELETE /api/v1/audio/{audio_id}
  deleteAudio: async (audioId) => {
    const response = await apiClient.delete(`/api/v1/audio/${audioId}`);
    return response.data;
  }
};