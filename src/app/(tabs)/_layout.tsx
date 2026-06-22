import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useAuth } from '@/contexts/AuthContext';
import { Palette } from '@/constants/theme';

export default function TabsLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Palette.card },
        headerTitleStyle: { fontWeight: '600', color: Palette.text },
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarStyle: { backgroundColor: Palette.card, borderTopColor: Palette.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarLabel: 'Inicio',
          headerTitle: 'Mi Asistencia',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="index" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarLabel: 'Historial',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="history" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Supervisión',
          tabBarLabel: 'Supervisión',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="admin" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="profile" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
});
