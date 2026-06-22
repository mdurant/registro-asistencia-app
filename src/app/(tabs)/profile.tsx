import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { deviceRepo } from '@/database/repositories';
import { formatDeviceLabel, getDeviceInfo } from '@/services/device';
import { Palette, Spacing } from '@/constants/theme';
import { formatRut } from '@/utils/rut';
import type { LinkedDevice } from '@/types';

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const [deviceLabel, setDeviceLabel] = useState('');
  const [linked, setLinked] = useState<LinkedDevice | null>(null);

  useEffect(() => {
    void getDeviceInfo().then((d) => setDeviceLabel(formatDeviceLabel(d)));
  }, []);

  useEffect(() => {
    if (!session) return;
    void deviceRepo.getActiveDevice(session.user.rut).then(setLinked);
  }, [session]);

  if (!session) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {session.user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.name}>{session.user.name}</Text>
          <Text style={styles.rut}>{formatRut(session.user.rut)}</Text>
          <Badge label={session.user.role} variant="primary" />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Dispositivo vinculado</Text>
          <Text style={styles.value}>{deviceLabel}</Text>
          {linked ? (
            <Text style={styles.meta}>
              Vinculado: {new Date(linked.linkedAt).toLocaleDateString('es-CL')}
            </Text>
          ) : null}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Correo</Text>
          <Text style={styles.value}>{session.user.email}</Text>
        </Card>

        <Button title="Cerrar sesión" onPress={() => void logout()} variant="danger" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.md, gap: Spacing.md },
  card: { alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.primaryLight + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: Palette.primaryDark },
  name: { fontSize: 22, fontWeight: '700', color: Palette.text },
  rut: { fontSize: 14, color: Palette.textSecondary },
  section: {
    fontSize: 13,
    color: Palette.textSecondary,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  value: { fontSize: 15, color: Palette.text, alignSelf: 'flex-start' },
  meta: { fontSize: 12, color: Palette.textMuted, alignSelf: 'flex-start' },
});
