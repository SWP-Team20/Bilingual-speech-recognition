import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { translateRole } from '../constants/roleTranslations';

function SecurityPage({ onDeleteAccountConfirm }) {
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState({ username: 'Загрузка...', role: 'Загрузка...' });
  const [isLoading, setIsLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await userApi.fetchProfile();
        setUserData({
          username: data.username || 'N/A',
          role: data.role || 'N/A'
        });
      } catch (error) {
        console.error("Не удалось загрузить данные профиля:", error);
        setUserData({ username: 'Ошибка', role: 'Ошибка' });
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert("Новый пароль и подтверждение не совпадают.");
      return;
    }

    try {
      await userApi.changePassword(currentPassword, newPassword, confirmPassword);
      alert("Пароль успешно обновлен!");
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Ошибка обновления пароля:", error);
      const backendMessage = error.response?.data?.detail;

      if (backendMessage && typeof backendMessage === 'string') {
        alert(backendMessage); 
      } else {
        alert("Не удалось обновить пароль. Убедитесь, что текущий пароль введен верно.");
      }
    }
  };

  // ================= ДОБАВЛЕННАЯ ФУНКЦИЯ УДАЛЕНИЯ АККАУНТА =================
  const handleDeleteAccountFinal = async () => {
    setShowDeleteModal(false);
    try {
      await userApi.deleteAccount();
      alert("Ваш аккаунт был успешно удален.");
      
      if (onDeleteAccountConfirm) {
        onDeleteAccountConfirm(); // Функция разлогирования из App.jsx (удаление токена)
      }
    } catch (error) {
      console.error("Ошибка при удалении аккаунта:", error);
      const errorMessage = error.response?.data?.detail || "Не удалось удалить аккаунт. Пожалуйста, попробуйте позже.";
      alert(errorMessage);
    }
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', fontFamily: 'inherit', textAlign: 'left' }}>
      
      <button 
        onClick={() => navigate('/dashboard')} 
        onMouseEnter={(e) => e.currentTarget.style.color = '#15803d'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#16a34a'}
        style={{ 
          background: 'none', border: 'none', color: '#16a34a', 
          fontWeight: 'bold', cursor: 'pointer', marginBottom: '24px', fontSize: '16px',
          padding: 0, transition: 'color 0.15s ease'
        }}
      >
        ← Обратно в панель управления
      </button>

      <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 24px 0', color: '#000' }}>
        Настройки безопасности
      </h2>

      <div style={{ backgroundColor: '#fff', border: '1px solid #ececec', borderRadius: '14px', padding: '32px', boxSizing: 'border-box', boxShadow: '0 4px 18px rgba(0,0,0,0.06)' }}>
        
        {/* Username Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#666', marginBottom: '4px', letterSpacing: '0.5px' }}>Имя пользователя</label>
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#111' }}>{userData.username}</div>
        </div>

        {/* Role Field */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#666', marginBottom: '4px', letterSpacing: '0.5px' }}>Роль</label>
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#111' }}>{translateRole(userData.role)}</div>
        </div>

        <hr style={{ border: 'none', height: '1px', backgroundColor: '#eee', margin: '24px 0' }} />

        {/* Change Password Form */}
        <form onSubmit={handlePasswordChangeSubmit}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }}>Сменить пароль</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Текущий пароль</label>
            <input 
              type="password" 
              required
              disabled={isLoading}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Новый пароль</label>
            <input 
              type="password" 
              required
              disabled={isLoading}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Подтверждение нового пароля</label>
            <input 
              type="password" 
              required
              disabled={isLoading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = '#15803d'; }}
            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = '#16a34a'; }}
            style={{ 
              backgroundColor: '#16a34a', color: '#fff', border: 'none', 
              padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
              opacity: isLoading ? 0.6 : 1,
              transition: 'background-color 0.2s ease'
            }}
          >
            Сменить пароль
          </button>
        </form>

        <hr style={{ border: 'none', height: '1px', backgroundColor: '#eee', margin: '32px 0' }} />

        {/* Danger Zone Section */}
        <div style={{ paddingTop: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#d32f2f' }}>Опасная зона</h3>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 16px 0' }}>
            После удаления аккаунта пути назад нет. Пожалуйста, будьте уверены.
          </p>
          <button 
            type="button"
            disabled={isLoading}
            onClick={() => setShowDeleteModal(true)}
            style={{ 
              backgroundColor: 'transparent', color: '#d32f2f', border: '1px solid #d32f2f', 
              padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
              transition: 'background-color 0.2s',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#fff5f5')}
            onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Удалить аккаунт
          </button>
        </div>

      </div>

      {/* Account Deletion Overlay Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '32px', borderRadius: '14px', maxWidth: '440px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)', boxSizing: 'border-box', textAlign: 'center',
            animation: 'modalIn 0.16s ease-out'
          }}>
            <style>{`@keyframes modalIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
            <h4 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#d32f2f' }}>
              Удалить аккаунт?
            </h4>
            <p style={{ fontSize: '15px', color: '#444', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Вы уверены, что хотите удалить свой аккаунт? Это действие не может быть отменено, и вы потеряете доступ ко всем своим транскрипциям.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button"
                onClick={() => setShowDeleteModal(false)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ececec'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                style={{ 
                  backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #ccc', 
                  padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                Отмена
              </button>
              <button 
                type="button"
                onClick={handleDeleteAccountFinal}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b71c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                style={{ 
                  backgroundColor: '#d32f2f', color: '#fff', border: 'none', 
                  padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                Да, удалить перманентно
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}

export default SecurityPage;