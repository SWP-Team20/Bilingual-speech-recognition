import { useEffect } from 'react';
import { colors, radius, shadow } from '../../theme';

// Lightweight, accessible-ish modal: closes on Escape and backdrop click.
function Modal({ open, onClose, children, maxWidth = '440px', closeOnBackdrop = true, animate = true }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => { if (closeOnBackdrop && e.target === e.currentTarget && onClose) onClose(); }}
      style={{
        position: 'fixed', inset: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 10000,
        padding: '20px', boxSizing: 'border-box',
      }}
    >
      <style>{`@keyframes modalIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          backgroundColor: colors.surface,
          padding: '28px',
          borderRadius: radius.lg,
          maxWidth,
          width: '100%',
          boxShadow: shadow.overlay,
          boxSizing: 'border-box',
          textAlign: 'left',
          fontFamily: 'system-ui, sans-serif',
          animation: animate ? 'modalIn 0.16s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
