import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceInfo, formatDeviceLabel } from '@/services/device';
import { Palette, Spacing } from '@/constants/theme';
import { useEffect } from 'react';

export default function DeviceUnlinkedScreen() {
  const router = useRouter();
  const { linkDevice, logout } = useAuth();
  const [deviceLabel, setDeviceLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    getDeviceInfo().then((d) => setDeviceLabel(formatDeviceLabel(d)));
  }, []);

  async function handleLink() {
    setLoading(true);
    await linkDevice();
    setLoading(false);
    router.replace('/permissions');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <AlertBanner
          title="Dispositivo no vinculado"
          message="Se detectó un nuevo dispositivo. Recibirás un correo de alerta (una sola vez). Debes vincular este dispositivo y dar de baja el anterior."
          variant="warning"
        />

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Nuevo dispositivo detectado</Text>
          <Text style={styles.device}>{deviceLabel || 'Cargando...'}</Text>
          <Text style={styles.desc}>
            Al confirmar, el dispositivo anterior quedará desactivado y solo podrás registrar
            asistencia desde este equipo.
          </Text>
        </Card>

        <Button
          title={confirmed ? 'Confirmar vinculación' : 'Entiendo, continuar'}
          onPress={() => (confirmed ? handleLink() : setConfirmed(true))}
          loading={loading}
          variant={confirmed ? 'primary' : 'secondary'}
        />

        {confirmed ? (
          <Button title="Cancelar" onPress={() => setConfirmed(false)} variant="outline" />
        ) : (
          <Button title="Cerrar sesión" onPress={() => void logout()} variant="outline" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { flex: 1, padding: Spacing.lg, justifyContent: 'center', gap: Spacing.md },
  card: { gap: Spacing.sm },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },
  device: { fontSize: 16, fontWeight: '600', color: Palette.primary },
  desc: { fontSize: 14, color: Palette.textSecondary, lineHeight: 20 },
});
