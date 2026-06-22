export type UserRole = 'colaborador' | 'supervisor' | 'admin';

export type EventType = 'INGRESO' | 'SALIDA';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface User {
  rut: string;
  name: string;
  email: string;
  passwordLast4: string;
  role: UserRole;
}

export interface Supermarket {
  id: string;
  name: string;
  commune: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusM: number;
}

export interface LinkedDevice {
  id: string;
  userRut: string;
  phoneNumber?: string;
  serial?: string;
  imei?: string;
  brand: string;
  model: string;
  osName: string;
  osVersion?: string;
  isActive: boolean;
  linkedAt: string;
}

export interface DeviceInfo {
  brand: string;
  model: string;
  osName: string;
  osVersion?: string;
  serial?: string;
  imei?: string;
  phoneNumber?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface TraceabilityPayload {
  recordedAtLocal: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  locationAccuracyM?: number;
  ipAddress?: string;
  deviceBrand: string;
  deviceModel: string;
  deviceOs: string;
  deviceSerial?: string;
}

export interface AttendanceEvent {
  id: string;
  userRut: string;
  supermarketId: string;
  eventType: EventType;
  recordedAtLocal: string;
  timezone: string;
  latitude: number;
  longitude: number;
  locationAccuracyM?: number;
  ipAddress?: string;
  deviceBrand: string;
  deviceModel: string;
  deviceOs: string;
  deviceSerial?: string;
  photoUri?: string;
  syncStatus: SyncStatus;
  syncedAt?: string;
  serverId?: string;
  integrityHash?: string;
  createdAt: string;
}

export interface LoginEvent {
  id: string;
  userRut: string;
  sessionId: string;
  recordedAtLocal: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  locationAccuracyM?: number;
  ipAddress?: string;
  deviceBrand: string;
  deviceModel: string;
  deviceOs: string;
  deviceSerial?: string;
  syncStatus: SyncStatus;
}

export interface UserPreferences {
  userRut: string;
  biometricEnabled: boolean;
  permissionsCompleted: boolean;
  deviceAlertSent: boolean;
}

export interface AuthSession {
  user: User;
  sessionId: string;
  deviceLinked: boolean;
  permissionsCompleted: boolean;
  biometricEnabled: boolean;
}

export interface OpenVisit {
  supermarketId: string;
  supermarketName: string;
  ingresoAt: string;
}
