// ─────────────────────────────────────────────────────────────────
// JAHEEZ Brand Tokens — Light Warm Design System
// ALL colors are defined here. NEVER hardcode hex values elsewhere.
// ─────────────────────────────────────────────────────────────────

export const BRAND = {
  // ── Primary — Brand Red
  RED:        '#F03030',
  RED_DARK:   '#C42020',
  RED_LIGHT:  '#FDEAEA',

  // ── Accent — Brand Yellow
  YELLOW:       '#F5CE2E',
  YELLOW_DARK:  '#C9A800',
  YELLOW_LIGHT: '#FFFBEE',

  // ── Backgrounds (light warm theme)
  BG:       '#FEFDF8',   // warm white — primary background
  CREAM:    '#FFFBEE',   // cream — section backgrounds
  SURFACE:  '#FFFFFF',   // pure white — cards
  LIGHT:    '#F5F4F0',   // light gray — secondary backgrounds

  // ── Borders & Dividers
  BORDER:   '#E8E6DF',
  BORDER2:  '#F0EEE8',

  // ── Text
  TEXT:   '#1C1C1E',   // charcoal — primary text
  TEXT2:  '#5C5C5E',   // medium gray — secondary text
  TEXT3:  '#9CA3AF',   // light gray — tertiary / placeholder

  // ── Input
  INPUT_BG:     '#FFFFFF',
  INPUT_BORDER: '#E8E6DF',

  // ── Semantic
  GREEN:   '#2DB87A',
  BLUE:    '#3A8FE8',
  WARN:    '#F5A623',
  ERROR:   '#DC2626',

  // ── WhatsApp
  WHATSAPP: '#25D366',

  // ── Category tints
  FOOD_TINT:     '#FF6B35',
  GROCERY_TINT:  '#2DB87A',
  PHARMACY_TINT: '#3A8FE8',
  PARCEL_TINT:   '#A78BFA',
  ERRAND_TINT:   '#F472B6',

  // ── Legacy aliases (backward compat)
  DARK_BG:         '#FEFDF8',
  DARK_SURFACE:    '#FFFFFF',
  DARK_CARD:       '#F5F4F0',
  GLASS:           'rgba(0,0,0,0.04)',
  GLASS_MID:       'rgba(0,0,0,0.06)',
  GLASS_HIGH:      'rgba(0,0,0,0.10)',
  GLASS_BORDER:    '#E8E6DF',
  GLASS_BORDER_ACTIVE: 'rgba(240,48,48,0.40)',
  TEXT_ON_DARK:  '#1C1C1E',
  TEXT_ON_DARK2: '#5C5C5E',
  TEXT_ON_DARK3: '#9CA3AF',
  ERROR_RED:     '#DC2626',
} as const;

// ── Gradient Presets (use with expo-linear-gradient)
export const GRADIENTS = {
  PRIMARY:  ['#F03030', '#C42020'] as const,
  YELLOW:   ['#F5CE2E', '#C9A800'] as const,
  SUCCESS:  ['#2DB87A', '#1A8F5B'] as const,
  HERO:     ['#F03030', '#C42020'] as const,

  // ── Crimson Glass Design System
  CRIMSON_HERO:    ['#7F1D1D', '#B91C1C', '#F03030'] as const,
  CRIMSON_CARD:    ['#991B1B', '#7F1D1D'] as const,
  MIDNIGHT_WINE:   ['#4C0519', '#7F1D1D'] as const,

  // Light warm gradients
  WARM_BG:      ['#FEFDF8', '#FFFBEE'] as const,
  RED_SOFT:     ['#FDEAEA', '#FFF5F5'] as const,
  YELLOW_SOFT:  ['#FFFBEE', '#FFF8D6'] as const,
} as const;

// ── Fonts
export const FONTS = {
  DISPLAY:  'Cairo-Bold',
  BODY:     'Cairo-Regular',
  MEDIUM:   'Cairo-Regular',
  SEMIBOLD: 'Cairo-SemiBold',
  MONO:     'Cairo-Regular',
  MONO_BOLD: 'Cairo-Bold',
} as const;

// ── Shape
export const RADIUS = {
  CARD:  16,
  INPUT: 12,
  PILL:  9999,
  SM:    8,
  MD:    12,
  LG:    16,
  XL:    24,
  XXL:   32,
} as const;

// ── Sizing
export const SIZE = {
  BUTTON_HEIGHT: 52,
  INPUT_HEIGHT:  52,
  NAV_HEIGHT:    56,
  TAB_HEIGHT:    64,
  TOUCH_MIN:     44,
} as const;

// ── Spacing (8px grid)
export const SPACE = {
  XS:  4,
  SM:  8,
  MD:  16,
  LG:  24,
  XL:  32,
  XXL: 48,
} as const;

// ── Shadows — spec: 0 2px 12px rgba(0,0,0,0.08)
export const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
} as const;

export const SHADOW_SM = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
} as const;

export const SHADOW_LG = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 20,
  elevation: 6,
} as const;

export const SHADOW_RED = {
  shadowColor: '#F03030',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 8,
} as const;

export const SHADOW_YELLOW = {
  shadowColor: '#F5CE2E',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 14,
  elevation: 6,
} as const;

export const SHADOW_DARK = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14,
  shadowRadius: 24,
  elevation: 10,
} as const;

// ── Re-exports for backward compat
export const RADIUS_CARD  = RADIUS.CARD;
export const RADIUS_INPUT = RADIUS.INPUT;
export const RADIUS_PILL  = RADIUS.PILL;
export const BUTTON_HEIGHT = SIZE.BUTTON_HEIGHT;
export const INPUT_HEIGHT  = SIZE.INPUT_HEIGHT;
export const NAV_HEIGHT    = SIZE.NAV_HEIGHT;
export const TAB_HEIGHT    = SIZE.TAB_HEIGHT;
export const TOUCH_MIN     = SIZE.TOUCH_MIN;
