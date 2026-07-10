import axios from 'axios';

const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export async function refreshAccessToken() {
  const token = getToken();
  if (!token) throw new Error('No token');

  const response = await axios.post(
    `${API_BASE}/api/v1/auth/refresh`,
    null,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  setToken(response.data.access_token);
  return response.data.access_token;
}

export function startSessionKeepAlive() {
  const tick = () => {
    if (document.visibilityState !== 'visible') return;
    if (!getToken()) return;
    refreshAccessToken().catch(() => {});
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') tick();
  };

  tick();
  const intervalId = setInterval(tick, REFRESH_INTERVAL_MS);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
