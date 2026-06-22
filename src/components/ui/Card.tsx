import { StyleSheet, View, type ViewProps } from 'react-native';

import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  padding?: number;
}

export function Card({ children, style, padding = Spacing.lg, ...props }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
});
