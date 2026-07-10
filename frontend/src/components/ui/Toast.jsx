import { useState, useCallback, useRef, useEffect } from 'react';
import { colors, radius, shadow } from '../../theme';
import { ToastContext } from './toastContext';

let idCounter = 0;

function UndoToastBody({ message, actionLabel, secondsLeft, onAction, onDismiss }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
      <span style={{ flex: 1 }}>
        {message}
        {secondsLeft > 0 && (
          <span style={{ color: colors.textMuted, marginLeft: '6px' }}>
            ({secondsLeft} с)
          </span>
        )}
      </span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAction();
            onDismiss();
          }}
          style={{
            flexShrink: 0,
            border: `1px solid ${colors.primary}`,
            background: colors.surface,
            color: colors.primary,
            borderRadius: radius.sm,
            padding: '4px 10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

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

  const show = useCallback((message, type = 'info', duration = 4000, options = {}) => {
    const id = ++idCounter;
    const toast = {
      id,
      message,
      type,
      actionLabel: options.actionLabel,
      onAction: options.onAction,
      countdownSeconds: options.countdownSeconds,
    };
    setToasts((prev) => [...prev, toast]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const api = {
    show,
    success: (m, d, opts) => show(m, 'success', d ?? 4000, opts),
    error: (m, d, opts) => show(m, 'error', d ?? 4000, opts),
    info: (m, d, opts) => show(m, 'info', d ?? 4000, opts),
    dismiss,
    undo: (message, { onUndo, seconds = 30, actionLabel = 'Отменить' } = {}) => {
      const duration = seconds * 1000;
      const id = ++idCounter;
      const toast = {
        id,
        message,
        type: 'info',
        actionLabel,
        onAction: onUndo,
        countdownSeconds: seconds,
        countdownStartedAt: Date.now(),
      };
      setToasts((prev) => [...prev, toast]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
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
          maxWidth: 'min(420px, calc(100vw - 40px))',
        }}
      >
        <style>{`
          @keyframes toastIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [secondsLeft, setSecondsLeft] = useState(toast.countdownSeconds ?? 0);

  useEffect(() => {
    if (!toast.countdownSeconds) return undefined;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - toast.countdownStartedAt) / 1000);
      setSecondsLeft(Math.max(0, toast.countdownSeconds - elapsed));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [toast.countdownSeconds, toast.countdownStartedAt]);

  const accent =
    toast.type === 'success' ? colors.primary
    : toast.type === 'error' ? colors.danger
    : colors.dark;

  const content = toast.actionLabel && toast.onAction ? (
    <UndoToastBody
      message={toast.message}
      actionLabel={toast.actionLabel}
      secondsLeft={secondsLeft}
      onAction={toast.onAction}
      onDismiss={onDismiss}
    />
  ) : toast.message;

  return (
    <div
      role="status"
      onClick={toast.actionLabel ? undefined : onDismiss}
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
        cursor: toast.actionLabel ? 'default' : 'pointer',
        animation: 'toastIn 0.18s ease-out',
      }}
    >
      {content}
    </div>
  );
}
