// frontend/user-app/lib/designSystem.ts

import { useColorScheme } from 'react-native';

// Primary brand colors – adjust as needed
export const COLORS = {
  primary: '#1D4ED8', // blue
  secondary: '#10B981', // teal
  accent: '#F59E0B', // amber
  background: '#FFFFFF',
  surface: '#FFFFFF',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onBackground: '#111827',
  onSurface: '#111827',
  error: '#DC2626',
  success: '#16A34A',
  // dark mode overrides (will be swapped automatically)
  darkBackground: '#111827',
  darkSurface: '#1F2937',
  darkOnBackground: '#F9FAFB',
  darkOnSurface: '#F9FAFB',
};

export const FONTS = {
  headline: 'Inter',
  body: 'Inter',
  caption: 'Inter',
  // fallback generic stack
  fallback: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  round: 9999,
};

export const SHADOWS = {
  elevation1: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  elevation2: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
};

export const GRADIENTS = {
  primary: ['#1D4ED8', '#2563EB', '#3B82F6'], // blue gradient
  secondary: ['#10B981', '#34D399'],
};

// Hook to expose tokens and automatically switch for dark mode
export const useDesign = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const palette = isDark
    ? {
        background: COLORS.darkBackground,
        surface: COLORS.darkSurface,
        onBackground: COLORS.darkOnBackground,
        onSurface: COLORS.darkOnSurface,
        primary: COLORS.primary,
        secondary: COLORS.secondary,
        accent: COLORS.accent,
        error: COLORS.error,
        success: COLORS.success,
      }
    : {
        background: COLORS.background,
        surface: COLORS.surface,
        onBackground: COLORS.onBackground,
        onSurface: COLORS.onSurface,
        primary: COLORS.primary,
        secondary: COLORS.secondary,
        accent: COLORS.accent,
        error: COLORS.error,
        success: COLORS.success,
      };

  return {
    COLORS: palette,
    FONTS,
    SPACING,
    RADIUS,
    SHADOWS,
    GRADIENTS,
    isDark,
  };
};
