import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/theme';

interface ProgressRingProps {
  progress: number;
  size?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  label,
  sublabel,
}: ProgressRingProps) {
  const clamped = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: Palette.primary,
              borderWidth: 6,
              opacity: clamped / 100,
            },
          ]}
        />
      </View>
      <View style={styles.labelContainer}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    borderWidth: 6,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { position: 'absolute' },
  labelContainer: { position: 'absolute', alignItems: 'center' },
  label: { fontSize: 18, fontWeight: '700', color: Palette.text },
  sublabel: { fontSize: 11, color: Palette.textSecondary },
});
