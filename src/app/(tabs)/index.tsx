import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { AlertBanner } from '@/components/ui/AlertBanner';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import { attendanceRepo, supermarketRepo } from '@/database/repositories';
import { Palette, Spacing } from '@/constants/theme';
import type { OpenVisit, Supermarket } from '@/types';
import { formatRut } from '@/utils/rut';

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { isOnline, pendingCount, isSyncing, lastSyncError, apiBaseUrl, syncNow } = useSync();
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [openVisit, setOpenVisit] = useState<OpenVisit | null>(null);
  const [todayCount, setTodayCount] = useState(0);

  const load = useCallback(async () => {
    if (!session) return;
    const [markets, visit, events] = await Promise.all([
      supermarketRepo.findByUserRut(session.user.rut),
      attendanceRepo.getOpenVisit(session.user.rut),
      attendanceRepo.getTodayEvents(session.user.rut),
    ]);
    setSupermarkets(markets);
    setOpenVisit(visit);
    setTodayCount(events.length);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function handleSupermarketPress(sm: Supermarket) {
    const isOpenHere = openVisit?.supermarketId === sm.id;
    const eventType = isOpenHere ? 'SALIDA' : 'INGRESO';
    router.push({
      pathname: '/attendance/capture',
      params: { supermarketId: sm.id, eventType },
    });
  }

  if (!session) return null;

  const visitsToday = Math.floor(todayCount / 2);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={supermarkets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={() => {
              void syncNow();
              void load();
            }}
            tintColor={Palette.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {!isOnline ? (
              <AlertBanner
                title="Sin conexión"
                message="Tus registros se guardan localmente y se sincronizarán al recuperar señal."
                variant="warning"
              />
            ) : pendingCount > 0 ? (
              <AlertBanner
                title={
                  isSyncing
                    ? 'Sincronizando registros…'
                    : `${pendingCount} registro(s) pendiente(s)`
                }
                message={
                  lastSyncError ??
                  (isSyncing
                    ? `Enviando a ${apiBaseUrl}…`
                    : `Toca para sincronizar. Servidor: ${apiBaseUrl}`)
                }
                variant={lastSyncError ? 'warning' : 'info'}
                onPress={isSyncing ? undefined : () => void syncNow()}
              />
            ) : null}

            <Card style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {session.user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.name}>{session.user.name}</Text>
                  <Text style={styles.rut}>{formatRut(session.user.rut)}</Text>
                  <Badge
                    label={openVisit ? 'En visita' : 'Disponible'}
                    variant={openVisit ? 'primary' : 'success'}
                  />
                </View>
                <ProgressRing progress={visitsToday * 25} label={String(visitsToday)} sublabel="visitas" />
              </View>
            </Card>

            {openVisit ? (
              <AlertBanner
                title={`Visita activa: ${openVisit.supermarketName}`}
                message={`Ingreso: ${new Date(openVisit.ingresoAt).toLocaleTimeString('es-CL')}`}
                variant="info"
              />
            ) : null}

            <Text style={styles.sectionTitle}>Mis supermercados</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = openVisit?.supermarketId === item.id;
          return (
            <Pressable
              onPress={() => handleSupermarketPress(item)}
              accessibilityRole="button"
              accessibilityLabel={isActive ? `Registrar salida de ${item.name}` : `Registrar ingreso en ${item.name}`}>
              <Card style={[styles.smCard, isActive && styles.smCardActive]}>
                <View style={styles.smHeader}>
                  <Text style={styles.smName}>{item.name}</Text>
                  {isActive ? <Badge label="En curso" variant="primary" /> : null}
                </View>
                <Text style={styles.smMeta}>{item.commune} · radio comuna o {item.geofenceRadiusM} m del local</Text>
                <Text style={styles.smAddress}>{item.address}</Text>
                <View style={[styles.smAction, isActive ? styles.smActionExit : styles.smActionEntry]}>
                  <Ionicons
                    name={isActive ? 'log-out-outline' : 'log-in-outline'}
                    size={20}
                    color={isActive ? Palette.attendanceExit : Palette.attendanceEntry}
                  />
                  <Text style={[styles.smActionText, isActive ? styles.smActionTextExit : styles.smActionTextEntry]}>
                    {isActive ? 'Registrar Salida' : 'Registrar Ingreso'}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={isActive ? Palette.attendanceExit : Palette.attendanceEntry}
                  />
                </View>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No tienes supermercados asignados.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },
  header: { gap: Spacing.md, marginBottom: Spacing.sm },
  profileCard: {},
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.primaryLight + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: Palette.primaryDark },
  profileInfo: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: '700', color: Palette.text },
  rut: { fontSize: 13, color: Palette.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },
  smCard: { marginBottom: Spacing.sm, gap: 4 },
  smCardActive: { borderWidth: 2, borderColor: Palette.attendanceExit },
  smHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smName: { fontSize: 16, fontWeight: '600', color: Palette.text, flex: 1 },
  smMeta: { fontSize: 13, color: Palette.primary, fontWeight: '500' },
  smAddress: { fontSize: 13, color: Palette.textSecondary },
  smAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginTop: Spacing.sm,
  },
  smActionEntry: { backgroundColor: Palette.attendanceEntryBg },
  smActionExit: { backgroundColor: Palette.attendanceExitBg },
  smActionText: { flex: 1, fontSize: 14, fontWeight: '700' },
  smActionTextEntry: { color: Palette.attendanceEntry },
  smActionTextExit: { color: Palette.attendanceExit },
  empty: { textAlign: 'center', color: Palette.textMuted, padding: Spacing.xl },
});
