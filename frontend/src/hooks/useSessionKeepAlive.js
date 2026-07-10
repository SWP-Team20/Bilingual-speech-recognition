import { useEffect } from 'react';
import { startSessionKeepAlive } from '../api/authSession';

export function useSessionKeepAlive(isAuthenticated) {
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    return startSessionKeepAlive();
  }, [isAuthenticated]);
}
