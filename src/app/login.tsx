import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { APP_NAME } from '@/constants/config';
import { Palette, Spacing } from '@/constants/theme';
import { formatRut, validateRut } from '@/utils/rut';

export default function LoginScreen() {
  const router = useRouter();
  const {
    login,
    loginBiometric,
    enrollBiometricDemo,
    biometricAvailable,
    biometricEnrolled,
    databaseAvailable,
    session,
  } = useAuth();
  const [rut, setRut] = useState('');
  const [last4, setLast4] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [session, router]);

  if (session) {
    return null;
  }

  const rutValid = validateRut(rut);

  async function handleLogin() {
    setError(null);
    setSuccess(null);
    if (!databaseAvailable) {
      setError('La base de datos no está disponible en web. Usa Expo Go en tu móvil.');
      return;
    }
    if (!rutValid) {
      setError('RUT inválido. Verifica el dígito verificador.');
      return;
    }
    if (last4.length !== 4) {
      setError('Ingresa los últimos 4 dígitos de tu RUT.');
      return;
    }

    setLoading(true);
    const err = await login(rut, last4);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace('/');
  }

  async function handleBiometric() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const err = await loginBiometric();
    setLoading(false);
    if (err) setError(err);
    else router.replace('/');
  }

  async function handleEnrollBiometric() {
    setError(null);
    setSuccess(null);
    if (!rutValid) {
      setError('Ingresa un RUT válido para vincular la biometría.');
      return;
    }

    setLoading(true);
    const err = await enrollBiometricDemo(rut);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setSuccess('Huella / Face ID guardados. Ya puedes ingresar sin PIN.');
  }

  function handleRutChange(text: string) {
    const cleaned = text.replace(/[^0-9kK]/g, '');
    if (cleaned.length <= 9) setRut(formatRut(cleaned));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>Registro de asistencia en ruta</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>
          <Text style={styles.cardDesc}>
            Ingresa tu RUT chileno y los últimos 4 dígitos como contraseña.
          </Text>

          {error ? (
            <AlertBanner title="Error" message={error} variant="error" onDismiss={() => setError(null)} />
          ) : null}
          {success ? (
            <AlertBanner title="Listo" message={success} variant="success" onDismiss={() => setSuccess(null)} />
          ) : null}

          {!databaseAvailable ? (
            <AlertBanner
              title="Vista web limitada"
              message="SQLite requiere un dispositivo móvil. Escanea el QR con Expo Go para usar la app completa."
              variant="warning"
            />
          ) : null}

          {biometricEnrolled && biometricAvailable ? (
            <Button
              title="Ingresar con huella / Face ID"
              onPress={handleBiometric}
              loading={loading}
            />
          ) : null}

          {biometricEnrolled && biometricAvailable ? (
            <Text style={styles.divider}>o ingresa con RUT y PIN</Text>
          ) : null}

          <Input
            label="RUT"
            placeholder="12.345.678-9"
            value={rut}
            onChangeText={handleRutChange}
            keyboardType="default"
            autoCapitalize="characters"
          />

          <Input
            label="Últimos 4 dígitos"
            placeholder="••••"
            value={last4}
            onChangeText={(t) => setLast4(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
          />

          <Button title="Ingresar con RUT y PIN" onPress={handleLogin} loading={loading} variant="secondary" />

          {biometricAvailable && rutValid && !biometricEnrolled ? (
            <Pressable onPress={handleEnrollBiometric} style={styles.bioLink}>
              <Text style={styles.bioText}>
                Guardar huella / Face ID para este RUT (demo, sin PIN)
              </Text>
            </Pressable>
          ) : null}
        </Card>

        <Text style={styles.demo}>
          Demo: RUT 12.345.678-5 · PIN 5678{'\n'}
          Supermercado: San Nicolás 1033, San Miguel{'\n'}
          Supervisor: 11.111.111-1 · PIN 1111
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { flex: 1, padding: Spacing.lg, justifyContent: 'center', gap: Spacing.lg },
  header: { alignItems: 'center', gap: Spacing.xs },
  logo: { fontSize: 32, fontWeight: '700', color: Palette.primary },
  subtitle: { fontSize: 15, color: Palette.textSecondary },
  card: { gap: Spacing.md },
  cardTitle: { fontSize: 22, fontWeight: '700', color: Palette.text },
  cardDesc: { fontSize: 14, color: Palette.textSecondary, lineHeight: 20, marginBottom: Spacing.xs },
  divider: { textAlign: 'center', fontSize: 13, color: Palette.textMuted },
  bioLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  bioText: { fontSize: 14, color: Palette.primary, fontWeight: '600', textAlign: 'center' },
  demo: { textAlign: 'center', fontSize: 12, color: Palette.textMuted, lineHeight: 18 },
});
