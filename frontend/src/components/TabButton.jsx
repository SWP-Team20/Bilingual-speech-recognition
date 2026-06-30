function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: '6px',
        padding: '14px',
        textAlign: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        width: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        fontFamily: 'inherit',
        border: 'none',
        transition: 'all 0.2s ease',
        backgroundColor: active ? '#522504' : '#e0e0e0',
        color: active ? '#fff' : '#616161',
      }}
    >
      {children}
    </button>
  );
}

export default TabButton;
