import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { authenticateWithBiometric } from '@/services/auth';
import { Palette, Spacing } from '@/constants/theme';

export default function BiometricSetupScreen() {
  const router = useRouter();
  const { setupBiometric, biometricAvailable } = useAuth();

  async function handleEnable() {
    const ok = await authenticateWithBiometric();
    if (ok) {
      await setupBiometric();
      router.replace('/(tabs)');
    }
  }

  function handleSkip() {
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>¿Habilitar biometría?</Text>
        <Text style={styles.subtitle}>
          Puedes ingresar más rápido usando huella digital o Face ID en futuros accesos.
        </Text>

        <Card style={styles.card}>
          <Text style={styles.cardText}>
            {biometricAvailable
              ? 'Tu dispositivo soporta autenticación biométrica.'
              : 'Tu dispositivo no tiene biometría configurada. Puedes omitir este paso.'}
          </Text>
        </Card>

        {biometricAvailable ? (
          <Button title="Habilitar huella / Face ID" onPress={handleEnable} />
        ) : null}
        <Button title="Omitir por ahora" onPress={handleSkip} variant="outline" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { flex: 1, padding: Spacing.lg, justifyContent: 'center', gap: Spacing.md },
  icon: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: Palette.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Palette.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: { marginVertical: Spacing.sm },
  cardText: { fontSize: 14, color: Palette.textSecondary, lineHeight: 20, textAlign: 'center' },
});
