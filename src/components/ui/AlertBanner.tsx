import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

type AlertVariant = 'success' | 'warning' | 'error' | 'info';

const config: Record<AlertVariant, { bg: string; border: string; icon: string }> = {
  success: { bg: Palette.successBg, border: Palette.success, icon: '✓' },
  warning: { bg: Palette.warningBg, border: Palette.warning, icon: '⚠' },
  error: { bg: Palette.errorBg, border: Palette.error, icon: '✕' },
  info: { bg: Palette.infoBg, border: Palette.info, icon: 'ℹ' },
};

interface AlertBannerProps {
  title: string;
  message?: string;
  variant?: AlertVariant;
  onPress?: () => void;
  onDismiss?: () => void;
}

export function AlertBanner({
  title,
  message,
  variant = 'info',
  onPress,
  onDismiss,
}: AlertBannerProps) {
  const c = config[variant];
  const content = (
    <>
      <Text style={styles.icon}>{c.icon}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text style={styles.dismiss}>✕</Text>
        </Pressable>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.banner, { backgroundColor: c.bg, borderLeftColor: c.border }]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderLeftColor: c.border }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    gap: Spacing.sm,
  },
  icon: { fontSize: 18, marginTop: 1 },
  content: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '600', color: Palette.text },
  message: { fontSize: 13, color: Palette.textSecondary, lineHeight: 18 },
  dismiss: { fontSize: 16, color: Palette.textMuted, padding: 4 },
});
