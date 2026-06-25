import { useState } from 'react';

function AuthPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', username.trim());
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      // If backend returns 401 or 400, catch it here
      if (!response.ok) {
        throw new Error(data.detail || 'Incorrect username or password.');
      }

      // SUCCESS: Save token and navigate to Dashboard
      localStorage.setItem('token', data.access_token);
      onLoginSuccess(); 
      
    } catch (err) {
      // FAILURE: Stay on this page and show the message
      console.error("Login failed:", err);
      setError(err.message || 'Incorrect username or password.');
    } finally {
      setIsLoading(false);
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
        borderRadius: '4px', 
        padding: '60px 45px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
        border: '1px solid #ddd',
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
            margin: '0 0 35px 0',
            fontFamily: 'system-ui, sans-serif'
          }}>
            Use username <strong style={{ color: '#000' }}>"admin"</strong> and password <strong style={{ color: '#000' }}>"admin"</strong> to access the site
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
            placeholder="Username"
            value={username}
            disabled={isLoading}
            onChange={(e) => setUsername(e.target.value)}
            style={{ 
              width: '100%', 
              height: '48px', 
              backgroundColor: '#fff', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '0 16px', 
              marginBottom: '20px', 
              fontSize: '16px', 
              color: '#000', 
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'system-ui, sans-serif'
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            disabled={isLoading}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', 
              height: '48px', 
              backgroundColor: '#fff', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '0 16px', 
              marginBottom: '30px', 
              fontSize: '16px', 
              color: '#000', 
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'system-ui, sans-serif'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={!isFormValid}
              style={{
                padding: '8px 24px',
                backgroundColor: isFormValid ? '#522504' : '#bbb', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                fontSize: '15px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
                fontFamily: 'system-ui, sans-serif'
              }}
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;