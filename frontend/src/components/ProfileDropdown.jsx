import { useState, useRef, useEffect } from 'react';
import profileIcon from '../assets/profile-icon.svg';

function ProfileDropdown({ onLogout }) {
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
        height: '48px'
        }}
    >
        
        {/* Profile Trigger Button */}
        <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
            width: '48px',
            height: '48px',
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
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
        </div>

        {/* Floating Dropdown Menu Panel Matrix */}
        {isOpen && (
        <div style={{
            position: 'absolute',
            top: '56px',
            right: 0,
            backgroundColor: '#fff',
            minWidth: '150px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Dropdown Options */}
            <button
            onClick={() => {
                alert("Still in progress.\n\nIt will contain change of the password and deletion of account.");
                setIsOpen(false);
            }}
            style={{
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: '#333',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'inherit'
            }}
            >
            Security
            </button>
            <div style={{ height: '1px', backgroundColor: '#eee', width: '100%' }} />
            <button
            onClick={() => {
                setIsOpen(false);
                onLogout();
            }}
            style={{
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: '#d32f2f',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'inherit'
            }}
            >
            Log Out
            </button>
        </div>
        )}
    </div>
    );
}

export default ProfileDropdown;