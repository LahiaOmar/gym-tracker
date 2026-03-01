/**
 * Brand colors and typography for the app.
 * Primary: Performance Blue (Navy), Action Orange, Clean White.
 * Secondary: Slate Gray (Soft/Medium), Rich Black, Success Green.
 */

import { Platform } from 'react-native';

// —— Brand palette ——
export const BrandColors = {
  /** Primary blue — selected states, links, profile accent */
  primary: '#1152D4',
  /** Headers, top sections, high-contrast backgrounds */
  navy: '#1E293B',
  /** Deep navy — profile header, dark surfaces */
  navyDeep: '#0F172A',
  /** Performance blue — hero header (design) */
  performanceBlue: '#0A1D37',
  /** Primary CTAs: Start Workout, Finish, Add Set */
  action: '#F97316',
  /** Performance accent orange (design) */
  performanceAccent: '#FF6B00',
  /** Content cards, data backgrounds, text on dark headers */
  white: '#FFFFFF',
  /** Main app background behind cards */
  backgroundSoft: '#F1F5F9',
  /** iOS-style background (design) */
  iosBg: '#F2F2F7',
  /** Secondary text, labels, icons */
  slate: '#64748B',
  /** Main headings and primary body text on white */
  text: '#0F172A',
  /** Dark grey for headings (design) */
  darkGrey: '#1C1C1E',
  /** Positive trends, completed sets */
  success: '#22C55E',
  /** Danger zone, destructive actions */
  danger: '#DC2626',
  /** Card borders, inputs */
  border: '#E2E8F0',
  /** Pressed/hover secondary */
  pressed: '#F8FAFC',
  /** Light page background (profile, cards) */
  backgroundLight: '#F6F6F8',
  /** Dark page background */
  backgroundDark: '#101622',
  /** Slate muted (subtitles, labels) */
  slate400: '#94A3B8',
  /** Red tint for danger zone background */
  dangerBgLight: '#FEF2F2',
  dangerBgDark: 'rgba(127, 29, 29, 0.2)',
  dangerBorderLight: '#FECACA',
  dangerBorderDark: 'rgba(127, 29, 29, 0.3)',
  /** Danger zone message text in dark mode (red-400) */
  dangerTextDark: '#F87171',
  /** Dark mode: segment track, card borders (slate-800) */
  slate800: '#1E293B',
  /** Dark mode: selected segment (slate-700) */
  slate700: '#334155',
  /** Dark mode: cards (slate-900) */
  slate900: '#0F172A',
} as const;

const tintColorLight = BrandColors.action;
const tintColorDark = BrandColors.action;

export const Colors = {
  light: {
    text: BrandColors.text,
    textSecondary: BrandColors.slate,
    background: BrandColors.backgroundSoft,
    card: BrandColors.white,
    tint: tintColorLight,
    icon: BrandColors.slate,
    tabIconDefault: BrandColors.slate,
    tabIconSelected: tintColorLight,
    header: BrandColors.navy,
    action: BrandColors.action,
    success: BrandColors.success,
    danger: BrandColors.danger,
    border: BrandColors.border,
    link: BrandColors.action,
  },
  dark: {
    text: BrandColors.white,
    textSecondary: BrandColors.slate400,
    background: BrandColors.backgroundDark,
    card: BrandColors.slate900,
    tint: tintColorDark,
    icon: BrandColors.slate400,
    tabIconDefault: BrandColors.slate400,
    tabIconSelected: tintColorDark,
    header: BrandColors.navyDeep,
    action: BrandColors.action,
    success: BrandColors.success,
    danger: BrandColors.danger,
    border: BrandColors.slate800,
    link: BrandColors.action,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    sansBold: 'System',
    sansMedium: 'System',
    rounded: 'System',
  },
  android: {
    sans: 'System',
    sansBold: 'System',
    sansMedium: 'System',
    rounded: 'System',
  },
  default: {
    sans: 'System',
    sansBold: 'System',
    sansMedium: 'System',
    rounded: 'System',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', Helvetica, Arial, sans-serif",
    sansBold: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', Helvetica, Arial, sans-serif",
    sansMedium: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', Helvetica, Arial, sans-serif",
    rounded: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
});

/** Font weights: Bold headers/primary buttons, Medium sub-headers, Regular body */
export const Typography = {
  /** Headers, primary buttons */
  bold: '700' as const,
  /** Sub-headers */
  medium: '500' as const,
  /** Body, data entry */
  regular: '400' as const,
  /** Slightly emphasized (labels, card titles) */
  semiBold: '600' as const,
};
