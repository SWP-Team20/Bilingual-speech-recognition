import { useState } from 'react';

function AuthPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLoginSuccess();
    }
  };

  const isFormValid = username.trim() !== '' && password.trim().length >= 4;

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
            margin: '0 0 35px 0', 
            color: '#000',
            letterSpacing: '-0.5px'
          }}>
            Bilingual Speech Recognition
          </h2>

          <input
            type="text"
            placeholder="Username"
            value={username}
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
              Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;