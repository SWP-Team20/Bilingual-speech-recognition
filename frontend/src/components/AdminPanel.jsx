import { useState, useEffect } from 'react';
import { userApi } from '../api/userApi';

function AdminPanel() {
  const [usersList, setUsersList] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [error, setError] = useState(''); // Стейт для хранения текста ошибки

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      const data = await userApi.adminGetAllUsers();
      setUsersList(data || []);
    } catch (err) {
      console.error("Ошибка при получении списка пользователей:", err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(''); // Сбрасываем ошибку перед новой попыткой

    // 1. Валидация на фронтенде (согласно ограничениям схемы UserCreate)
    if (!newUsername || !newUserPassword) {
      return setError("Заполните все поля!");
    }
    if (newUsername.length < 3) {
      return setError("Имя пользователя должно быть не менее 3 символов!");
    }
    if (newUserPassword.length < 4) {
      return setError("Пароль должен быть не менее 4 символов!");
    }

    // 2. Отправка запроса и обработка ответа бэкенда
    try {
      await userApi.adminCreateUser({ 
        username: newUsername, 
        password: newUserPassword, 
        role: newUserRole 
      });
      setNewUsername('');
      setNewUserPassword('');
      loadAdminUsers();
    } catch (err) {
      console.error("Ошибка создания пользователя:", err);
      
      // Проверяем, что вернул бэкенд (например, "Username already registered")
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else {
          setError(JSON.stringify(detail));
        }
      } else {
        setError("Не удалось создать пользователя. Ошибка соединения.");
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
      alert("Не удалось изменить пароль. Проверьте консоль.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) return;
    try {
      await userApi.adminDeleteUser(userId);
      loadAdminUsers();
    } catch (err) {
      console.error("Ошибка удаления пользователя:", err);
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
              usersList.map(u => (
                <div key={u.id || u.user_id} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '500', fontSize: '16px', color: '#000' }}>{u.username}</div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Роль: {u.role}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => handleChangePassword(u.id || u.user_id)} style={{ padding: '6px 12px', backgroundColor: '#773505', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '550' }}>Пароль</button>
                    <button type="button" onClick={() => handleDeleteUser(u.id || u.user_id)} style={{ padding: '6px 12px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '550' }}>Удалить</button>
                  </div>
                </div>
              ))
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
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>Имя пользователя</label>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>Пароль</label>
              <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>Роль</label>
              <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box', backgroundColor: '#fff' }}>
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Блок отображения ошибки, если она есть */}
            {error && (
              <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', textAlign: 'left', fontWeight: '500', border: '1px solid #ffcdd2' }}>
                {error}
              </div>
            )}

            <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#773505', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', width: '100%', fontWeight: '550', marginTop: '8px' }}>
              Создать
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

export default AdminPanel;