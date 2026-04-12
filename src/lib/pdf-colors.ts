/**
 * PDF Color Utilities — design system colors converted to pdf-lib rgb() format.
 *
 * pdf-lib uses rgb(r, g, b) where each channel is 0-1.
 * All colors come from design-system.ts, converted at build time.
 */

import { rgb, type RGB } from 'pdf-lib';
import { COLORS } from './design-system';

/** Convert a hex string (#rrggbb) to pdf-lib RGB (0-1 range). */
function hexToPdfRgb(hex: string): RGB {
  const sanitized = hex.replace('#', '');
  const r = parseInt(sanitized.substring(0, 2), 16) / 255;
  const g = parseInt(sanitized.substring(2, 4), 16) / 255;
  const b = parseInt(sanitized.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

// ── Brand Colors ──

export const PDF_COLOR = {
  primary: hexToPdfRgb(COLORS.primary),
  surface: hexToPdfRgb(COLORS.surface),
  text: hexToPdfRgb(COLORS.text),
  textDim: hexToPdfRgb(COLORS.textDim),
  border: hexToPdfRgb(COLORS.border),
} as const;

// ── Semantic PDF Colors ──

export const PDF_SEMANTIC = {
  // Black / text
  black: rgb(0, 0, 0),
  charcoal: rgb(0.15, 0.15, 0.15), // #262626 — section headers
  darkGray: rgb(0.2, 0.2, 0.2), // #333333 — body text
  mediumGray: rgb(0.3, 0.3, 0.3), // #4d4d4d — secondary text / labels
  midGray: rgb(0.4, 0.4, 0.4), // #666666 — muted text / table headers
  lightGray: rgb(0.5, 0.5, 0.5), // #808080 — disabled / subtle elements
  borderGray: rgb(0.7, 0.7, 0.7), // #b3b3b3 — borders / rules
  white: rgb(1, 1, 1),

  // Cut line vs sew line colors for PDF patterns
  cutLine: rgb(0, 0, 0), // solid black = cut
  sewLine: rgb(0.5, 0.5, 0.5), // dashed gray = sew
} as const;
