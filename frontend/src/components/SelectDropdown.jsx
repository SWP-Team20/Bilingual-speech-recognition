import { useEffect, useRef, useState } from 'react';
import { colors, radius } from '../theme';

const CHEVRON_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

export function selectTriggerStyle(overrides = {}) {
  return {
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
    color: colors.text,
    cursor: 'pointer',
    textAlign: 'left',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: CHEVRON_SVG,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    ...overrides,
  };
}

/**
 * Single-select dropdown with a list aligned to the trigger width
 * (avoids native <select> popup misalignment on Windows).
 */
function SelectDropdown({
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder,
  style,
  triggerStyle,
  ariaLabel,
  listZIndex = 10050,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

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

  const selected = options.find((o) => o.value === value);
  const summary = selected?.label ?? placeholder ?? '';
  const hasValue = selected != null;

  const pick = (nextValue) => {
    if (disabled) return;
    onChange?.(nextValue);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', ...style }}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        style={{
          ...selectTriggerStyle({
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.65 : 1,
            ...triggerStyle,
          }),
        }}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: hasValue ? colors.text : colors.textMuted,
        }}
        >
          {summary}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: listZIndex,
            marginTop: 0,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.borderStrong}`,
            borderTop: 'none',
            overflow: 'hidden',
          }}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value === '' ? '__empty__' : option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(option.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  margin: 0,
                  padding: '8px 10px',
                  border: 'none',
                  backgroundColor: active ? '#666666' : colors.surface,
                  color: active ? '#ffffff' : colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  cursor: 'pointer',
                  lineHeight: 1.35,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#666666';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = active ? '#666666' : colors.surface;
                  e.currentTarget.style.color = active ? '#ffffff' : colors.text;
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SelectDropdown;
