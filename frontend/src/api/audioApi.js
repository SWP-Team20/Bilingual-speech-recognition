import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const BACKEND_URLS = {
  base: API_BASE,
  upload: `${API_BASE}/upload-audio/`,
  list: `${API_BASE}/audio/`,
  transcription: `${API_BASE}/transcriptions/`
};

const api = axios.create();

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const audioApi = {
  // Fetch the list of all uploaded audio records
  fetchAudioList: async () => {
    const response = await api.get(BACKEND_URLS.list);
    return response.data;
  },

  // Upload a raw audio file using multipart/form-data packaging
  uploadAudioFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(BACKEND_URLS.upload, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Retrieve the speech transcription map for a specific recording ID
  fetchTranscription: async (audioId) => {
    const response = await api.get(`${BACKEND_URLS.transcription}${audioId}`);
    return response.data;
  }
};