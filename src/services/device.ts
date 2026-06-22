import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { SECURE_KEYS } from '@/constants/config';
import type { DeviceInfo } from '@/types';
import { generateId } from '@/utils/crypto';
import { getSecureItem, setSecureItem } from '@/utils/secureStorage';

export async function getDeviceInfo(): Promise<DeviceInfo> {
  return {
    brand: Device.brand ?? 'Desconocida',
    model: Device.modelName ?? 'Desconocido',
    osName: `${Device.osName ?? Platform.OS} ${Device.osVersion ?? ''}`.trim(),
    osVersion: Device.osVersion ?? undefined,
    serial: Device.osBuildId ?? undefined,
    imei: undefined,
    phoneNumber: undefined,
  };
}

export async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await getSecureItem(SECURE_KEYS.deviceId);
  if (!deviceId) {
    deviceId = generateId();
    await setSecureItem(SECURE_KEYS.deviceId, deviceId);
  }
  return deviceId;
}

export function formatDeviceLabel(info: DeviceInfo): string {
  return `${info.brand} ${info.model} (${info.osName})`;
}
