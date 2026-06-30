export const ROLE_TRANSLATIONS = {
  user: 'Пользователь',
  manager: 'Менеджер',
  admin: 'Администратор',
};

export function translateRole(role) {
  return ROLE_TRANSLATIONS[role?.toLowerCase()] || role;
}
