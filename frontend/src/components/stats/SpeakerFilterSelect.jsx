import { useEffect, useRef, useState } from 'react';
import { speakersApi } from '../../api/speakersApi';
import { colors, radius, shadow } from '../../theme';

/**
 * Multi-select dropdown of existing corpus speakers for stats/audio filters.
 * Empty selection = no speaker filter (all speakers).
 *
 * value: string[] of speaker labels
 * onChange: (labels: string[]) => void
 */
function SpeakerFilterSelect({ value = [], onChange, style, disabled = false }) {
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await speakersApi.listSpeakers();
        if (!cancelled) setSpeakers(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setSpeakers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selected = Array.isArray(value) ? value : (value ? [value] : []);
  const selectedSet = new Set(selected);
  const knownLabels = new Set(speakers.map((s) => s.label).filter(Boolean));
  const orphanSelected = selected.filter((label) => label && !knownLabels.has(label));
  const options = [
    ...orphanSelected.map((label) => ({ id: `orphan-${label}`, label, audio_count: 0 })),
    ...speakers,
  ];

  const toggle = (label) => {
    if (disabled || loading) return;
    const next = selectedSet.has(label)
      ? selected.filter((item) => item !== label)
      : [...selected, label];
    onChange?.(next);
  };

  const clearAll = () => onChange?.([]);

  let summary = 'Все говорящие';
  if (loading) summary = 'Загрузка…';
  else if (selected.length === 1) summary = selected[0];
  else if (selected.length > 1) summary = `Выбрано: ${selected.length}`;

  const triggerStyle = {
    width: '100%',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '8px 10px',
    paddingRight: '30px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.borderStrong}`,
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: colors.surface,
    color: '#333',
    cursor: disabled || loading ? 'default' : 'pointer',
    textAlign: 'left',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    ...style,
  };

  return (
    <>
      <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
        <button
          type="button"
          disabled={disabled || loading}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Говорящие"
          onClick={() => { if (!disabled && !loading) setOpen((v) => !v); }}
          style={triggerStyle}
        >
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selected.length ? '#333' : colors.textMuted,
          }}>
            {summary}
          </span>
        </button>

        {open && (
          <div
            role="listbox"
            aria-multiselectable="true"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 10050,
              backgroundColor: '#fff',
              border: `1px solid ${colors.borderStrong}`,
              borderRadius: radius.md,
              boxShadow: shadow.lg,
              overflow: 'hidden',
            }}
          >
            {options.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: '13px', color: colors.textFaint }}>
                Нет говорящих в корпусе
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: `1px solid ${colors.divider}`,
                }}>
                  <span style={{ fontSize: '12px', color: colors.textFaint }}>
                    {selected.length ? `Выбрано: ${selected.length}` : 'Ничего не выбрано'}
                  </span>
                  {selected.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: colors.primary,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'inherit',
                      }}
                    >
                      Сбросить
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '6px 0' }}>
                  {options.map((s) => {
                    const checked = selectedSet.has(s.label);
                    return (
                      <label
                        key={s.id}
                        role="option"
                        aria-selected={checked}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          color: '#333',
                          lineHeight: 1.35,
                          backgroundColor: checked ? colors.primarySoft : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!checked) e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = checked ? colors.primarySoft : 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(s.label)}
                          style={{ width: '16px', height: '16px', flexShrink: 0, accentColor: colors.primary }}
                        />
                        <span>
                          {s.label}
                          {s.audio_count ? ` (${s.audio_count})` : ''}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div style={{ marginTop: '6px', fontSize: '12px', color: colors.textFaint, lineHeight: 1.4 }}>
        Можно выбрать несколько. Ничего не выбрано — все говорящие.
      </div>
    </>
  );
}

export default SpeakerFilterSelect;
