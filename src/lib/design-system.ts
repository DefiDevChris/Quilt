/**
 * Design System — single source of truth for all QuiltCorgi brand values.
 *
 * Brand-identity tokens (palette, typography, layout) come from
 * `brand_config.json`. Studio-internal tokens (canvas/fence/grid/shade colors,
 * pattern preview, etc.) are defined inline here because they are
 * implementation details rather than brand-facing values.
 */

import brandConfig from '../../brand_config.json';

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Converts a hex color + alpha to an rgba string.
 * e.g. withAlpha('#7CB9E8', 0.12) → 'rgba(124, 185, 232, 0.12)'
 */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Darkens a hex color by a given amount (0-1).
 * e.g. darkenHex('#7CB9E8', 0.1) → darker sky blue
 */
function darkenHex(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ─── Colors ─────────────────────────────────────────────────────────────

const cp = brandConfig.color_palette;
const comp = brandConfig.computed_colors;

export const COLORS = {
  primary: cp.primary,
  secondary: cp.secondary,
  accent: cp.accent,
  accentBlush: cp.accent_blush,
  bg: cp.bg,
  surface: cp.surface,
  text: cp.text,
  textDim: cp.text_dim,
  border: cp.border,
  error: comp.error,
  success: comp.success,
  warning: comp.warning,
  fabricFallback: '#b8a698',
  fabricGridMockBg: '#f5f0e8',
  mockSurfaceBg: comp.surface_alt,
} as const;

// Computed hover variants (primary darkened for hover state)
export const COLORS_HOVER = {
  primary: comp.primary_hover,
} as const;

// ─── Canvas / Tool Colors ──────────────────────────────────────────────────

export const CANVAS = {
  gridLine: '#E6E1DC',
  seamLine: '#7A726C',
  pencilPreview: '#7CB9E8',
  patchHover: '#C5DFF3',
  blockHighlight: '#7CB9E8',
  fabricHighlight: '#FFE08A',
  strokeDefault: '#36312D',
  fenceLabelBg: withAlpha('#FEFDFB', 0.92),
  fenceLabelBgLight: withAlpha('#ffffff', 0.85),
  selectionHighlight: withAlpha('#7CB9E8', 0.18),
  gridLineDimmed: withAlpha('#E6E1DC', 0.4),
  calibrationBackdrop: withAlpha('#36312D', 0.6),
  dotIndicatorInactive: withAlpha('#7A726C', 0.3),
  mockGridBg: withAlpha('#F5EDE4', 0.5),
  mockQuiltStitch: '#7A726C',
} as const;

// ─── Fence Role Colors ────────────────────────────────────────────────────
// `normal` fills/strokes are the solid colors used while editing.
// `preview` fills/strokes are dashed/transparent — used in preview mode.

export const FENCE = {
  normal: {
    fills: {
      'block-cell': withAlpha('#7CB9E8', 0.10),
      'setting-triangle': withAlpha('#C5DFF3', 0.18),
      sashing: withAlpha('#C5DFF3', 0.30),
      border: withAlpha('#FFE08A', 0.18),
      cornerstone: withAlpha('#F6C6C8', 0.20),
      binding: withAlpha('#7A726C', 0.10),
    },
    strokes: {
      'block-cell': '#7CB9E8',
      'setting-triangle': '#C5DFF3',
      sashing: '#C5DFF3',
      border: '#FFE08A',
      cornerstone: '#F6C6C8',
      binding: '#7A726C',
    },
  },
  preview: {
    fills: {
      'block-cell': 'transparent',
      'setting-triangle': 'transparent',
      sashing: withAlpha('#C5DFF3', 0.12),
      border: withAlpha('#FFE08A', 0.10),
      cornerstone: withAlpha('#F6C6C8', 0.10),
      binding: withAlpha('#7A726C', 0.05),
    },
    strokes: {
      'block-cell': withAlpha('#7CB9E8', 0.50),
      'setting-triangle': withAlpha('#C5DFF3', 0.40),
      sashing: withAlpha('#C5DFF3', 0.60),
      border: withAlpha('#FFE08A', 0.50),
      cornerstone: withAlpha('#F6C6C8', 0.50),
      binding: withAlpha('#7A726C', 0.40),
    },
  },
  // Legacy single-role colors (deprecated — prefer `normal.fills[role]`).
  block: '#7CB9E8',
  sashing: '#C5DFF3',
  border: '#FFE08A',
  cornerstone: '#F6C6C8',
  binding: '#7A726C',
  defaultColor: '#E6E1DC',
} as const;

// ─── Shade Colors ──────────────────────────────────────────────────────────────────

export const SHADE = {
  dark: '#36312D',
  light: '#F5F0E8',
  background: '#FEFDFB',
  unknown: '#7A726C',
} as const;

// ─── Pattern Preview Colors ───────────────────────────────────────────────────────

export const PATTERN_PREVIEW = {
  fill: '#FEFDFB',
  stroke: '#36312D',
  accent: '#7CB9E8',
} as const;

// ─── Default Canvas Colors ──────────────────────────────────────────────────────

export const DEFAULT_CANVAS = {
  fill: '#FEFDFB',
  stroke: '#E6E1DC',
} as const;

// ─── Default Layout Colors ──────────────────────────────────────────────────────

export const DEFAULT_LAYOUT = {
  sashing: '#C5DFF3',
  border: '#FFE08A',
} as const;

// ─── Grid / Measurement Colors ───────────────────────────────────────────────────

export const GRID = {
  bg: '#FEFDFB',
  label: '#7A726C',
  border: '#E6E1DC',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

const ts = brandConfig.design_system.typography.scale;

export const FONT_SIZE = {
  h1: ts['3xl'],
  h1LineHeight: '1.2',
  h2: ts['2xl'],
  h2LineHeight: '1.3',
  h3: ts.xl,
  h3LineHeight: '1.4',
  body: '18px',
  bodyLineHeight: '28px',
  small: '16px',
  smallLineHeight: '24px',
  label: '14px',
  labelLineHeight: '20px',
} as const;

export const SPACING = {
  button: 'px-6 py-2',
  buttonSm: 'px-4 py-2',
  input: 'px-4 py-2.5',
  inputSm: 'px-3 py-1.5',
  card: 'p-6',
  dialog: 'p-8',
} as const;

// Fonts are defined in globals.css via CSS variables - CSS is the source of truth
const FONT_HEADING = 'Noto Sans';
const FONT_BODY = 'Montserrat';

export const TYPOGRAPHY = {
  h1: {
    fontSize: ts['3xl'],
    lineHeight: '1.2',
    fontFamily: FONT_HEADING,
    tailwind: 'text-3xl',
  },
  h2: {
    fontSize: ts['2xl'],
    lineHeight: '1.3',
    fontFamily: FONT_HEADING,
    tailwind: 'text-2xl',
  },
  h3: {
    fontSize: ts.xl,
    lineHeight: '1.4',
    fontFamily: FONT_HEADING,
    tailwind: 'text-xl',
  },
  body: {
    fontSize: ts.base,
    lineHeight: '1.6',
    fontFamily: FONT_BODY,
    tailwind: 'text-base',
  },
  small: {
    fontSize: ts.sm,
    lineHeight: '1.5',
    fontFamily: FONT_BODY,
    tailwind: 'text-sm',
  },
  label: {
    fontSize: ts.sm,
    lineHeight: '1.4',
    fontFamily: FONT_BODY,
    tailwind: 'text-sm',
  },
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────

export const LAYOUT = {
  containerMax: '1280px',
  gutter: '24px',
  baseSpacing: 4,
  sidebarWidth: '256px',
  headerHeight: '64px',
  contextPanelWidth: '320px',
  toolbarWidth: '88px',
  dialogSm: '380px',
  dialogMd: '440px',
  dialogLg: '560px',
  helpPanelWidth: '340px',
  modalMaxHeight: '90vh',
} as const;

// Common max-widths for layout containers (page wrappers, content blocks)
export const MAX_WIDTHS = {
  page: '1280px',
  content: '720px',
  narrow: '560px',
  wide: '1440px',
} as const;

// ─── Motion ───────────────────────────────────────────────────────────────

export const MOTION = {
  transitionDuration: 150,
  transitionEasing: 'ease-out',
} as const;

// ─── Shadow ───────────────────────────────────────────────────────────────

export const SHADOW = {
  brand: `0 1px 2px ${withAlpha('#36312D', 0.08)}`,
  elevated: `0 4px 8px ${withAlpha('#36312D', 0.06)}, 0 12px 32px ${withAlpha('#36312D', 0.08)}`,
  inset: `inset 0 2px 8px ${withAlpha('#36312D', 0.04)}, inset 0 1px 3px ${withAlpha('#36312D', 0.06)}`,
} as const;

// ─── Decoration ─────────────────────────────────────────────────────────────

export const DECORATION = {
  defaultOpacity: 12,
  stitchColor: 'var(--color-text)',
} as const;

// ─── Mascots ────────────────────────────────────────────────────────────────

export const MASCOT = {
  positions: {
    1: [
      {
        pose: 'sitting' as const,
        size: 'lg' as const,
        position: { bottom: 32, right: 32 },
        opacity: 0.4,
      },
    ],
    2: [
      {
        pose: 'sitting' as const,
        size: 'lg' as const,
        position: { bottom: 32, right: 32 },
        opacity: 0.4,
      },
      {
        pose: 'wagging' as const,
        size: 'md' as const,
        position: { bottom: 32, left: 32 },
        opacity: 0.3,
      },
    ],
    3: [
      {
        pose: 'sitting' as const,
        size: 'lg' as const,
        position: { bottom: 32, right: 32 },
        opacity: 0.4,
      },
      {
        pose: 'wagging' as const,
        size: 'md' as const,
        position: { bottom: 32, left: 32 },
        opacity: 0.3,
      },
      {
        pose: 'walking' as const,
        size: 'sm' as const,
        position: { top: 96, right: 32 },
        opacity: 0.25,
      },
    ],
  },
  maxPerScreen: 1,
} as const;

// ─── Assets ───────────────────────────────────────────────────────────────

export const ASSETS = {
  logo: '/quilt-logo-white.png',
  mascots: {
    sitting: '/mascots/corgi-sitting.png',
    wagging: '/mascots/corgi-wagging.png',
    walking: '/mascots/corgi-walking.png',
  },
  icons: '/icons',
} as const;

// ─── Radius ───────────────────────────────────────────────────────────────

export const RADIUS = {
  full: '9999px',
  lg: '8px',
} as const;

// ─── Opacity ───────────────────────────────────────────────────────────────

export const OPACITY = {
  disabled: 0.5,
  dim: 0.6,
  overlay: 0.2,
  fencePreview: 0.3,
  'background-image': 0.05,
  reviewOverlay: 0.35,
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────

export const Z_INDEX = {
  base: 0,
  behind: -10,
  dropdown: 50,
  panel: 40,
  overlay: 9999,
  topBar: 10,
  feedTabs: 9,
  contextMenu: 60,
  toast: 100,
  modal: 70,
} as const;

// ─── Breakpoints ─────────────────────────────────────────────────────────────

export const BREAKPOINTS = {
  mobile: 768,
} as const;

// ─── Exports for external use ────────────────────────────────────────────────────

export { withAlpha, darkenHex };
