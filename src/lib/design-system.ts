/**
 * Design System — single source of truth for all QuiltCorgi brand values.
 *
 * Reads from brand_config.json at build time and exports typed constants.
 * Every color, spacing, opacity, rotation, and size used across the app
 * MUST come from this module — zero hardcoded values.
 */

import brandConfig from '../../brand_config.json';

// ─── Colors ───────────────────────────────────────────────────────────

const { color_palette: cp } = brandConfig;

export const COLORS = {
  primary: cp.primary,       // #ff8d49
  secondary: cp.secondary,   // #ffc8a6
  accent: cp.accent,         // #ffc7c7
  bg: cp.bg,                 // #fdfaf7
  surface: cp.surface,       // #ffffff
  text: cp.text,             // #1a1a1a
  textDim: cp.text_dim,      // #4a4a4a
  border: cp.border,         // #d4d4d4
  error: '#ed4956',          // from globals.css --color-error
} as const;

// Computed hover variants (primary darkened for hover state)
export const COLORS_HOVER = {
  primary: '#e67d3f',
} as const;

// ─── Canvas / Tool Colors ────────────────────────────────────────────

export const CANVAS = {
  gridLine: '#E5E2DD',
  seamLine: '#4a3f35',
  pencilPreview: '#f9a06b',
  patchHover: '#f9a06b',
  blockHighlight: '#f9a06b',
  fabricHighlight: '#f9a06b',
} as const;

// ─── Fence Role Colors ───────────────────────────────────────────────

export const FENCE = {
  normal: {
    fills: {
      'block-cell': 'rgba(255, 255, 255, 0.6)',
      sashing: '#e8dbcf',
      cornerstone: '#e5d5c5',
      border: '#d5c8b8',
      binding: '#8a7c6f',
      edging: '#6b5d50',
    },
    strokes: {
      'block-cell': '#b8a698',
      sashing: '#b8a698',
      cornerstone: '#a89888',
      border: '#b8a698',
      binding: '#6b5d50',
      edging: '#4a3f35',
    },
  },
  preview: {
    fills: {
      'block-cell': 'rgba(249, 160, 107, 0.15)',
      sashing: 'rgba(138, 124, 111, 0.15)',
      cornerstone: 'rgba(138, 124, 111, 0.12)',
      border: 'rgba(249, 160, 107, 0.15)',
      binding: 'rgba(249, 160, 107, 0.10)',
      edging: 'rgba(0, 0, 0, 0.08)',
    },
    strokes: {
      'block-cell': 'rgba(249, 160, 107, 0.4)',
      sashing: 'rgba(138, 124, 111, 0.4)',
      cornerstone: 'rgba(138, 124, 111, 0.35)',
      border: 'rgba(249, 160, 107, 0.4)',
      binding: 'rgba(249, 160, 107, 0.3)',
      edging: 'rgba(0, 0, 0, 0.2)',
    },
  },
} as const;

// ─── Shade Colors ────────────────────────────────────────────────────

export const SHADE = {
  dark: '#505050',
  light: '#E0E0E0',
  background: '#F5F5F5',
  unknown: '#CCCCCC',
} as const;

// ─── Pattern Preview Colors ──────────────────────────────────────────

export const PATTERN_PREVIEW = {
  fill: '#E5E2DD',
  stroke: '#c0b8ae',
  accent: '#8B7355',
} as const;

// ─── Default Canvas Colors ───────────────────────────────────────────

export const DEFAULT_CANVAS = {
  fill: '#ffc8a6',
  stroke: '#4a3f35',
} as const;

// ─── Default Layout Colors ───────────────────────────────────────────

export const DEFAULT_LAYOUT = {
  sashing: '#e5d5c5',
  border: '#4a3f35',
} as const;

// ─── Grid / Measurement Colors ───────────────────────────────────────

export const GRID = {
  /** Background fill outside canvas area */
  bg: '#f5ede5',
  /** Dimension label text and corner mark color */
  label: '#6b5d50',
  /** Quilt border stroke */
  border: '#b8a698',
} as const;

// ─── Typography ───────────────────────────────────────────────────────

const { scale: ts } = brandConfig.typography;

export const TYPOGRAPHY = {
  h1: {
    fontSize: ts.h1.size,
    lineHeight: ts.h1.line_height,
    fontFamily: brandConfig.typography.heading_font,
    tailwind: ts.h1.tailwind,
  },
  h2: {
    fontSize: ts.h2.size,
    lineHeight: ts.h2.line_height,
    fontFamily: brandConfig.typography.heading_font,
    tailwind: ts.h2.tailwind,
  },
  h3: {
    fontSize: ts.h3.size,
    lineHeight: ts.h3.line_height,
    fontFamily: brandConfig.typography.heading_font,
    tailwind: ts.h3.tailwind,
  },
  body: {
    fontSize: ts.body.size,
    lineHeight: ts.body.line_height,
    fontFamily: brandConfig.typography.body_font,
    tailwind: ts.body.tailwind,
  },
  small: {
    fontSize: ts.small.size,
    lineHeight: ts.small.line_height,
    fontFamily: brandConfig.typography.body_font,
    tailwind: ts.small.tailwind,
  },
  label: {
    fontSize: ts.label.size,
    lineHeight: ts.label.line_height,
    fontFamily: brandConfig.typography.body_font,
    tailwind: ts.label.tailwind,
  },
} as const;

// ─── Layout ───────────────────────────────────────────────────────────

const { layout: l } = brandConfig.design_system;

export const LAYOUT = {
  containerMax: l.container_max,    // 1440px
  gutter: l.gutter,                 // 24px
  baseSpacing: parseInt(l.base_spacing, 10), // 8 (px)
  sidebarWidth: l.sidebar_width,    // 280px
  headerHeight: l.header_height,    // 64px
} as const;

// ─── Motion ───────────────────────────────────────────────────────────

export const MOTION = {
  transitionDuration: 150,          // ms
  transitionEasing: 'ease-out',
} as const;

// ─── Shadow ───────────────────────────────────────────────────────────

export const SHADOW = {
  brand: '0 1px 2px rgba(26, 26, 26, 0.08)',
} as const;

// ─── Decoration (QuiltPiece background elements) ──────────────────────

export const DECORATION = {
  /** The three QuiltPiece background decorations */
  quiltPieceBackgrounds: [
    {
      color: 'primary' as const,
      size: 900,
      rotation: 12,
      position: { top: -400, left: -350 },
      opacity: 12,
      strokeWidth: 5,
      stitchGap: 16,
    },
    {
      color: 'secondary' as const,
      size: 700,
      rotation: -8,
      position: { bottom: -300, right: -250 },
      opacity: 12,
      strokeWidth: 5,
      stitchGap: 16,
    },
    {
      color: 'accent' as const,
      size: 500,
      rotation: 5,
      position: { top: '40%', right: -150 },
      opacity: 8.4,  // 12 * 0.7
      strokeWidth: 4,
      stitchGap: 12,
    },
  ],
  /** Default opacity for page-level decoration (percentage 0-100) */
  defaultOpacity: 12,
  /** Stitch line color for decorations */
  stitchColor: 'var(--color-text)',
} as const;

// ─── Mascots ──────────────────────────────────────────────────────────

export const MASCOT = {
  /** Position configs for 1-3 mascot layouts */
  positions: {
    1: [
      { pose: 'sitting' as const, size: 'lg' as const, position: { bottom: 32, right: 32 }, opacity: 0.4 },
    ],
    2: [
      { pose: 'sitting' as const, size: 'lg' as const, position: { bottom: 32, right: 32 }, opacity: 0.4 },
      { pose: 'wagging' as const, size: 'md' as const, position: { bottom: 32, left: 32 }, opacity: 0.3 },
    ],
    3: [
      { pose: 'sitting' as const, size: 'lg' as const, position: { bottom: 32, right: 32 }, opacity: 0.4 },
      { pose: 'wagging' as const, size: 'md' as const, position: { bottom: 32, left: 32 }, opacity: 0.3 },
      { pose: 'walking' as const, size: 'sm' as const, position: { top: 96, right: 32 }, opacity: 0.25 },
    ],
  },
  /** Max mascots per screen per brand rules */
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
  full: '9999px',   // rounded-full — buttons, CTAs, tabs, filters, pills, avatars
  lg: '8px',         // rounded-lg — cards, containers, inputs, dialogs
} as const;
