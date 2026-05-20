export const Colors = {
  // Primary green palette
  primary: '#3DAA6F',
  primaryLight: '#6BC98F',
  primaryDark: '#2D8055',
  primarySurface: '#EBF5F0',
  primaryMuted: '#F3F8F5',

  // Warm accent colors
  accentYellow: '#F59E0B',
  accentYellowLight: '#FFFBEB',
  accentBlue: '#3B82F6',
  accentBlueLLight: '#EFF6FF',
  accentPink: '#EC4899',
  accentOrange: '#F97316',
  accentPurple: '#8B5CF6',

  // Backgrounds
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  // Tab-specific backgrounds
  indoorBg: '#F0FDF4',
  outdoorBg: '#FEFCE8',

  // Completed state
  completedBg: '#F9FAFB',
  completedBorder: '#D1FAE5',
  completedText: '#9CA3AF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  h4: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
  caption: { fontSize: 11, fontWeight: '400' as const },
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const focusColors: Record<string, string> = {
  cognitive: '#64B5F6',
  language: '#CE93D8',
  emotional: '#F48FB1',
  empathy: '#FFB74D',
  'self-regulation': '#81C784',
  motor: '#4DD0E1',
};

export const focusBg: Record<string, string> = {
  cognitive: '#E3F2FD',
  language: '#F3E5F5',
  emotional: '#FCE4EC',
  empathy: '#FFF3E0',
  'self-regulation': '#E8F5E9',
  motor: '#E0F7FA',
};
