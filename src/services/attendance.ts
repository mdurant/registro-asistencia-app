import { Camera } from 'expo-camera';
import * as Location from 'expo-location';

import { attendanceRepo, supermarketRepo, syncQueueRepo } from '@/database/repositories';
import {
  DEMO_SUPERVISOR_EMAIL,
  EXPECTED_WORK_START_HOUR,
  EXPECTED_WORK_START_MINUTE,
} from '@/constants/config';
import {
  getIngresoLateness,
  queueIngresoEmail,
  queueAtrasoEmail,
  queueSalidaEmail,
} from '@/services/email';
import { captureTraceability } from '@/services/traceability';
import type { AttendanceEvent, EventType, Supermarket, User } from '@/types';
import {
  distanceMeters,
  isWithinCommune,
  isWithinGeofence,
} from '@/utils/geo';
import { generateId } from '@/utils/crypto';

export type AttendanceError =
  | 'NO_LOCATION'
  | 'NO_CAMERA'
  | 'GEOFENCE'
  | 'OPEN_VISIT_OTHER'
  | 'NO_OPEN_VISIT'
  | 'DEVICE_NOT_LINKED';

export async function checkPermissions(): Promise<{
  camera: boolean;
  location: boolean;
}> {
  const cam = await Camera.getCameraPermissionsAsync();
  const loc = await Location.getForegroundPermissionsAsync();
  return {
    camera: cam.status === 'granted',
    location: loc.status === 'granted',
  };
}

export async function requestAllPermissions(): Promise<{
  camera: boolean;
  location: boolean;
}> {
  const cam = await Camera.requestCameraPermissionsAsync();
  const loc = await Location.requestForegroundPermissionsAsync();
  return {
    camera: cam.status === 'granted',
    location: loc.status === 'granted',
  };
}

export interface LocationValidation {
  valid: boolean;
  inStore: boolean;
  inCommune: boolean;
  distanceM: number;
}

export function validateLocation(
  userLat: number,
  userLon: number,
  supermarket: Supermarket,
): LocationValidation {
  const distanceM = Math.round(
    distanceMeters(userLat, userLon, supermarket.latitude, supermarket.longitude),
  );
  const inStore = isWithinGeofence(
    userLat,
    userLon,
    supermarket.latitude,
    supermarket.longitude,
    supermarket.geofenceRadiusM,
  );
  const inCommune = isWithinCommune(userLat, userLon, supermarket.commune);

  return {
    valid: inStore || inCommune,
    inStore,
    inCommune,
    distanceM,
  };
}

/** @deprecated Usar validateLocation */
export function validateGeofence(
  userLat: number,
  userLon: number,
  supermarket: Supermarket,
): boolean {
  return validateLocation(userLat, userLon, supermarket).valid;
}

export function formatLocationError(supermarket: Supermarket, validation: LocationValidation): string {
  return `Estás a ${validation.distanceM} m del local y fuera de la comuna ${supermarket.commune}. Debes estar en ${supermarket.commune} para registrar.`;
}

export async function registerAttendance(
  user: User,
  supermarketId: string,
  eventType: EventType,
  photoUri?: string,
  skipGeofence = false,
): Promise<{ success: true; event: AttendanceEvent } | { success: false; error: AttendanceError }> {
  const perms = await checkPermissions();
  if (!perms.camera || !perms.location) {
    return { success: false, error: perms.location ? 'NO_CAMERA' : 'NO_LOCATION' };
  }

  const supermarket = await supermarketRepo.findById(supermarketId);
  if (!supermarket) {
    return { success: false, error: 'NO_OPEN_VISIT' };
  }

  const openVisit = await attendanceRepo.getOpenVisit(user.rut);

  if (eventType === 'INGRESO') {
    if (openVisit && openVisit.supermarketId !== supermarketId) {
      return { success: false, error: 'OPEN_VISIT_OTHER' };
    }
    if (openVisit?.supermarketId === supermarketId) {
      return { success: false, error: 'NO_OPEN_VISIT' };
    }
  } else {
    if (!openVisit || openVisit.supermarketId !== supermarketId) {
      return { success: false, error: 'NO_OPEN_VISIT' };
    }
  }

  const trace = await captureTraceability();

  if (!trace.latitude || !trace.longitude) {
    return { success: false, error: 'NO_LOCATION' };
  }

  if (
    !skipGeofence &&
    !validateLocation(trace.latitude, trace.longitude, supermarket).valid
  ) {
    return { success: false, error: 'GEOFENCE' };
  }

  const event: AttendanceEvent = {
    id: generateId(),
    userRut: user.rut,
    supermarketId,
    eventType,
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
    photoUri,
    syncStatus: 'pending',
    integrityHash: trace.integrityHash,
    createdAt: new Date().toISOString(),
  };

  await attendanceRepo.insert(event);

  await syncQueueRepo.enqueue(event.id, 'attendance', event.id, {
    ...trace,
    userRut: user.rut,
    supermarketId,
    eventType,
    photoUri,
  });

  if (eventType === 'INGRESO') {
    await queueIngresoEmail(user, supermarket, trace);

    const lateness = getIngresoLateness(
      trace.recordedAtLocal,
      trace.timezone,
      EXPECTED_WORK_START_HOUR,
      EXPECTED_WORK_START_MINUTE,
    );
    if (lateness.isLate) {
      await queueAtrasoEmail(
        user,
        supermarket,
        trace,
        lateness.minutesLate,
        lateness.expectedLabel,
        DEMO_SUPERVISOR_EMAIL,
      );
    }
  } else if (openVisit) {
    await queueSalidaEmail(user, supermarket, openVisit.ingresoAt, trace);
  }

  return { success: true, event };
}
