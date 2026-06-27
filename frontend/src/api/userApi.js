import apiClient from './apiClient';

const BACKEND_URLS = {
  profile: '/api/v1/auth/me',
  changePassword: '/api/v1/auth/change-password',
  delete: '/api/v1/auth/me'
};

export const userApi = {
  fetchProfile: async () => {
    const response = await apiClient.get(BACKEND_URLS.profile);
    return response.data;
  },

  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    const response = await apiClient.post(BACKEND_URLS.changePassword, {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await apiClient.delete(BACKEND_URLS.delete);
    return response.data;
  }
};