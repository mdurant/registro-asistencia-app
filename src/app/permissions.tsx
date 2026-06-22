import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { requestAllPermissions } from '@/services/attendance';
import { Palette, Spacing } from '@/constants/theme';

const STEPS = [
  {
    icon: '📷',
    title: 'Cámara',
    desc: 'Necesaria para capturar evidencia fotográfica al registrar ingreso y salida.',
    required: true,
  },
  {
    icon: '📍',
    title: 'Geolocalización',
    desc: 'Registramos tu ubicación exacta para validar que estás en el supermercado asignado.',
    required: true,
  },
  {
    icon: '🔐',
    title: 'Biometría',
    desc: 'Opcional. Permite ingresar más rápido con huella o Face ID.',
    required: false,
  },
];

export default function PermissionsScreen() {
  const router = useRouter();
  const { completePermissions } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    setError(null);
    const perms = await requestAllPermissions();
    setLoading(false);

    if (!perms.camera || !perms.location) {
      setError('Debes conceder permisos de cámara y ubicación para continuar.');
      return;
    }

    await completePermissions();
    router.replace('/biometric-setup');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Permisos del dispositivo</Text>
        <Text style={styles.subtitle}>
          Para registrar tu asistencia con trazabilidad completa, necesitamos acceso a:
        </Text>

        {error ? <AlertBanner title="Permisos requeridos" message={error} variant="warning" /> : null}

        {STEPS.map((step) => (
          <Card key={step.title} style={styles.stepCard}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={[styles.badge, step.required ? styles.required : styles.optional]}>
                  {step.required ? 'Requerido' : 'Opcional'}
                </Text>
              </View>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </Card>
        ))}

        <Button title="Conceder permisos y continuar" onPress={handleContinue} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 26, fontWeight: '700', color: Palette.text },
  subtitle: { fontSize: 15, color: Palette.textSecondary, lineHeight: 22, marginBottom: Spacing.sm },
  stepCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepIcon: { fontSize: 28 },
  stepContent: { flex: 1, gap: Spacing.xs },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepTitle: { fontSize: 16, fontWeight: '600', color: Palette.text },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  required: { backgroundColor: Palette.errorBg, color: Palette.error },
  optional: { backgroundColor: Palette.infoBg, color: Palette.info },
  stepDesc: { fontSize: 14, color: Palette.textSecondary, lineHeight: 20 },
});
