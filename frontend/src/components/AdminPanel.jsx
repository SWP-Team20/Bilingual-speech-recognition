import { useState, useEffect } from 'react';
import { userApi } from '../api/userApi';

const ROLE_TRANSLATIONS = {
  'user': 'Пользователь',
  'manager': 'Менеджер',
  'admin': 'Администратор'
};

function AdminPanel() {
  const [usersList, setUsersList] = useState([]);
  const [currentAdminUsername, setCurrentAdminUsername] = useState(''); // Имя текущего админа
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [error, setError] = useState('');

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

  const handleChangePassword = async (userId) => {
    const newPass = prompt("Введите новый пароль для пользователя (минимум 4 символа):");
    if (!newPass) return;
    
    if (newPass.length < 4) {
      return alert("Пароль слишком короткий! Минимум 4 символа.");
    }

    try {
      await userApi.adminResetUserPassword(userId, { 
        old_password: "admin_reset",
        new_password: newPass,
        confirm_password: newPass
      });
      alert("Пароль успешно изменен");
    } catch (err) {
      console.error("Ошибка изменения пароля:", err);
      const backendMessage = err.response?.data?.detail;
      if (backendMessage && typeof backendMessage === 'string') {
        alert(backendMessage);
      } else {
        alert("Не удалось изменить пароль.");
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) return;
    try {
      await userApi.adminDeleteUser(userId);
      loadAdminUsers();
    } catch (err) {
      console.error("Ошибка удаления пользователя:", err);
      const backendMessage = err.response?.data?.detail;
      if (backendMessage && typeof backendMessage === 'string') {
        alert(backendMessage);
      } else {
        alert("Не удалось удалить пользователя.");
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', height: '100%', minHeight: 0 }}>
      
      {/* ЛЕВАЯ СТОРОНА: СПИСОК ПОЛЬЗОВАТЕЛЕЙ */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', alignItems: 'stretch' }}>
        <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>
            Управление пользователями
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', boxSizing: 'border-box', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {usersList.length === 0 ? (
              <div style={{ color: '#757575', textAlign: 'left' }}>Пользователи не найдены</div>
            ) : (
              usersList.map(u => {
                const isMe = u.username === currentAdminUsername;
                return (
                  <div key={u.id || u.user_id} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: '500', fontSize: '16px', color: '#000' }}>
                        {u.username} {isMe && <span style={{ color: '#773505', fontWeight: 'bold' }}>(Я)</span>}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                        Роль: {ROLE_TRANSLATIONS[u.role?.toLowerCase()] || u.role}
                      </div>
                    </div>
                    
                    {!isMe && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => handleChangePassword(u.id || u.user_id)} style={{ padding: '6px 12px', backgroundColor: '#773505', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '550' }}>Сменить пароль</button>
                        <button type="button" onClick={() => handleDeleteUser(u.id || u.user_id)} style={{ padding: '6px 12px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '550' }}>Удалить</button>
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
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', alignItems: 'stretch' }}>
        <div style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, padding: 0, textAlign: 'left' }}>
            Создать пользователя
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', height: '100%', minHeight: 0, width: '100%' }}>
          <form onSubmit={handleCreateUser} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>Роль</label>
              <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box', backgroundColor: '#fff' }}>
                <option value="user">{ROLE_TRANSLATIONS['user']}</option>
                <option value="manager">{ROLE_TRANSLATIONS['manager']}</option>
                <option value="admin">{ROLE_TRANSLATIONS['admin']}</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>Имя пользователя</label>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>Пароль</label>
              <input type="text" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
            </div>

            {error && (
              <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', textAlign: 'left', fontWeight: '500', border: '1px solid #ffcdd2' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isFormInvalid}
              style={{ 
                padding: '8px 12px', 
                backgroundColor: '#773505', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: isFormInvalid ? 'not-allowed' : 'pointer', 
                fontSize: '14px', 
                width: '100%', 
                fontWeight: '550', 
                marginTop: '8px',
                opacity: isFormInvalid ? 0.5 : 1
              }}
            >
              Создать
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

export default AdminPanel;