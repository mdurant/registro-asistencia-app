import * as Location from 'expo-location';
import * as Network from 'expo-network';

import type { GeoLocation, TraceabilityPayload } from '@/types';
import { getDeviceInfo } from '@/services/device';
import { hashPayload } from '@/utils/crypto';

export function getLocalTimestamp(): { iso: string; timezone: string } {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return { iso: now.toISOString(), timezone };
}

export async function getCurrentLocation(): Promise<GeoLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function getPublicIp(): Promise<string | undefined> {
  try {
    const ip = await Network.getIpAddressAsync();
    return ip ?? undefined;
  } catch {
    return undefined;
  }
}

export async function captureTraceability(): Promise<TraceabilityPayload & { integrityHash: string }> {
  const { iso, timezone } = getLocalTimestamp();
  const [location, device, ip] = await Promise.all([
    getCurrentLocation(),
    getDeviceInfo(),
    getPublicIp(),
  ]);

  const payload: TraceabilityPayload = {
    recordedAtLocal: iso,
    timezone,
    latitude: location?.latitude,
    longitude: location?.longitude,
    locationAccuracyM: location?.accuracy,
    ipAddress: ip,
    deviceBrand: device.brand,
    deviceModel: device.model,
    deviceOs: device.osName,
    deviceSerial: device.serial,
  };

  const integrityHash = await hashPayload(payload as unknown as Record<string, unknown>);
  return { ...payload, integrityHash };
}
