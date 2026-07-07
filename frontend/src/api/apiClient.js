import axios from 'axios';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Catches global 401s and safely handles eviction/routing
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Проверяем, был ли это запрос на логин
    const isLoginRequest = error.config && error.config.url && error.config.url.includes('/api/v1/auth/login');

    // Выкидываем пользователя ТОЛЬКО если это 401 ошибка И запрос был НЕ на логин
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      console.warn("[Auth] Session expired or invalid token. Redirecting...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Обязательно пробрасываем ошибку дальше, чтобы catch в AuthPage её поймал
    return Promise.reject(error);
  }
);

export default apiClient;