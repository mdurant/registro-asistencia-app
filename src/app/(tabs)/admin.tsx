import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceRepo, userRepo } from '@/database/repositories';
import { buildDailyReportHtml, queueDailyReportEmail } from '@/services/email';
import { Palette, Spacing } from '@/constants/theme';

export default function AdminScreen() {
  const { session } = useAuth();
  const [reportSent, setReportSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdminOrSupervisor =
    session?.user.role === 'admin' || session?.user.role === 'supervisor';

  const today = new Date().toISOString().slice(0, 10);
  const [summary, setSummary] = useState({ presentes: 0, pendientes: 0, total: 0 });

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const events = await attendanceRepo.getAllForDate(today);
        const ingresos = events.filter((e) => e.eventType === 'INGRESO');
        const uniqueUsers = new Set(ingresos.map((e) => e.userRut));
        setSummary({
          presentes: uniqueUsers.size,
          pendientes: events.filter((e) => e.syncStatus === 'pending').length,
          total: events.length,
        });
      })();
    }, [today]),
  );

  if (!session) return null;

  if (!isAdminOrSupervisor) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.restricted}>
            Esta sección es solo para supervisores y administradores.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  async function sendDailyReport() {
    if (!session) return;
    setLoading(true);
    const events = await attendanceRepo.getAllForDate(today);
    const rows = await Promise.all(
      events.map(async (e) => {
        const user = await userRepo.findByRut(e.userRut);
        return {
          userName: user?.name ?? e.userRut,
          supermarketName: e.supermarketId,
          eventType: e.eventType,
          time: new Date(e.recordedAtLocal).toLocaleTimeString('es-CL'),
          status: e.syncStatus === 'synced' ? 'Sincronizado' : 'Pendiente',
        };
      }),
    );
    const html = buildDailyReportHtml(today, rows);
    await queueDailyReportEmail(session.user.email, today, html);
    setReportSent(true);
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Panel de supervisión</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{summary.presentes}</Text>
            <Text style={styles.statLabel}>Presentes</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{summary.total}</Text>
            <Text style={styles.statLabel}>Registros</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNum, { color: Palette.warning }]}>{summary.pendientes}</Text>
            <Text style={styles.statLabel}>Pend. sync</Text>
          </Card>
        </View>

        <Card style={styles.reportCard}>
          <Text style={styles.reportTitle}>Reporte diario consolidado</Text>
          <Text style={styles.reportDesc}>
            Genera y encola el correo con PDF adjunto (asistencias, inasistencias y atrasos del día).
          </Text>
          {reportSent ? <Badge label="Reporte encolado para envío" variant="success" /> : null}
          <Button title="Generar y enviar reporte" onPress={sendDailyReport} loading={loading} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.md, gap: Spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  restricted: { textAlign: 'center', color: Palette.textSecondary, fontSize: 15 },
  title: { fontSize: 22, fontWeight: '700', color: Palette.text },
  date: { fontSize: 14, color: Palette.textSecondary, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 28, fontWeight: '700', color: Palette.primary },
  statLabel: { fontSize: 12, color: Palette.textSecondary },
  reportCard: { gap: Spacing.md },
  reportTitle: { fontSize: 17, fontWeight: '600', color: Palette.text },
  reportDesc: { fontSize: 14, color: Palette.textSecondary, lineHeight: 20 },
});
