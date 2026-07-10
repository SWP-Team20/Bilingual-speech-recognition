import axios from 'axios';
import { clearSession, getToken, refreshAccessToken } from './authSession';

// In dev, Vite proxies /api/v1 to the backend — same origin, no CORS issues.
const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

// Single shared Axios instance for the entire application
const apiClient = axios.create({
  baseURL: API_BASE,
});

// Attaches token to every outgoing request automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Catches global 401s: try silent refresh once, then logout.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isLoginRequest = config?.url?.includes('/api/v1/auth/login');
    const isRefreshRequest = config?.url?.includes('/api/v1/auth/refresh');

    if (
      error.response?.status === 401
      && !isLoginRequest
      && !isRefreshRequest
      && !config?._authRetried
    ) {
      config._authRetried = true;
      try {
        const newToken = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(config);
      } catch (refreshError) {
        console.warn('[Auth] Session expired or invalid token. Redirecting...');
        clearSession();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;