import { useState } from 'react';
import apiClient from '../api/apiClient';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { colors, focusRing, MOBILE_BREAKPOINT, radius } from '../theme';

function AuthPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || !username.trim() || !password.trim()) return;

    setIsLoading(true);
    setError('');

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
      onLoginSuccess();
    } catch (err) {
      console.error('Ошибка аутентификации:', err);
      const errorMessage = err.response?.data?.detail || 'Неправильное имя пользователя или пароль.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username.trim() !== '' && password.trim().length >= 4 && !isLoading;

  const inputStyle = {
    width: '100%',
    height: '48px',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: radius.sm,
    padding: '0 16px',
    fontSize: '16px',
    color: colors.text,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: colors.page,
      minHeight: '100vh',
      width: '100%',
      boxSizing: 'border-box',
      padding: isNarrow ? '24px 16px' : '40px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        boxSizing: 'border-box',
        textAlign: 'center',
      }}>
        <header style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: isNarrow ? '28px' : '36px',
        }}>
          <img
            src="/favicon.svg"
            alt=""
            aria-hidden="true"
            style={{
              display: 'block',
              height: isNarrow ? '80px' : '112px',
              width: 'auto',
              marginBottom: isNarrow ? '16px' : '20px',
            }}
          />
          <h1 style={{
            fontSize: isNarrow ? '24px' : '32px',
            fontWeight: 'bold',
            margin: 0,
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
            color: colors.textStrong,
            textAlign: 'center',
          }}>
            Bilingual Speech Recognition
          </h1>
        </header>

        <form
          onSubmit={handleLoginSubmit}
          style={{
            width: '100%',
            textAlign: 'left',
          }}
        >

          {error && (
            <div style={{
              backgroundColor: colors.dangerSoftBg,
              color: colors.dangerText,
              padding: '12px',
              borderRadius: radius.sm,
              marginBottom: '20px',
              fontSize: '14px',
              border: `1px solid ${colors.dangerSoftBorder}`,
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
            onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.boxShadow = focusRing; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderStrong; e.currentTarget.style.boxShadow = 'none'; }}
            style={{ ...inputStyle, marginBottom: '20px' }}
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            disabled={isLoading}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.boxShadow = focusRing; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderStrong; e.currentTarget.style.boxShadow = 'none'; }}
            style={{ ...inputStyle, marginBottom: '24px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
            type="submit"
            disabled={!isFormValid}
            onMouseEnter={(e) => { if (isFormValid) e.currentTarget.style.backgroundColor = colors.primaryDeep; }}
            onMouseLeave={(e) => { if (isFormValid) e.currentTarget.style.backgroundColor = colors.primaryHover; }}
            style={{
              padding: '10px 28px',
              backgroundColor: isFormValid ? colors.primaryHover : colors.disabled,
              color: colors.surface,
              border: 'none',
              borderRadius: radius.sm,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease',
              fontFamily: 'inherit',
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
