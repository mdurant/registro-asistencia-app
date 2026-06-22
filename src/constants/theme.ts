import { Platform } from 'react-native';

export const Palette = {
  primary: '#14B8A6',
  primaryLight: '#2DD4A8',
  primaryDark: '#0D9488',
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#60646C',
  textMuted: '#909399',
  border: '#E8ECF0',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
} as const;

export const Colors = {
  light: {
    text: Palette.text,
    textSecondary: Palette.textSecondary,
    background: Palette.background,
    card: Palette.card,
    backgroundElement: '#EEF2F6',
    backgroundSelected: '#E0E8EC',
    primary: Palette.primary,
    border: Palette.border,
    success: Palette.success,
    warning: Palette.warning,
    error: Palette.error,
    info: Palette.info,
  },
  dark: {
    text: '#F5F7FA',
    textSecondary: '#B0B4BA',
    background: '#0F172A',
    card: '#1E293B',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    primary: Palette.primaryLight,
    border: '#334155',
    success: Palette.success,
    warning: Palette.warning,
    error: Palette.error,
    info: Palette.info,
  },
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'System', mono: 'Menlo' },
  default: { sans: 'sans-serif', mono: 'monospace' },
  web: { sans: 'Inter, system-ui, sans-serif', mono: 'monospace' },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  // Legacy aliases (starter template)
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
