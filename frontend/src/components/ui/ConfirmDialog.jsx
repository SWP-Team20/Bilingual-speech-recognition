import { useState } from 'react';
import Modal from './Modal';
import { colors, radius } from '../../theme';

// Confirmation dialog. `danger` styles the confirm button red.
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = false,
  requireInput = false,
  inputLabel,
  inputType = 'text',
  inputPlaceholder = '',
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState('');
  const accent = danger ? colors.danger : colors.primary;
  const accentHover = danger ? colors.dangerHover : colors.primaryHover;

  const handleConfirm = () => {
    onConfirm?.(requireInput ? value : undefined);
    setValue('');
  };

  const handleCancel = () => {
    onCancel?.();
    setValue('');
  };

  return (
    <Modal open={open} onClose={handleCancel}>
      {title && (
        <h4 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0', color: danger ? colors.danger : colors.textStrong }}>
          {title}
        </h4>
      )}
      {message && (
        <p style={{ fontSize: '15px', color: '#444', lineHeight: 1.5, margin: '0 0 20px 0' }}>
          {message}
        </p>
      )}

      {requireInput && (
        <div style={{ marginBottom: '20px' }}>
          {inputLabel && (
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>{inputLabel}</label>
          )}
          <input
            type={inputType}
            value={value}
            placeholder={inputPlaceholder}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
            onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderStrong; e.currentTarget.style.boxShadow = 'none'; }}
            style={{ width: '100%', padding: '10px', borderRadius: radius.sm, border: `1px solid ${colors.borderStrong}`, boxSizing: 'border-box', outline: 'none', fontSize: '14px', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleCancel}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ececec')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.page)}
          style={{ backgroundColor: colors.page, color: '#333', border: `1px solid ${colors.borderStrong}`, padding: '10px 18px', borderRadius: radius.sm, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s ease' }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={requireInput && !value}
          onMouseEnter={(e) => { if (!(requireInput && !value)) e.currentTarget.style.backgroundColor = accentHover; }}
          onMouseLeave={(e) => { if (!(requireInput && !value)) e.currentTarget.style.backgroundColor = accent; }}
          style={{ backgroundColor: accent, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: radius.sm, fontWeight: 'bold', cursor: requireInput && !value ? 'not-allowed' : 'pointer', opacity: requireInput && !value ? 0.5 : 1, transition: 'background-color 0.15s ease' }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
