import { Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Palette.primary },
    text: { color: '#fff' },
  },
  secondary: {
    container: { backgroundColor: Palette.primaryLight + '22' },
    text: { color: Palette.primaryDark },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Palette.primary },
    text: { color: Palette.primary },
  },
  danger: {
    container: { backgroundColor: Palette.error },
    text: { color: '#fff' },
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        v.container,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      <Text style={[styles.text, v.text]}>{loading ? 'Cargando...' : title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
