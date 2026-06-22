import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { Palette } from '@/constants/theme';

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;
  if (!session.deviceLinked) return <Redirect href="/device-unlinked" />;
  if (!session.permissionsCompleted) return <Redirect href="/permissions" />;

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.background },
});
