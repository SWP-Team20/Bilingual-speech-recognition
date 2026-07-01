import { useState, useRef, useEffect } from 'react';
import profileIcon from '../assets/profile-icon.svg';

function ProfileDropdown({ onLogout, onNavigateToSecurity, size = 48 }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={dropdownRef} 
      style={{ 
        position: 'relative', 
        display: 'flex',
        alignItems: 'center',
        height: `${size}px`
      }}
    >
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Меню профиля"
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,0,0,0.07)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          borderRadius: '50%',
          transition: 'box-shadow 0.15s ease',
          border: 'none',
          background: 'transparent',
          padding: 0,
        }}
      >
        <img 
          src={profileIcon} 
          alt="Profile Menu" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            display: 'block'
          }} 
        />
      </button>

      {/* Floating Dropdown Menu Panel Matrix */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '56px',
          right: 0,
          backgroundColor: '#fff',
          minWidth: '160px',
          borderRadius: '10px',
          border: '1px solid #e6e6e6',
          boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transformOrigin: 'top right',
          animation: 'profileMenuIn 0.14s ease-out'
        }}>
          <style>{`
            @keyframes profileMenuIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          {/* Dropdown Options */}
          <button
            onClick={() => {
              setIsOpen(false);
              if (onNavigateToSecurity) onNavigateToSecurity();
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: '#333',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'inherit',
              transition: 'background-color 0.15s ease'
            }}
          >
            Безопасность
          </button>
          <div style={{ height: '1px', backgroundColor: '#eee', width: '100%' }} />
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdecea'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: '#d32f2f',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'inherit',
              transition: 'background-color 0.15s ease'
            }}
          >
            Выйти из аккаунта
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;