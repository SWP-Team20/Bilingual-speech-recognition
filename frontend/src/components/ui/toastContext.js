import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback so components don't crash if used outside a provider.
    return {
      show: () => {}, success: () => {}, error: () => {}, info: () => {}, dismiss: () => {}, undo: () => {},
    };
  }
  return ctx;
}
