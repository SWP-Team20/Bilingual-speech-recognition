import { useState, useEffect, useRef } from 'react';
import { audioApi } from '../api/audioApi';
import { colors, radius, focusRing, shadow } from '../theme';

const MAX_SUGGESTIONS = 8;

function AudioSearchBar({
  onSearch,
  onSelectResult,
  showSuggestions = false,
  style,
  compact = false,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  useEffect(() => {
    if (!showSuggestions) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await audioApi.searchByFilename(trimmed);
        if (requestId !== requestIdRef.current) return;
        const list = Array.isArray(data) ? data.slice(0, MAX_SUGGESTIONS) : [];
        setSuggestions(list);
        setOpen(true);
        setHighlightIndex(-1);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        console.error('Ошибка поиска аудио:', error);
        setSuggestions([]);
        setOpen(true);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showSuggestions]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const inputHeight = compact ? '44px' : '48px';
  const hasQuery = query.length > 0;
  const showDropdown = showSuggestions && open && Boolean(query.trim());

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    setHighlightIndex(-1);
  };

  const selectSuggestion = (audio) => {
    if (!audio || !onSelectResult) return;
    setQuery(audio.filename || '');
    setOpen(false);
    setHighlightIndex(-1);
    onSelectResult(audio);
  };

  const onKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', boxSizing: 'border-box', ...style }}>
      <input
        className="audio-search-input"
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? 'audio-search-suggestions' : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          highlightIndex >= 0 ? `audio-search-option-${highlightIndex}` : undefined
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Поиск"
        aria-label="Поиск по названию аудиозаписи"
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = focusRing;
          if (showSuggestions && query.trim()) setOpen(true);
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
            zIndex: 1,
          }}
        >
          ✕
        </button>
      )}

      {showDropdown && (
        <div
          id="audio-search-suggestions"
          role="listbox"
          aria-label="Результаты поиска"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1100,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            boxShadow: shadow.lg,
            overflow: 'hidden',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {loading && suggestions.length === 0 ? (
            <div style={{ padding: '12px 16px', fontSize: '14px', color: colors.textFaint }}>
              Поиск…
            </div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: '12px 16px', fontSize: '14px', color: colors.textFaint }}>
              Ничего не найдено
            </div>
          ) : (
            suggestions.map((audio, index) => {
              const active = index === highlightIndex;
              return (
                <button
                  key={audio.id}
                  id={`audio-search-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  // mousedown fires before blur so selection is not lost
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(audio);
                  }}
                  onMouseEnter={() => setHighlightIndex(index)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: index < suggestions.length - 1 ? `1px solid ${colors.divider}` : 'none',
                    backgroundColor: active ? colors.primarySoft : 'transparent',
                    color: colors.text,
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: 'system-ui, sans-serif',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  {audio.filename || `Аудио ${audio.id}`}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default AudioSearchBar;
