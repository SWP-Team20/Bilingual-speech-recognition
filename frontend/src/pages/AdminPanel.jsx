import { useState, useEffect } from 'react';
import { userApi } from '../api/userApi';
import { ROLE_TRANSLATIONS, translateRole } from '../constants/roleTranslations';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { colors, radius, shadow, MOBILE_BREAKPOINT } from '../theme';

function AdminPanel() {
  const [usersList, setUsersList] = useState([]);
  const [currentAdminUsername, setCurrentAdminUsername] = useState(''); // Имя текущего админа
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [error, setError] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [pwdUserId, setPwdUserId] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);

  const toast = useToast();
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);

  // Вычисляем валидность прямо во время рендеринга
  const isFormInvalid = newUsername.trim().length < 3 || newUserPassword.length < 4;

  useEffect(() => {
    loadAdminProfile();
    loadAdminUsers();
  }, []);

  useEffect(() => {
    if (usersList.length > 0) {
      generateDefaultCredentials(newUserRole, usersList);
    }
  }, [newUserRole, usersList]);

  const loadAdminProfile = async () => {
    try {
      const data = await userApi.fetchProfile();
      setCurrentAdminUsername(data.username || '');
    } catch (err) {
      console.error("Не удалось загрузить профиль администратора:", err);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const data = await userApi.adminGetAllUsers();
      const currentUsers = data || [];
      setUsersList(currentUsers);
    } catch (err) {
      console.error("Ошибка при получении списка пользователей:", err);
      toast.error('Не удалось загрузить список пользователей');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const generateDefaultCredentials = (role, currentUsers) => {
    const sameRoleUsers = currentUsers.filter(u => u.role === role);
    
    let maxId = 0;
    sameRoleUsers.forEach(u => {
      const parts = u.username.split('_');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    });
    
    setNewUsername(`${role}_${maxId + 1}`);

    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let autoPassword = '';
    for (let i = 0; i < 4; i++) {
      autoPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(autoPassword);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    // Базовые проверки на пустоту на всякий случай оставляем
    if (!newUsername || !newUserPassword) {
      return setError("Заполните все поля!");
    }

    try {
      await userApi.adminCreateUser({ 
        username: newUsername.trim(), 
        password: newUserPassword, 
        role: newUserRole 
      });
      
      setNewUserRole('user');
      loadAdminUsers();
      toast.success('Пользователь создан');
    } catch (err) {
      console.error("Ошибка создания пользователя:", err);
      const backendMessage = err.response?.data?.detail;
      if (backendMessage && typeof backendMessage === 'string') {
        setError(backendMessage);
      } else {
        setError("Не удалось создать пользователя.");
      }
    }
  };

  const submitChangePassword = async (newPass) => {
    if (!newPass || newPass.length < 4) {
      toast.error('Пароль слишком короткий! Минимум 4 символа.');
      return;
    }
    const userId = pwdUserId;
    setPwdUserId(null);
    try {
      await userApi.adminResetUserPassword(userId, {
        old_password: "admin_reset",
        new_password: newPass,
        confirm_password: newPass
      });
      toast.success('Пароль успешно изменен');
    } catch (err) {
      console.error("Ошибка изменения пароля:", err);
      const backendMessage = err.response?.data?.detail;
      toast.error(backendMessage && typeof backendMessage === 'string' ? backendMessage : 'Не удалось изменить пароль.');
    }
  };

  const confirmDeleteUser = async () => {
    const userId = deleteUserId;
    setDeleteUserId(null);
    try {
      await userApi.adminDeleteUser(userId);
      loadAdminUsers();
      toast.success('Пользователь удалён');
    } catch (err) {
      console.error("Ошибка удаления пользователя:", err);
      const backendMessage = err.response?.data?.detail;
      toast.error(backendMessage && typeof backendMessage === 'string' ? backendMessage : 'Не удалось удалить пользователя.');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isNarrow ? '28px' : '48px', height: isNarrow ? 'auto' : '100%', minHeight: 0 }}>
      
      {/* ЛЕВАЯ СТОРОНА: СПИСОК ПОЛЬЗОВАТЕЛЕЙ */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: isNarrow ? 'auto' : '100%', alignItems: 'stretch' }}>
        <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>
            Управление пользователями
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: isNarrow ? 'visible' : 'auto', paddingRight: isNarrow ? 0 : '12px', boxSizing: 'border-box', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {isLoadingUsers ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ backgroundColor: colors.surface, padding: '14px', borderRadius: radius.md, border: `1px solid ${colors.border}`, boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: shadow.sm }}>
                    <div style={{ flex: 1 }}>
                      <Skeleton width="140px" height="16px" style={{ marginBottom: '8px' }} />
                      <Skeleton width="90px" height="12px" />
                    </div>
                    <Skeleton width="160px" height="32px" />
                  </div>
                ))}
              </>
            ) : usersList.length === 0 ? (
              <div style={{ color: colors.textFaint, textAlign: 'left' }}>Пользователи не найдены</div>
            ) : (
              usersList.map(u => {
                const isMe = u.username === currentAdminUsername;
                return (
                  <div key={u.id || u.user_id} style={{ backgroundColor: colors.surface, padding: '14px', borderRadius: radius.md, border: `1px solid ${colors.border}`, boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: shadow.sm }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: '500', fontSize: '16px', color: colors.text }}>
                        {u.username} {isMe && <span style={{ color: colors.primary, fontWeight: 'bold' }}>(Я)</span>}
                      </div>
                      <div style={{ fontSize: '14px', color: colors.textSubtle, marginTop: '4px' }}>
                        Роль: {translateRole(u.role)}
                      </div>
                    </div>
                    
                    {!isMe && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => setPwdUserId(u.id || u.user_id)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary} style={{ padding: '6px 12px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: radius.sm, cursor: 'pointer', fontSize: '14px', fontWeight: '550', transition: 'background-color 0.2s ease' }}>Сменить пароль</button>
                        <button type="button" onClick={() => setDeleteUserId(u.id || u.user_id)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.dangerHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.danger} style={{ padding: '6px 12px', backgroundColor: colors.danger, color: 'white', border: 'none', borderRadius: radius.sm, cursor: 'pointer', fontSize: '14px', fontWeight: '550', transition: 'background-color 0.2s ease' }}>Удалить</button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ПРАВАЯ СТОРОНА: ФОРМА СОЗДАНИЯ */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: isNarrow ? 'auto' : '100%', alignItems: 'stretch' }}>
        <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>
            Создать пользователя
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', height: '100%', minHeight: 0, width: '100%' }}>
          <form onSubmit={handleCreateUser} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e6e6e6', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>Роль</label>
              <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.boxShadow = 'none'; }} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}>
                <option value="user">{ROLE_TRANSLATIONS['user']}</option>
                <option value="manager">{ROLE_TRANSLATIONS['manager']}</option>
                <option value="admin">{ROLE_TRANSLATIONS['admin']}</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>Имя пользователя</label>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.boxShadow = 'none'; }} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>Пароль</label>
              <input type="text" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.boxShadow = 'none'; }} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }} />
            </div>

            {error && (
              <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', textAlign: 'left', fontWeight: '500', border: '1px solid #ffcdd2' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isFormInvalid}
              onMouseEnter={(e) => { if (!isFormInvalid) e.currentTarget.style.backgroundColor = '#15803d'; }}
              onMouseLeave={(e) => { if (!isFormInvalid) e.currentTarget.style.backgroundColor = '#16a34a'; }}
              style={{ 
                padding: '10px 12px', 
                backgroundColor: '#16a34a', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: isFormInvalid ? 'not-allowed' : 'pointer', 
                fontSize: '14px', 
                width: '100%', 
                fontWeight: '550', 
                marginTop: '8px',
                opacity: isFormInvalid ? 0.5 : 1,
                transition: 'background-color 0.2s ease'
              }}
            >
              Создать
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={pwdUserId !== null}
        title="Сменить пароль"
        message="Введите новый пароль для пользователя (минимум 4 символа)."
        confirmLabel="Сменить"
        requireInput
        inputLabel="Новый пароль"
        inputType="text"
        inputPlaceholder="Новый пароль"
        onConfirm={submitChangePassword}
        onCancel={() => setPwdUserId(null)}
      />

      <ConfirmDialog
        open={deleteUserId !== null}
        title="Удалить пользователя?"
        message="Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить."
        confirmLabel="Удалить"
        danger
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteUserId(null)}
      />

    </div>
  );
}

export default AdminPanel;