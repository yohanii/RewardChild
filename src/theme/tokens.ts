import type { TextStyle, ViewStyle } from 'react-native'

/**
 * RewardChild's shared visual language.
 *
 * Raw shades intentionally stay private to this file. Components should use a
 * semantic role so later world-specific tuning does not require screen edits.
 */
export const colors = {
  background: '#F7F1E5',
  surface: '#FFFDF7',
  surfaceRaised: '#FFFFFF',
  parchment: '#F3E2BE',
  wood: '#5B3826',
  primary: '#7A3E2D',
  secondary: '#315F4E',
  accentGold: '#C7902F',
  textPrimary: '#2F211A',
  textSecondary: '#6E5A4B',
  border: '#D7C4A3',
  success: '#3F6F50',
  warning: '#A9681E',
  danger: '#A8443A',
  child: '#3F67A4',
  parent: '#8B3F4A',
  bank: '#315F4E',
  onPrimary: '#FFFDF7',
  onGold: '#352315',
  disabled: '#B7AA9A',
  overlay: 'rgba(47, 33, 26, 0.48)',
  primarySoft: '#F3E1D8',
  secondarySoft: '#E3EEE8',
  goldSoft: '#FAEECF',
  successSoft: '#E7F1E9',
  warningSoft: '#F8EBD8',
  dangerSoft: '#F8E3E0',
  childSoft: '#E5ECF7',
  parentSoft: '#F4E3E6',
  bankSoft: '#E3EEE8',
} as const

export const typography = {
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  coin: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  button: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
} satisfies Record<string, TextStyle>

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 999,
} as const

export const layout = {
  screenHorizontalPadding: spacing.lg,
  cardPadding: 18,
  maxContentWidth: 640,
  minTouchTarget: 44,
} as const

export const shadows = {
  card: {
    shadowColor: colors.wood,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: colors.wood,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
} satisfies Record<string, ViewStyle>

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  layout,
  shadows,
} as const

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
export type RoleTone = 'child' | 'parent' | 'bank'
