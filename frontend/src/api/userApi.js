import apiClient from './apiClient';

const BACKEND_URLS = {
  profile: '/api/v1/auth/me',
  changePassword: '/api/v1/auth/change-password',
  delete: '/api/v1/auth/me',
  
  // Эндпоинты для админ-панели
  adminUsers: '/api/v1/users/'
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
  },

  // --- НОВЫЕ МЕТОДЫ ДЛЯ АДМИНИСТРИРОВАНИЯ ---

  // Получить всех пользователей (GET /api/v1/users/)
  adminGetAllUsers: async () => {
    const response = await apiClient.get(BACKEND_URLS.adminUsers);
    return response.data;
  },

  // Создать нового пользователя (POST /api/v1/users/)
  adminCreateUser: async (userData) => {
    // userData должен содержать { username, password, role }
    const response = await apiClient.post(BACKEND_URLS.adminUsers, userData);
    return response.data;
  },

  // Сбросить пароль пользователя (PATCH /api/v1/users/{user_id}/reset-password)
  adminResetUserPassword: async (userId, passwordData) => {
    // passwordData теперь содержит { old_password, new_password, confirm_password }
    const response = await apiClient.patch(`${BACKEND_URLS.adminUsers}${userId}/reset-password`, passwordData);
    return response.data;
  },

  // Удалить пользователя (DELETE /api/v1/users/{user_id})
  adminDeleteUser: async (userId) => {
    const response = await apiClient.delete(`${BACKEND_URLS.adminUsers}${userId}`);
    return response.data;
  }
};