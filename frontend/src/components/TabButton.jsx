function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = '#d6d6d6';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = active
          ? '0 6px 16px rgba(22,163,74,0.28)'
          : '0 4px 10px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = '#e0e0e0';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = active ? '0 4px 12px rgba(22,163,74,0.22)' : 'none';
      }}
      style={{
        borderRadius: '8px',
        padding: '14px',
        textAlign: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        width: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        fontFamily: 'inherit',
        border: 'none',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
        backgroundColor: active ? '#15803d' : '#e0e0e0',
        color: active ? '#fff' : '#616161',
        boxShadow: active ? '0 4px 12px rgba(22,163,74,0.22)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

export default TabButton;
