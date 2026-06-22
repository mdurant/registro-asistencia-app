import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocationStatusCard } from '@/components/attendance/LocationStatusCard';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import { isDatabaseAvailable } from '@/database/client';
import { supermarketRepo } from '@/database/repositories';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import {
  formatLocationError,
  registerAttendance,
  validateLocation,
  type AttendanceError,
} from '@/services/attendance';
import { Palette, Spacing } from '@/constants/theme';
import type { EventType, Supermarket } from '@/types';

const ERROR_MESSAGES: Record<Exclude<AttendanceError, 'GEOFENCE'>, string> = {
  NO_LOCATION: 'No se pudo obtener la ubicación. Activa el GPS.',
  NO_CAMERA: 'Se requiere acceso a la cámara.',
  OPEN_VISIT_OTHER: 'Tienes una visita abierta en otro supermercado. Registra la salida primero.',
  NO_OPEN_VISIT: 'No hay un ingreso abierto para registrar salida.',
  DEVICE_NOT_LINKED: 'Dispositivo no vinculado.',
};

export default function CaptureScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { syncNow } = useSync();
  const { supermarketId, eventType } = useLocalSearchParams<{
    supermarketId: string;
    eventType: EventType;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [supermarket, setSupermarket] = useState<Supermarket | null>(null);
  const [loadingSupermarket, setLoadingSupermarket] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const { location, error: locationError, loading: locationLoading } = useLiveLocation(
    Boolean(session && supermarket),
  );

  const isIngreso = eventType === 'INGRESO';
  const isSupervisor =
    session?.user.role === 'supervisor' || session?.user.role === 'admin';

  const locationValidation = useMemo(() => {
    if (!supermarket || !location) return null;
    return validateLocation(location.latitude, location.longitude, supermarket);
  }, [supermarket, location]);

  const canRegister = Boolean(locationValidation?.valid && !locationError);

  useEffect(() => {
    if (!session || !supermarketId || !isDatabaseAvailable()) {
      setLoadingSupermarket(false);
      return;
    }
    void (async () => {
      const sm = await supermarketRepo.findById(supermarketId);
      setSupermarket(sm);
      setLoadingSupermarket(false);
    })();
  }, [session, supermarketId]);

  useEffect(() => {
    if (!loadingSupermarket && (!session || !supermarket)) {
      router.back();
    }
  }, [session, supermarket, loadingSupermarket, router]);

  if (!session || loadingSupermarket) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Palette.primaryLight} />
      </SafeAreaView>
    );
  }

  if (!supermarket) {
    return null;
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Permiso de cámara</Text>
        <Button title="Conceder cámara" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  async function handleCapture(skipGeofence = false) {
    if (!session || !supermarket) return;
    setLoading(true);
    setError(null);

    let photoUri: string | undefined;
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      photoUri = photo?.uri;
    } catch {
      // Foto opcional si la cámara falla momentáneamente
    }

    const result = await registerAttendance(
      session.user,
      supermarket.id,
      eventType as EventType,
      photoUri,
      skipGeofence,
    );

    setLoading(false);

    if (!result.success) {
      if (result.error === 'GEOFENCE' && locationValidation) {
        setError(formatLocationError(supermarket, locationValidation));
      } else if (result.error !== 'GEOFENCE') {
        setError(ERROR_MESSAGES[result.error]);
      } else {
        setError(`Debes estar en la comuna ${supermarket.commune} para registrar.`);
      }
      return;
    }

    setSuccess(true);
    void syncNow();
    setTimeout(() => router.back(), 1500);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isIngreso ? 'Registrar Ingreso' : 'Registrar Salida'}
        </Text>
        <Text style={styles.subtitle}>{supermarket.name}</Text>
        <Text style={styles.commune}>{supermarket.commune} · {supermarket.address}</Text>
      </View>

      <LocationStatusCard
        commune={supermarket.commune}
        address={supermarket.address}
        loading={locationLoading}
        locationError={locationError}
        validation={locationValidation}
        accuracyM={location?.accuracy}
      />

      {error ? (
        <AlertBanner title="No se pudo registrar" message={error} variant="error" />
      ) : null}
      {success ? (
        <AlertBanner
          title="¡Registro exitoso!"
          message="Guardado en el dispositivo. Se sincronizará con el servidor en segundo plano."
          variant="success"
        />
      ) : null}

      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front" />
      </View>

      <Text style={styles.hint}>
        Puedes registrar estando en el local o en cualquier punto de la comuna {supermarket.commune}.
      </Text>

      <Button
        title={isIngreso ? 'Confirmar Ingreso' : 'Confirmar Salida'}
        onPress={() => handleCapture(false)}
        loading={loading}
        disabled={!canRegister || loading}
      />

      {error && isSupervisor ? (
        <Button
          title="Registrar igual (modo supervisión)"
          onPress={() => handleCapture(true)}
          variant="outline"
        />
      ) : null}

      <Button title="Cancelar" onPress={() => router.back()} variant="outline" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: Spacing.md, gap: Spacing.md },
  header: { gap: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 15, color: Palette.primaryLight },
  commune: { fontSize: 13, color: '#aaa' },
  cameraWrap: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  camera: { flex: 1 },
  hint: { fontSize: 13, color: '#aaa', textAlign: 'center' },
});
