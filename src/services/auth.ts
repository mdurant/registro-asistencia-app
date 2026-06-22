import * as LocalAuthentication from 'expo-local-authentication';

import { SECURE_KEYS } from '@/constants/config';
import {
  deviceRepo,
  loginRepo,
  preferencesRepo,
  syncQueueRepo,
  userRepo,
} from '@/database/repositories';
import { queueLoginEmail } from '@/services/email';
import { getDeviceInfo, getOrCreateDeviceId } from '@/services/device';
import { captureTraceability } from '@/services/traceability';
import type { AuthSession, LinkedDevice, User } from '@/types';
import { generateId } from '@/utils/crypto';
import { parseJsonColumn } from '@/utils/json';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/utils/secureStorage';
import { cleanRut } from '@/utils/rut';

interface StoredSession {
  userRut: string;
  sessionId: string;
}

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Ingresar con huella o Face ID',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function loginWithCredentials(
  rut: string,
  last4: string,
): Promise<{ success: true; session: AuthSession } | { success: false; error: string }> {
  const user = await userRepo.validateCredentials(rut, last4);
  if (!user) {
    return { success: false, error: 'RUT o credenciales incorrectas' };
  }

  return completeLogin(user);
}

export async function loginWithBiometric(): Promise<
  { success: true; session: AuthSession } | { success: false; error: string }
> {
  const userRut = await getBiometricUserRut();
  if (!userRut) {
    return {
      success: false,
      error: 'No hay biometría registrada. Usa "Guardar huella" en el login (demo).',
    };
  }

  const prefs = await preferencesRepo.get(userRut);
  if (!prefs.biometricEnabled) {
    return { success: false, error: 'Biometría no habilitada para este usuario.' };
  }

  const authenticated = await authenticateWithBiometric();
  if (!authenticated) {
    return { success: false, error: 'Autenticación biométrica cancelada' };
  }

  const user = await userRepo.findByRut(userRut);
  if (!user) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  return completeLogin(user);
}

/** Demo: vincula huella/Face ID a un RUT sin pedir PIN. */
export async function enrollBiometricForUser(
  rut: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await userRepo.findByRut(rut);
  if (!user) {
    return { success: false, error: 'Usuario no encontrado. Verifica el RUT demo.' };
  }

  const authenticated = await authenticateWithBiometric();
  if (!authenticated) {
    return { success: false, error: 'Autenticación biométrica cancelada' };
  }

  await enableBiometric(user.rut);
  return { success: true };
}

export async function hasBiometricEnrollment(): Promise<boolean> {
  const userRut = await getBiometricUserRut();
  if (!userRut) return false;
  const prefs = await preferencesRepo.get(userRut);
  return prefs.biometricEnabled;
}

async function completeLogin(
  user: User,
): Promise<{ success: true; session: AuthSession } | { success: false; error: string }> {
  const sessionId = generateId();
  const deviceId = await getOrCreateDeviceId();
  const deviceInfo = await getDeviceInfo();
  const trace = await captureTraceability();
  const prefs = await preferencesRepo.get(user.rut);

  const activeDevice = await deviceRepo.getActiveDevice(user.rut);
  let deviceLinked = true;

  if (activeDevice && activeDevice.id !== deviceId) {
    deviceLinked = false;
    if (!prefs.deviceAlertSent) {
      await queueDeviceAlertEmail(user);
      await preferencesRepo.setDeviceAlertSent(user.rut, true);
    }
  } else if (!activeDevice) {
    const newDevice: LinkedDevice = {
      id: deviceId,
      userRut: cleanRut(user.rut),
      brand: deviceInfo.brand,
      model: deviceInfo.model,
      osName: deviceInfo.osName,
      osVersion: deviceInfo.osVersion,
      serial: deviceInfo.serial,
      imei: deviceInfo.imei,
      phoneNumber: deviceInfo.phoneNumber,
      isActive: true,
      linkedAt: new Date().toISOString(),
    };
    await deviceRepo.linkDevice(newDevice);
    await deviceRepo.auditLinkChange(user.rut, null, deviceId, 'initial_link', {
      device: deviceInfo,
    });
  }

  const loginId = generateId();
  await loginRepo.insert({
    id: loginId,
    userRut: user.rut,
    sessionId,
    recordedAtLocal: trace.recordedAtLocal,
    timezone: trace.timezone,
    latitude: trace.latitude,
    longitude: trace.longitude,
    locationAccuracyM: trace.locationAccuracyM,
    ipAddress: trace.ipAddress,
    deviceBrand: trace.deviceBrand,
    deviceModel: trace.deviceModel,
    deviceOs: trace.deviceOs,
    deviceSerial: trace.deviceSerial,
    syncStatus: 'pending',
  });

  await syncQueueRepo.enqueue(loginId, 'login', loginId, {
    ...trace,
    userRut: user.rut,
    sessionId,
  });

  await queueLoginEmail(user, trace);

  await setSecureItem(
    SECURE_KEYS.session,
    JSON.stringify({ userRut: user.rut, sessionId } satisfies StoredSession),
  );

  const session: AuthSession = {
    user,
    sessionId,
    deviceLinked,
    permissionsCompleted: prefs.permissionsCompleted,
    biometricEnabled: prefs.biometricEnabled,
  };

  return { success: true, session };
}

async function queueDeviceAlertEmail(user: User): Promise<void> {
  const { queueDeviceAlertEmail: queue } = await import('@/services/email');
  await queue(user);
}

export async function getStoredSession(): Promise<StoredSession | null> {
  const raw = await getSecureItem(SECURE_KEYS.session);
  if (!raw) return null;
  const parsed = parseJsonColumn(raw);
  if (!parsed || typeof parsed.userRut !== 'string' || typeof parsed.sessionId !== 'string') {
    return null;
  }
  return { userRut: parsed.userRut, sessionId: parsed.sessionId };
}

export async function restoreSession(): Promise<AuthSession | null> {
  const stored = await getStoredSession();
  if (!stored) return null;

  const user = await userRepo.findByRut(stored.userRut);
  if (!user) return null;

  const prefs = await preferencesRepo.get(user.rut);
  const deviceId = await getOrCreateDeviceId();
  const activeDevice = await deviceRepo.getActiveDevice(user.rut);
  const deviceLinked = !activeDevice || activeDevice.id === deviceId;

  return {
    user,
    sessionId: stored.sessionId,
    deviceLinked,
    permissionsCompleted: prefs.permissionsCompleted,
    biometricEnabled: prefs.biometricEnabled,
  };
}

export async function logout(): Promise<void> {
  try {
    await deleteSecureItem(SECURE_KEYS.session);
  } catch {
    // La clave puede no existir; la sesión en memoria se limpia igual
  }
}

export async function linkCurrentDevice(userRut: string): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  const deviceInfo = await getDeviceInfo();
  const oldDevice = await deviceRepo.getActiveDevice(userRut);

  const newDevice: LinkedDevice = {
    id: deviceId,
    userRut: cleanRut(userRut),
    brand: deviceInfo.brand,
    model: deviceInfo.model,
    osName: deviceInfo.osName,
    osVersion: deviceInfo.osVersion,
    serial: deviceInfo.serial,
    imei: deviceInfo.imei,
    phoneNumber: deviceInfo.phoneNumber,
    isActive: true,
    linkedAt: new Date().toISOString(),
  };

  await deviceRepo.linkDevice(newDevice);
  await deviceRepo.auditLinkChange(
    userRut,
    oldDevice?.id ?? null,
    deviceId,
    'device_replaced',
    { old: oldDevice, new: newDevice },
  );
  await preferencesRepo.setDeviceAlertSent(userRut, false);
}

export async function enableBiometric(userRut: string): Promise<void> {
  await preferencesRepo.setBiometric(userRut, true);
  await setBiometricUserRut(userRut);
}

export async function disableBiometric(userRut: string): Promise<void> {
  await preferencesRepo.setBiometric(userRut, false);
  await clearBiometricUserRut();
}

async function getBiometricUserRut(): Promise<string | null> {
  const raw = await getSecureItem(SECURE_KEYS.biometricUser);
  if (!raw) return null;
  return cleanRut(raw);
}

async function setBiometricUserRut(userRut: string): Promise<void> {
  await setSecureItem(SECURE_KEYS.biometricUser, cleanRut(userRut));
}

async function clearBiometricUserRut(): Promise<void> {
  try {
    await deleteSecureItem(SECURE_KEYS.biometricUser);
  } catch {
    // noop
  }
}

export async function markPermissionsCompleted(userRut: string): Promise<void> {
  await preferencesRepo.setPermissionsCompleted(userRut, true);
}
