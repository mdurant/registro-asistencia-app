import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

export const APP_NAME = 'Mi Asistencia';

const LEGACY_BLOCKED_HOSTS = new Set([
  'api.mi-asistencia.local',
  'api.mi.asistencia.local',
  'localhost',
  '127.0.0.1',
]);

/** Extrae la IP/host del bundler Metro (misma máquina que sirve la app en dev). */
function getMetroHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && !LEGACY_BLOCKED_HOSTS.has(host)) return host;
  }

  const expoGo = Constants.expoGoConfig as { debuggerHost?: string } | null;
  if (expoGo?.debuggerHost) {
    const host = expoGo.debuggerHost.split(':')[0];
    if (host && !LEGACY_BLOCKED_HOSTS.has(host)) return host;
  }

  const scriptURL: string | undefined = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    const host = match?.[1];
    if (host && !LEGACY_BLOCKED_HOSTS.has(host)) return host;
  }

  return null;
}

function isUsableApiUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    if (hostname.endsWith('.local')) return false;
    if (LEGACY_BLOCKED_HOSTS.has(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

function getApiPort(): string {
  return process.env.EXPO_PUBLIC_API_PORT?.trim() || '3001';
}

function resolveDevApiUrl(): string {
  const port = getApiPort();
  const metroHost = getMetroHost();
  if (metroHost) {
    return `http://${metroHost}:${port}`;
  }
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }
  return `http://localhost:${port}`;
}

/** Resuelve la URL del API en cada llamada (no al cargar el módulo). */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv && isUsableApiUrl(fromEnv)) return fromEnv;

  return resolveDevApiUrl();
}

/** @deprecated Usar getApiBaseUrl() */
export const API_BASE_URL = getApiBaseUrl();

export const DEFAULT_GEOFENCE_RADIUS_M = 200;

export const SYNC_RETRY_MAX = 5;
export const SYNC_INTERVAL_MS = 30_000;

/** Hora esperada de ingreso (demo) — atraso si ingresa después. */
export const EXPECTED_WORK_START_HOUR = 9;
export const EXPECTED_WORK_START_MINUTE = 0;

export const DEMO_SUPERVISOR_EMAIL = 'carlos.supervisor@empresa.cl';

export const SECURE_KEYS = {
  session: 'mi_asistencia_session',
  deviceId: 'mi_asistencia_device_id',
  biometricUser: 'mi_asistencia_biometric_user',
} as const;
