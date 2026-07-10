import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { colors, radius, shadow } from '../../theme';

let modalStylesInjected = false;

function ensureModalStyles() {
  if (modalStylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-modal-styles', 'true');
  style.textContent = '@keyframes modalIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }';
  document.head.appendChild(style);
  modalStylesInjected = true;
}

// Lightweight modal via portal: avoids layout flicker and scrollbar jump.
function Modal({ open, onClose, children, maxWidth = '440px', maxHeight, closeOnBackdrop = true, animate = true }) {
  useEffect(() => {
    if (!open) return;
    ensureModalStyles();
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onMouseDown={(e) => { if (closeOnBackdrop && e.target === e.currentTarget && onClose) onClose(); }}
      style={{
        position: 'fixed', inset: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 10000,
        padding: maxHeight ? '8px' : '12px', boxSizing: 'border-box',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          backgroundColor: colors.surface,
          padding: maxHeight ? '16px 18px' : '28px',
          borderRadius: radius.lg,
          maxWidth,
          maxHeight: maxHeight || undefined,
          width: '100%',
          height: maxHeight ? '100%' : undefined,
          boxShadow: shadow.overlay,
          boxSizing: 'border-box',
          textAlign: 'left',
          fontFamily: 'system-ui, sans-serif',
          animation: animate ? 'modalIn 0.16s ease-out' : 'none',
          overflow: maxHeight ? 'hidden' : undefined,
          display: maxHeight ? 'flex' : undefined,
          flexDirection: maxHeight ? 'column' : undefined,
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
