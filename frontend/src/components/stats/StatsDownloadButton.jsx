import { useEffect, useRef, useState } from 'react';
import { colors, radius, shadow } from '../../theme';

const menuItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '2px',
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
};

function StatsDownloadButton({ onDownload, disabled = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const menuRef = useRef(null);
  const isDownloading = downloadingFormat !== null;

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const handleDownload = async (format) => {
    if (isDownloading || disabled) return;
    setMenuOpen(false);
    setDownloadingFormat(format);
    try {
      await onDownload(format);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => {
          if (isDownloading || disabled) return;
          setMenuOpen((open) => !open);
        }}
        disabled={disabled || isDownloading}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Скачать статистику"
        title="Скачать"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: colors.surface,
          color: colors.text,
          border: `1px solid ${colors.borderStrong}`,
          borderRadius: radius.sm,
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: disabled || isDownloading ? 'not-allowed' : 'pointer',
          boxShadow: shadow.sm,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M4 19h16" />
        </svg>
        {isDownloading ? 'Скачивание…' : 'Скачать'}
      </button>

      {menuOpen && !disabled && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 10060,
            minWidth: '220px',
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            boxShadow: shadow.lg,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px 14px 4px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: colors.textFaint }}>
            Формат
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDownload('csv')}
            style={menuItemStyle}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>.csv</span>
            <span style={{ fontSize: '12px', color: colors.textMuted }}>Таблица в CSV</span>
          </button>
          <div style={{ height: '1px', backgroundColor: colors.border }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDownload('xlsx')}
            style={menuItemStyle}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>.xlsx</span>
            <span style={{ fontSize: '12px', color: colors.textMuted }}>Таблица в Excel</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default StatsDownloadButton;
