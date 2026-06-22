import { COMMUNE_BOUNDS, type CommuneBounds } from '@/constants/communes';

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinGeofence(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusM: number,
): boolean {
  return distanceMeters(userLat, userLon, targetLat, targetLon) <= radiusM;
}

export function isWithinCommuneBounds(
  lat: number,
  lon: number,
  bounds: CommuneBounds,
): boolean {
  return lat <= bounds.north && lat >= bounds.south && lon >= bounds.west && lon <= bounds.east;
}

export function isWithinCommune(lat: number, lon: number, commune: string): boolean {
  const bounds = COMMUNE_BOUNDS[commune];
  if (!bounds) return false;
  return isWithinCommuneBounds(lat, lon, bounds);
}

export function formatDistanceM(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDurationMs(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes}m`;
}
