import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface ConnectivityState {
  isOnline: boolean;
  isChecking: boolean;
}

const ConnectivityContext = createContext<ConnectivityState | undefined>(undefined);

const HEALTH_ENDPOINT = '/api/health';
const RECHECK_INTERVAL_MS = 15000;

async function checkServerReachable(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_ENDPOINT, {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateOnline = useCallback((online: boolean) => {
    setIsOnline(online);
  }, []);

  // Initial connectivity check
  useEffect(() => {
    let cancelled = false;

    async function initialCheck() {
      setIsChecking(true);
      const reachable = await checkServerReachable();
      if (!cancelled) {
        setIsOnline(reachable);
        setIsChecking(false);
      }
    }

    initialCheck();

    return () => {
      cancelled = true;
    };
  }, []);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOffline = () => updateOnline(false);

    const handleOnline = async () => {
      const reachable = await checkServerReachable();
      if (reachable) updateOnline(true);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [updateOnline]);

  // Periodic recheck when offline
  useEffect(() => {
    if (isOnline || isChecking) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(async () => {
      const reachable = await checkServerReachable();
      if (reachable) {
        updateOnline(true);
      }
    }, RECHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnline, isChecking, updateOnline]);

  return (
    <ConnectivityContext.Provider value={{ isOnline, isChecking }}>
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = (): ConnectivityState => {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error('useConnectivity must be used within a ConnectivityProvider');
  }
  return context;
};
