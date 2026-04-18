/**
 * Design System — single source of truth for all QuiltCorgi brand values.
 *
 * Reads from brand_config.json at build time and exports typed constants.
 * Every color, spacing, opacity, rotation, and size used across the app
 * MUST come from this module — zero hardcoded values.
 */

import brandConfig from '../../brand_config.json';

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Converts a hex color + alpha to an rgba string.
 * e.g. withAlpha('#f08060', 0.12) → 'rgba(255, 141, 73, 0.12)'
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
 * e.g. darkenHex('#f08060', 0.1) → darker orange
 */
function darkenHex(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ─── Colors ───────────────────────────────────────────────────────────

const { color_palette: cp } = brandConfig;
const cc = brandConfig.canvas_colors;
const fc = brandConfig.fence_colors;
const sc = brandConfig.shade_colors;
const pp = brandConfig.pattern_preview_colors;
const dc = brandConfig.default_canvas;
const dl = brandConfig.default_layout;
const gc = brandConfig.grid_colors;
const func = brandConfig.functional_colors;
const comp = brandConfig.computed_colors;
const ac = brandConfig.alpha_colors;

export const COLORS = {
  primary: cp.primary,
  secondary: cp.secondary,
  accent: cp.accent,
  bg: cp.bg,
  surface: cp.surface,
  text: cp.text,
  textDim: cp.text_dim,
  border: cp.border,
  error: func.error,
  success: func.success,
  fabricFallback: func.fabric_fallback,
  fabricGridMockBg: func.fabric_grid_mock_bg,
  mockSurfaceBg: func.mock_surface_bg,
} as const;

// Computed hover variants (primary darkened for hover state)
export const COLORS_HOVER = {
  primary: comp.primary_hover,
} as const;

// ─── Canvas / Tool Colors ────────────────────────────────────────────

export const CANVAS = {
  gridLine: cc.grid_line,
  seamLine: cc.seam_line,
  pencilPreview: cc.pencil_preview,
  patchHover: cc.patch_hover,
  blockHighlight: cc.block_highlight,
  fabricHighlight: cc.fabric_highlight,
  strokeDefault: cc.stroke_default,
  fenceLabelBg: withAlpha(ac.canvas.fence_label_bg.hex, ac.canvas.fence_label_bg.alpha),
  fenceLabelBgLight: withAlpha(
    ac.canvas.fence_label_bg_light.hex,
    ac.canvas.fence_label_bg_light.alpha
  ),
  selectionHighlight: withAlpha(
    ac.canvas.selection_highlight.hex,
    ac.canvas.selection_highlight.alpha
  ),
  gridLineDimmed: withAlpha(ac.canvas.grid_line_dimmed.hex, ac.canvas.grid_line_dimmed.alpha),
  calibrationBackdrop: withAlpha(
    ac.canvas.calibration_backdrop.hex,
    ac.canvas.calibration_backdrop.alpha
  ),
  dotIndicatorInactive: withAlpha(
    ac.canvas.dot_indicator_inactive.hex,
    ac.canvas.dot_indicator_inactive.alpha
  ),
  mockGridBg: withAlpha(ac.canvas.mock_grid_bg.hex, ac.canvas.mock_grid_bg.alpha),
  mockQuiltStitch: cc.mock_quilt_stitch,
} as const;

// ─── Fence Role Colors ───────────────────────────────────────────────

export const FENCE = fc as typeof fc;

// ─── Shade Colors ────────────────────────────────────────────────────

export const SHADE = {
  dark: sc.dark,
  light: sc.light,
  background: sc.background,
  unknown: sc.unknown,
} as const;

// ─── Pattern Preview Colors ──────────────────────────────────────────

export const PATTERN_PREVIEW = {
  fill: pp.fill,
  stroke: pp.stroke,
  accent: pp.accent,
} as const;

// ─── Default Canvas Colors ───────────────────────────────────────────

export const DEFAULT_CANVAS = {
  fill: dc.fill,
  stroke: dc.stroke,
} as const;

// ─── Default Layout Colors ───────────────────────────────────────────

export const DEFAULT_LAYOUT = {
  sashing: dl.sashing,
  border: dl.border,
} as const;

// ─── Grid / Measurement Colors ───────────────────────────────────────

export const GRID = {
  bg: gc.bg,
  label: gc.label,
  border: gc.border,
} as const;

// ─── Typography ───────────────────────────────────────────────────────

const { scale: ts } = brandConfig.typography;

export const FONT_SIZE = {
  h1: ts.h1.size,
  h1LineHeight: ts.h1.line_height,
  h2: ts.h2.size,
  h2LineHeight: ts.h2.line_height,
  h3: ts.h3.size,
  h3LineHeight: ts.h3.line_height,
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
const FONT_HEADING = 'Noto Serif';
const FONT_BODY = 'Montserrat';

export const TYPOGRAPHY = {
  h1: {
    fontSize: ts.h1.size,
    lineHeight: ts.h1.line_height,
    fontFamily: FONT_HEADING,
    tailwind: ts.h1.tailwind,
  },
  h2: {
    fontSize: ts.h2.size,
    lineHeight: ts.h2.line_height,
    fontFamily: FONT_HEADING,
    tailwind: ts.h2.tailwind,
  },
  h3: {
    fontSize: ts.h3.size,
    lineHeight: ts.h3.line_height,
    fontFamily: FONT_HEADING,
    tailwind: ts.h3.tailwind,
  },
  body: {
    fontSize: ts.body.size,
    lineHeight: ts.body.line_height,
    fontFamily: FONT_BODY,
    tailwind: ts.body.tailwind,
  },
  small: {
    fontSize: ts.small.size,
    lineHeight: ts.small.line_height,
    fontFamily: FONT_BODY,
    tailwind: ts.small.tailwind,
  },
  label: {
    fontSize: ts.label.size,
    lineHeight: ts.label.line_height,
    fontFamily: FONT_BODY,
    tailwind: ts.label.tailwind,
  },
} as const;

// ─── Layout ───────────────────────────────────────────────────────────

const { layout: l } = brandConfig.design_system;

export const LAYOUT = {
  containerMax: l.container_max,
  gutter: l.gutter,
  baseSpacing: parseInt(l.base_spacing, 10),
  sidebarWidth: l.sidebar_width,
  headerHeight: l.header_height,
  contextPanelWidth: '320px',
  toolbarWidth: '88px',
  dialogSm: '380px',
  dialogMd: '440px',
  dialogLg: '560px',
  helpPanelWidth: '340px',
  modalMaxHeight: '90vh',
} as const;

// ─── Motion ───────────────────────────────────────────────────────────

export const MOTION = {
  transitionDuration: 150,
  transitionEasing: 'ease-out',
} as const;

// ─── Shadow ───────────────────────────────────────────────────────────

export const SHADOW = {
  brand: `0 1px 2px ${withAlpha(ac.shadows.brand.hex, ac.shadows.brand.alpha)}`,
  elevated: `0 4px 8px ${withAlpha(ac.shadows.elevated_outer.hex, ac.shadows.elevated_outer.alpha)}, 0 12px 32px ${withAlpha(ac.shadows.elevated_outer_deep.hex, ac.shadows.elevated_outer_deep.alpha)}`,
  inset: `inset 0 2px 8px ${withAlpha(ac.shadows.inset_inner.hex, ac.shadows.inset_inner.alpha)}, inset 0 1px 3px ${withAlpha(ac.shadows.inset_inner_subtle.hex, ac.shadows.inset_inner_subtle.alpha)}`,
} as const;

// ─── Decoration ─────────────────────────────────────────────────────

export const DECORATION = {
  defaultOpacity: 12,
  stitchColor: 'var(--color-text)',
} as const;

// ─── Mascots ──────────────────────────────────────────────────────────

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

// ─── Assets ───────────────────────────────────────────────────────────

export const ASSETS = {
  logo: brandConfig.public_assets.logo,
  mascots: brandConfig.public_assets.mascots,
  icons: brandConfig.public_assets.icons.path,
} as const;

// ─── Radius ───────────────────────────────────────────────────────────

export const RADIUS = {
  full: '9999px',
  lg: '8px',
} as const;

// ─── Opacity ──────────────────────────────────────────────────────────

export const OPACITY = {
  disabled: 0.5,
  dim: 0.6,
  overlay: 0.2,
  fencePreview: 0.3,
  'background-image': 0.05,
  reviewOverlay: 0.35,
} as const;

// ─── Z-Index ─────────────────────────────────────────────────────────

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

// ─── Breakpoints ─────────────────────────────────────────────────────

export const BREAKPOINTS = {
  mobile: 768,
} as const;

// ─── Exports for external use ─────────────────────────────────────────

export { withAlpha, darkenHex };

