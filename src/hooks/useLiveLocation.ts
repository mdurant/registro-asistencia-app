import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { GeoLocation } from '@/types';

export function useLiveLocation(enabled = true) {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== 'granted') {
        setError('Activa el permiso de ubicación para registrar asistencia.');
        setLoading(false);
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (!cancelled) {
          setLocation({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            accuracy: current.coords.accuracy ?? undefined,
          });
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('No se pudo obtener tu ubicación. Revisa que el GPS esté activo.');
          setLoading(false);
        }
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 8,
          timeInterval: 4000,
        },
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? undefined,
          });
          setError(null);
          setLoading(false);
        },
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  return { location, error, loading };
}
