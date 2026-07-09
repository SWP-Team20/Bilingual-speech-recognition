import Modal from './Modal';
import { colors, radius } from '../../theme';

// Single-button message dialog used in place of window.alert() for a
// consistent look with the rest of the app's modals.
function AlertModal({
  open,
  title,
  message,
  type = 'info',
  buttonLabel = 'ОК',
  onClose,
  embedded = false,
  animate = true,
}) {
  const accent = type === 'error' ? colors.danger : colors.primary;
  const accentHover = type === 'error' ? colors.dangerHover : colors.primaryHover;
  const titleColor = type === 'error' ? colors.danger : colors.textStrong;

  const content = (
    <>
      {title && (
        <h4 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0', color: titleColor }}>
          {title}
        </h4>
      )}
      {message && (
        <p style={{ fontSize: '15px', color: '#444', lineHeight: 1.5, margin: '0 0 20px 0' }}>
          {message}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accent)}
          style={{ backgroundColor: accent, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: radius.sm, fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
        >
          {buttonLabel}
        </button>
      </div>
    </>
  );

  if (embedded) {
    return open ? content : null;
  }

  return (
    <Modal open={open} onClose={onClose} animate={animate}>
      {content}
    </Modal>
  );
}

export default AlertModal;
