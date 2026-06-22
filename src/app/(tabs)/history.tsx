import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceRepo, supermarketRepo } from '@/database/repositories';
import { Palette, Spacing } from '@/constants/theme';
import type { AttendanceEvent } from '@/types';

type HistoryItem = AttendanceEvent & { smName?: string; commune?: string };

export default function HistoryScreen() {
  const { session } = useAuth();
  const [events, setEvents] = useState<HistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      void (async () => {
        const rows = await attendanceRepo.getTodayEvents(session.user.rut);
        const enriched = await Promise.all(
          rows.map(async (event) => {
            const sm = await supermarketRepo.findById(event.supermarketId);
            return { ...event, smName: sm?.name, commune: sm?.commune };
          }),
        );
        setEvents(enriched);
      })();
    }, [session]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Historial de hoy</Text>}
        renderItem={({ item }) => {
          const time = new Date(item.recordedAtLocal).toLocaleTimeString('es-CL');
          return (
            <Card style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Badge
                  label={item.eventType}
                  variant={item.eventType === 'INGRESO' ? 'success' : 'info'}
                />
                <Badge
                  label={item.syncStatus === 'synced' ? 'Sincronizado' : 'Pendiente'}
                  variant={item.syncStatus === 'synced' ? 'neutral' : 'warning'}
                />
              </View>
              <Text style={styles.smName}>{item.smName ?? item.supermarketId}</Text>
              <Text style={styles.meta}>
                {time} · {item.commune ?? ''}
              </Text>
              <Text style={styles.gps}>
                GPS: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </Text>
            </Card>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No hay registros hoy.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  list: { padding: Spacing.md, gap: Spacing.sm },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.textSecondary,
    marginBottom: Spacing.sm,
  },
  eventCard: { marginBottom: Spacing.sm, gap: Spacing.xs },
  eventHeader: { flexDirection: 'row', gap: Spacing.sm },
  smName: { fontSize: 16, fontWeight: '600', color: Palette.text },
  meta: { fontSize: 13, color: Palette.textSecondary },
  gps: { fontSize: 12, color: Palette.textMuted },
  empty: { textAlign: 'center', color: Palette.textMuted, padding: Spacing.xl },
});
