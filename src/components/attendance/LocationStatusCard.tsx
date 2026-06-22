import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { LocationValidation } from '@/services/attendance';
import { formatDistanceM } from '@/utils/geo';

interface LocationStatusCardProps {
  commune: string;
  address: string;
  loading?: boolean;
  locationError?: string | null;
  validation: LocationValidation | null;
  accuracyM?: number;
}

export function LocationStatusCard({
  commune,
  address,
  loading,
  locationError,
  validation,
  accuracyM,
}: LocationStatusCardProps) {
  if (locationError) {
    return (
      <View style={[styles.card, styles.cardError]}>
        <Text style={styles.title}>Ubicación no disponible</Text>
        <Text style={styles.message}>{locationError}</Text>
      </View>
    );
  }

  if (loading || !validation) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={Palette.primaryLight} />
        <Text style={styles.message}>Obteniendo tu ubicación GPS…</Text>
      </View>
    );
  }

  const variant = validation.valid ? 'success' : 'warning';
  const title = validation.inStore
    ? 'En el local asignado'
    : validation.inCommune
      ? `Dentro de ${commune}`
      : `Fuera de ${commune}`;

  const detail = validation.valid
    ? validation.inStore
      ? `Estás a ${formatDistanceM(validation.distanceM)} del punto de registro.`
      : `Estás en la comuna ${commune} (${formatDistanceM(validation.distanceM)} del local en ${address}).`
    : `Estás a ${formatDistanceM(validation.distanceM)} del local y fuera de la comuna ${commune}. Acércate a ${commune} para registrar.`;

  return (
    <View style={[styles.card, validation.valid ? styles.cardOk : styles.cardWarn]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Badge
          label={validation.valid ? 'Ubicación válida' : 'Ubicación inválida'}
          variant={variant}
        />
      </View>
      <Text style={styles.message}>{detail}</Text>
      {accuracyM != null ? (
        <Text style={styles.accuracy}>Precisión GPS: ±{Math.round(accuracyM)} m</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardOk: { borderColor: Palette.success + '88' },
  cardWarn: { borderColor: Palette.warning + '88' },
  cardError: { borderColor: Palette.error + '88' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: 15, fontWeight: '600', color: '#fff', flex: 1 },
  message: { fontSize: 13, color: '#ccc', lineHeight: 18 },
  accuracy: { fontSize: 12, color: '#999' },
});
