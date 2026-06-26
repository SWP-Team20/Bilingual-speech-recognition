import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const BACKEND_URLS = {
  profile: `${API_BASE}/api/v1/auth/me`,
  changePassword: `${API_BASE}/api/v1/auth/change-password`,
  delete: `${API_BASE}/api/v1/auth/me`
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

export const userApi = {
  // Fetch current user profile (username, role)
  fetchProfile: async () => {
    const response = await api.get(BACKEND_URLS.profile);
    return response.data; // Handles payload: { username, role, ... }
  },

  // Change user password using the explicit JSON request payload schema
  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    const response = await api.post(BACKEND_URLS.changePassword, {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    return response.data;
  },

  // Delete user account permanently
  deleteAccount: async () => {
    const response = await api.delete(BACKEND_URLS.delete);
    return response.data;
  }
};