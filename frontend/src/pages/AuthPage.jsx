import { useState } from 'react';
import apiClient from '../api/apiClient';

function AuthPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Предотвращаем всплытие события

    // Если уже идет загрузка, игнорируем повторные клики
    if (isLoading || !username.trim() || !password.trim()) return;

    setIsLoading(true);
    setError(''); // Сбрасываем старую ошибку ТОЛЬКО перед началом нового запроса

    try {
      const formData = new URLSearchParams();
      formData.append('username', username.trim());
      formData.append('password', password);

      const response = await apiClient.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = response.data;

      localStorage.setItem('token', data.access_token);
      
      // Передаем управление родителю только при УСПЕШНОМ входе
      onLoginSuccess(); 
      
    } catch (err) {
      console.error("Ошибка аутентификации:", err);

      // Вытаскиваем ошибку из бэка, если она есть
      const errorMessage = err.response?.data?.detail || 'Неправильное имя пользователя или пароль.';
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Кнопка снова активна, но стейт error НЕ трогаем
    }
  };

  const isFormValid = username.trim() !== '' && password.trim().length >= 4 && !isLoading;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      width: '100%',
      boxSizing: 'border-box',
      margin: '0',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ 
        backgroundColor: '#fff', 
        width: '100%', 
        maxWidth: '540px', 
        borderRadius: '16px', 
        padding: '60px 45px', 
        boxShadow: '0 18px 50px rgba(0,0,0,0.10)', 
        border: '1px solid #ececec',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <form onSubmit={handleLoginSubmit}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            margin: '0 0 10px 0',
            color: '#000',
            letterSpacing: '-0.5px'
          }}>
            Bilingual Speech Recognition
          </h2>

          {/* Demo credentials text */}
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '15px 0 35px 0',
            fontFamily: 'system-ui, sans-serif'
          }}>
            Используйте имя пользователя <strong style={{ color: '#000' }}>"admin"</strong> и<br></br>пароль <strong style={{ color: '#000' }}>"admin"</strong>, чтобы получить доступ
          </p>

          {/* Error Message Box */}
          {error && (
            <div style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'left',
              border: '1px solid #ffcdd2'
            }}>
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            disabled={isLoading}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.boxShadow = 'none'; }}
            style={{ 
              width: '100%', 
              height: '48px', 
              backgroundColor: '#fff', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '0 16px', 
              marginBottom: '20px', 
              fontSize: '16px', 
              color: '#000', 
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              fontFamily: 'system-ui, sans-serif'
            }}
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            disabled={isLoading}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.boxShadow = 'none'; }}
            style={{ 
              width: '100%', 
              height: '48px', 
              backgroundColor: '#fff', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '0 16px', 
              marginBottom: '30px', 
              fontSize: '16px', 
              color: '#000', 
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              fontFamily: 'system-ui, sans-serif'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={!isFormValid}
              onMouseEnter={(e) => { if (isFormValid) e.currentTarget.style.backgroundColor = '#166534'; }}
              onMouseLeave={(e) => { if (isFormValid) e.currentTarget.style.backgroundColor = '#15803d'; }}
              style={{
                padding: '10px 28px',
                backgroundColor: isFormValid ? '#15803d' : '#bbb', 
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                fontSize: '15px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
                fontFamily: 'system-ui, sans-serif'
              }}
            >
              {isLoading ? 'Производится вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;