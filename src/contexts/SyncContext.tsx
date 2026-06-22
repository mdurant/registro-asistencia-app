import NetInfo from '@react-native-community/netinfo';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getApiBaseUrl, SYNC_INTERVAL_MS } from '@/constants/config';
import { useAuth } from '@/contexts/AuthContext';
import { isDatabaseAvailable } from '@/database/client';
import { syncQueueRepo } from '@/database/repositories';
import { runFullSync } from '@/services/sync';

interface SyncContextValue {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  apiBaseUrl: string;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isLoading, databaseAvailable, session } = useAuth();
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(getApiBaseUrl);

  const canSync = !isLoading && databaseAvailable && isDatabaseAvailable() && session != null;

  const refreshPending = useCallback(async () => {
    if (!canSync) {
      setPendingCount(0);
      setLastSyncError(null);
      return;
    }
    try {
      const pending = await syncQueueRepo.getPending();
      setPendingCount(pending.length);
      if (pending.length === 0) {
        setLastSyncError(null);
      }
    } catch {
      setPendingCount(0);
      setLastSyncError(null);
    }
  }, [canSync]);

  const syncNow = useCallback(async () => {
    if (!canSync || isSyncing) return;

    const pending = await syncQueueRepo.getPending();
    if (pending.length === 0) {
      setPendingCount(0);
      setLastSyncError(null);
      return;
    }

    setIsSyncing(true);
    setLastSyncError(null);

    const currentApiUrl = getApiBaseUrl();
    setApiBaseUrl(currentApiUrl);

    try {
      const result = await runFullSync();
      setLastSyncAt(new Date().toISOString());

      if (result.synced > 0) {
        setLastSyncError(null);
      } else if (result.lastError) {
        setLastSyncError(result.lastError);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de sincronización';
      setLastSyncError(message);
    } finally {
      await refreshPending();
      setIsSyncing(false);
    }
  }, [canSync, isSyncing, refreshPending]);

  useEffect(() => {
    if (!canSync) {
      setPendingCount(0);
      setLastSyncError(null);
      return;
    }

    setApiBaseUrl(getApiBaseUrl());
    void refreshPending();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setOnline(connected);
    });

    return () => unsubscribe();
  }, [canSync, refreshPending]);

  useEffect(() => {
    if (!canSync || !online || pendingCount === 0) return;

    const interval = setInterval(() => {
      void syncNow();
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [canSync, online, pendingCount, syncNow]);

  const value = useMemo(
    () => ({
      isOnline: online,
      pendingCount,
      isSyncing,
      lastSyncAt,
      lastSyncError,
      apiBaseUrl,
      syncNow,
    }),
    [online, pendingCount, isSyncing, lastSyncAt, lastSyncError, apiBaseUrl, syncNow],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync debe usarse dentro de SyncProvider');
  return ctx;
}
