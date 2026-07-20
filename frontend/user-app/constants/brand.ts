// ─────────────────────────────────────────────────────────────────
// JAHEEZ Brand Tokens — Light Warm Design System
// ALL colors are defined here. NEVER hardcode hex values elsewhere.
// ─────────────────────────────────────────────────────────────────

export const BRAND = {
  // ── Primary — Brand Red (Premium App UI Red)
  RED:        '#E8202A',   // exact brand red
  RED_DARK:   '#B5141C',   // deep brand red
  RED_LIGHT:  '#FFEBEE',   // soft red tint

  // ── Accent — Brand Yellow (Exact match with Jaheez logo yellow)
  YELLOW:       '#F5C518',   // exact brand yellow
  YELLOW_DARK:  '#D4A20E',   // amber gold
  YELLOW_LIGHT: '#f7da5bff',   // soft cream yellow brand tint
  PROMO_BG:     '#E28A00',   // darker yellow mixed with orange for promos

  // ── Backgrounds (modern cool slate theme)
  BG:       '#FFFFFF',   // clean white background
  CREAM:    '#FAFAFA',   // clean near-white surfaces, never yellowed
  SURFACE:  '#FFFFFF',   // pure white — cards
  LIGHT:    '#F4F6F8',   // crisp neutral dividers and secondary surfaces

  // ── Borders & Dividers
  BORDER:   'rgba(15, 23, 42, 0.12)',
  BORDER2:  'rgba(15, 23, 42, 0.12)',

  // ── Text
  TEXT:   '#0F172A',   // slate-900 — primary text
  TEXT2:  '#334155',   // slate-700 — secondary text
  TEXT3:  '#64748B',   // slate-500 — tertiary / placeholder

  // ── Input
  INPUT_BG:     '#FFFFFF',
  INPUT_BORDER: '#CBD5E1',   // slate-300 border for high visibility

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
  DARK_BG:         '#FFFFFF',
  DARK_SURFACE:    '#FFFFFF',
  DARK_CARD:       '#F4F6F8',
  GLASS:           'rgba(0,0,0,0.04)',
  GLASS_MID:       'rgba(0,0,0,0.06)',
  GLASS_HIGH:      'rgba(0,0,0,0.10)',
  GLASS_SURFACE:   'rgba(255,255,255,0.88)',
  GLASS_SURFACE_SOFT: 'rgba(255,255,255,0.72)',
  GLASS_SURFACE_STRONG: 'rgba(255,255,255,0.94)',
  YELLOW_SOFT:     '#FFF3B8',
  WARM_WHITE:      '#FFFFFF',
  JAHEEZ_LIGHT:    '#F4F6F8',
  HOME_DIM:        'rgba(28,28,30,0.10)',
  HOME_WHITE_BORDER: 'rgba(255,255,255,0.65)',
  HOME_YELLOW_SHADOW: 'rgba(245,197,24,0.24)',
  HOME_CARD_SHADOW: 'rgba(28,28,30,0.08)',
  HOME_FLOATING_SHADOW: 'rgba(28,28,30,0.14)',
  HOME_HERO_IMAGE: 'rgba(255,255,255,0.34)',
  HOME_GLASS_YELLOW: 'rgba(255,255,255,0.46)',
  HOME_GLASS_YELLOW_BORDER: 'rgba(255,255,255,0.56)',
  HOME_DARK_GLASS: 'rgba(28,28,30,0.08)',
  FOOD_SOFT:       '#FFF2F2',
  GROCERY_SOFT:    '#ECFDF5',
  PHARMACY_SOFT:   '#EFF6FF',
  PARCEL_SOFT:     '#EEF6FF',
  ERRAND_SOFT:     '#FFF1F8',
  SHOP_SOFT:       '#F5F3FF',
  GIFT_SOFT:       '#FFE3EC',
  GLASS_BORDER:    'rgba(0, 0, 0, 0.04)',
  GLASS_BORDER_ACTIVE: 'rgba(240,48,48,0.40)',
  TEXT_ON_DARK:  '#0F172A',
  TEXT_ON_DARK2: '#334155',
  TEXT_ON_DARK3: '#64748B',
  ERROR_RED:     '#DC2626',
} as const;

// ── Gradient Presets (use with expo-linear-gradient)
export const GRADIENTS = {
  PRIMARY:  ['#E8202A', '#B5141C'] as const,
  YELLOW:   ['#F5C518', '#D4A20E'] as const,
  SUCCESS:  ['#2DB87A', '#1A8F5B'] as const,
  HERO:     ['#E8202A', '#B5141C'] as const,

  // ── Crimson Glass Design System
  CRIMSON_HERO:    ['#7F1D1D', '#B91C1C', '#F03030'] as const,
  CRIMSON_CARD:    ['#991B1B', '#7F1D1D'] as const,
  MIDNIGHT_WINE:   ['#4C0519', '#7F1D1D'] as const,

  // Light warm gradients
  WARM_BG:      ['#FFFFFF', '#FAFAFA'] as const,
  RED_SOFT:     ['#FDEAEA', '#FFF5F5'] as const,
  YELLOW_SOFT:  ['#FFFBEE', '#FFF8D6'] as const,
} as const;

import { Platform } from 'react-native';

// ── Fonts
export const FONTS = {
  DISPLAY:   Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  BODY:      Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  MEDIUM:    Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  SEMIBOLD:  Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  MONO:      Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  MONO_BOLD: Platform.select({ ios: 'Courier-Bold', android: 'monospace', default: 'monospace' }),
} as const;

// Pixel-match UI tokens for the customer app reference screens.
export const JUI = {
  SCREEN_PAD: 20,
  SCREEN_PAD_LG: 24,
  BG: '#FFFFFF',
  BORDER_SOFT: 'rgba(120,90,55,0.025)',
  CARD_RADIUS: 22,
  CARD_RADIUS_LG: 28,
  BUTTON_RADIUS: 18,
  HEADER_BUTTON: 49,
  HEADER_BUTTON_RADIUS: 17,
  TAB_BAR_HEIGHT: 68,
  TAB_BAR_RADIUS: 34,
  ICON_SM: 16,
  ICON_MD: 20,
  ICON_LG: 28,
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
  BUTTON_HEIGHT: 50,
  INPUT_HEIGHT:  52,
  NAV_HEIGHT:    52,
  TAB_HEIGHT:    60,
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

// ── Shadows — Bolt-inspired ultra-light modern shadows
export const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 1,
} as const;

export const SHADOW_SM = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 4,
  elevation: 1,
} as const;

export const SHADOW_LG = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 16,
  elevation: 3,
} as const;

export const SHADOW_RED = {
  shadowColor: '#E8202A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.20,
  shadowRadius: 12,
  elevation: 4,
} as const;

export const SHADOW_YELLOW = {
  shadowColor: '#F5C518',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 12,
  elevation: 3,
} as const;

export const SHADOW_DARK = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 20,
  elevation: 5,
} as const;

// ── Animation Timings (ms)
export const ANIM = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
  SPRING: { damping: 14, stiffness: 150 },
  SPRING_BOUNCY: { damping: 10, stiffness: 180 },
} as const;

// ── Layout Spacing
export const LAYOUT = {
  CARD_GAP: 12,
  SECTION_GAP: 28,
  SCREEN_PAD: 20,
  HEADER_COLLAPSED: 56,
  HEADER_EXPANDED: 120,
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
