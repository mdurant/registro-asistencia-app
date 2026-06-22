import { StyleSheet, TextInput, View, Text, type TextInputProps } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={Palette.textMuted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.textSecondary,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Palette.card,
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Palette.text,
  },
  inputError: { borderColor: Palette.error },
  error: { fontSize: 13, color: Palette.error, marginTop: 2 },
});
