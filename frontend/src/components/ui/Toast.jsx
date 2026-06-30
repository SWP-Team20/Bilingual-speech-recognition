import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { colors, radius, shadow } from '../../theme';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const api = {
    show,
    success: (m, d) => show(m, 'success', d),
    error: (m, d) => show(m, 'error', d),
    info: (m, d) => show(m, 'info', d),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 11000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: 'min(380px, calc(100vw - 40px))',
        }}
      >
        <style>{`
          @keyframes toastIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>
        {toasts.map((t) => {
          const accent =
            t.type === 'success' ? colors.primary
            : t.type === 'error' ? colors.danger
            : colors.dark;
          return (
            <div
              key={t.id}
              role="status"
              onClick={() => dismiss(t.id)}
              style={{
                backgroundColor: colors.surface,
                color: colors.textStrong,
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid ${accent}`,
                borderRadius: radius.md,
                boxShadow: shadow.lg,
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'system-ui, sans-serif',
                cursor: 'pointer',
                animation: 'toastIn 0.18s ease-out',
              }}
            >
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback so components don't crash if used outside a provider.
    return {
      show: () => {}, success: () => {}, error: () => {}, info: () => {}, dismiss: () => {},
    };
  }
  return ctx;
}
