import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth, checkMlHealth } from '../services/api';

export function useHealthCheck() {
  const [backendStatus, setBackendStatus] = useState({ state: 'checking', data: null, error: null });
  const [mlStatus, setMlStatus] = useState({ state: 'checking', data: null, error: null });

  const refresh = useCallback(async () => {
    // Backend health
    try {
      setBackendStatus(prev => ({ ...prev, state: 'checking' }));
      const backendData = await checkBackendHealth();
      setBackendStatus({ state: 'online', data: backendData, error: null });
    } catch (err) {
      setBackendStatus({ state: 'offline', data: null, error: err.message });
    }

    // ML service health
    try {
      setMlStatus(prev => ({ ...prev, state: 'checking' }));
      const mlData = await checkMlHealth();
      setMlStatus({ state: 'online', data: mlData, error: null });
    } catch (err) {
      setMlStatus({ state: 'offline', data: null, error: err.message });
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { backendStatus, mlStatus, refresh };
}
