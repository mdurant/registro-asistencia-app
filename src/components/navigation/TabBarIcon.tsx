import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type TabRouteName = 'index' | 'history' | 'admin' | 'profile';

const TAB_ICONS: Record<TabRouteName, { active: IoniconName; inactive: IoniconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  history: { active: 'time', inactive: 'time-outline' },
  admin: { active: 'clipboard', inactive: 'clipboard-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

interface TabBarIconProps {
  name: TabRouteName;
  color: ColorValue;
  size?: number;
  focused: boolean;
}

export function TabBarIcon({ name, color, size = 24, focused }: TabBarIconProps) {
  const icons = TAB_ICONS[name] ?? TAB_ICONS.index;
  return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
}
