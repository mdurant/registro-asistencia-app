import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

const colors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Palette.successBg, text: Palette.success },
  warning: { bg: Palette.warningBg, text: Palette.warning },
  error: { bg: Palette.errorBg, text: Palette.error },
  info: { bg: Palette.infoBg, text: Palette.info },
  neutral: { bg: '#F0F0F3', text: Palette.textSecondary },
  primary: { bg: Palette.primaryLight + '33', text: Palette.primaryDark },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const c = colors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});
