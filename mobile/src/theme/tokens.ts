import { fontFamily } from '@/theme/fonts'

/**
 * QLIN — минимализм: нейтральный фон, монохром, один акцент (как Apple / Tesla UI).
 */
export const theme = {
  fontFamily,
  color: {
    bg: '#F5F5F7',
    bgElevated: '#FFFFFF',
    bgMuted: '#E8E8ED',
    /** Основной акцент — почти чёрный */
    primary: '#1D1D1F',
    primaryDark: '#000000',
    primaryLight: '#E8E8ED',
    onPrimary: '#FFFFFF',
    text: '#1D1D1F',
    textSecondary: '#6E6E73',
    textMuted: '#86868B',
    border: '#D2D2D7',
    borderSubtle: '#E8E8ED',
    borderStrong: '#AEAEB2',
    error: '#D70015',
    success: '#34C759',
    overlay: 'rgba(0, 0, 0, 0.45)',
    /** Редкий тёплый акцент — только если нужен отдельный выделитель */
    gold: '#8E8E93',
    goldLight: '#E8E8ED',
    goldDark: '#3A3A3C',
    ctaYellow: '#1D1D1F',
    ctaYellowText: '#FFFFFF',
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 22, xxl: 28, full: 999 },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  font: {
    hero: 36,
    title: 24,
    subtitle: 17,
    body: 16,
    small: 14,
    caption: 12,
  },
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      elevation: 2,
    },
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },
    lift: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 4,
    },
  },
} as const

export type Theme = typeof theme
