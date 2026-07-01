import { useState, useEffect } from 'react';
import { colors, radius, focusRing } from '../theme';

function AudioSearchBar({ onSearch, style, compact = false }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const inputHeight = compact ? '44px' : '48px';
  const hasQuery = query.length > 0;

  const clearQuery = () => setQuery('');

  return (
    <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box', ...style }}>
      <input
        className="audio-search-input"
        type="text"
        role="searchbox"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск"
        aria-label="Поиск по названию аудиозаписи"
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = focusRing;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
        style={{
          height: inputHeight,
          padding: `0 ${hasQuery ? '44px' : '16px'} 0 16px`,
          backgroundColor: '#d9d9d9',
          border: 'none',
          borderRadius: radius.sm,
          fontSize: compact ? '16px' : '18px',
          fontWeight: 'bold',
          fontFamily: 'system-ui, sans-serif',
          color: colors.text,
          boxSizing: 'border-box',
          outline: 'none',
          width: '100%',
        }}
      />

      {hasQuery && (
        <button
          type="button"
          onClick={clearQuery}
          aria-label="Очистить поиск"
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '28px',
            height: '28px',
            padding: 0,
            border: 'none',
            borderRadius: radius.sm,
            backgroundColor: 'transparent',
            color: colors.textMuted,
            fontSize: '16px',
            fontWeight: 'bold',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            transition: 'background-color 0.15s ease',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default AudioSearchBar;
