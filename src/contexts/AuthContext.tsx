import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { initDatabase, isDatabaseAvailable } from '@/database/client';
import {
  enableBiometric,
  enrollBiometricForUser,
  hasBiometricEnrollment,
  linkCurrentDevice,
  loginWithBiometric,
  loginWithCredentials,
  logout as authLogout,
  markPermissionsCompleted,
  restoreSession,
  isBiometricAvailable,
} from '@/services/auth';
import type { AuthSession } from '@/types';

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  databaseAvailable: boolean;
  biometricAvailable: boolean;
  biometricEnrolled: boolean;
  login: (rut: string, last4: string) => Promise<string | null>;
  loginBiometric: () => Promise<string | null>;
  enrollBiometricDemo: (rut: string) => Promise<string | null>;
  logout: () => Promise<void>;
  completePermissions: () => Promise<void>;
  setupBiometric: () => Promise<void>;
  linkDevice: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshBiometricEnrollment: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [databaseAvailable, setDatabaseAvailable] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);

  const refreshBiometricEnrollment = useCallback(async () => {
    if (!isDatabaseAvailable()) {
      setBiometricEnrolled(false);
      return;
    }
    setBiometricEnrolled(await hasBiometricEnrollment());
  }, []);

  useEffect(() => {
    async function boot() {
      await initDatabase();
      setDatabaseAvailable(isDatabaseAvailable());
      if (isDatabaseAvailable()) {
        const restored = await restoreSession();
        setSession(restored);
        setBiometricEnrolled(await hasBiometricEnrollment());
      }
      setBiometricAvailable(await isBiometricAvailable());
      setIsLoading(false);
    }
    boot();
  }, []);

  const login = useCallback(async (rut: string, last4: string) => {
    const result = await loginWithCredentials(rut, last4);
    if (!result.success) return result.error;
    setSession(result.session);
    return null;
  }, []);

  const loginBiometric = useCallback(async () => {
    const result = await loginWithBiometric();
    if (!result.success) return result.error;
    setSession(result.session);
    return null;
  }, []);

  const enrollBiometricDemo = useCallback(
    async (rut: string) => {
      const result = await enrollBiometricForUser(rut);
      if (!result.success) return result.error;
      await refreshBiometricEnrollment();
      return null;
    },
    [refreshBiometricEnrollment],
  );

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } catch (error) {
      console.warn('[auth] error al cerrar sesión:', error);
    } finally {
      setSession(null);
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/login');
    }
  }, []);

  const completePermissions = useCallback(async () => {
    if (!session) return;
    await markPermissionsCompleted(session.user.rut);
    setSession({ ...session, permissionsCompleted: true });
  }, [session]);

  const setupBiometric = useCallback(async () => {
    if (!session) return;
    await enableBiometric(session.user.rut);
    setSession({ ...session, biometricEnabled: true });
    await refreshBiometricEnrollment();
  }, [session, refreshBiometricEnrollment]);

  const linkDevice = useCallback(async () => {
    if (!session) return;
    await linkCurrentDevice(session.user.rut);
    setSession({ ...session, deviceLinked: true });
  }, [session]);

  const refreshSession = useCallback(async () => {
    const restored = await restoreSession();
    setSession(restored);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      databaseAvailable,
      biometricAvailable,
      biometricEnrolled,
      login,
      loginBiometric,
      enrollBiometricDemo,
      logout,
      completePermissions,
      setupBiometric,
      linkDevice,
      refreshSession,
      refreshBiometricEnrollment,
    }),
    [
      session,
      isLoading,
      databaseAvailable,
      biometricAvailable,
      biometricEnrolled,
      login,
      loginBiometric,
      enrollBiometricDemo,
      logout,
      completePermissions,
      setupBiometric,
      linkDevice,
      refreshSession,
      refreshBiometricEnrollment,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
