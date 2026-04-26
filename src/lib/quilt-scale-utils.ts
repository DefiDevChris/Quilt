/**
 * Quilt Scale Utilities — proportional resize after the layout has been
 * locked by "Start Designing".
 *
 * Pre-lock the user picks dimensions freely (free-form size picker, layout
 * sliders, template fixed size). Post-lock the spec only allows scaling
 * the whole quilt to other sizes that:
 *
 *   • preserve the original aspect ratio,
 *   • land on multiples of 0.25″ on both axes (so every piece stays on
 *     the ¼″ grid),
 *   • keep all pieces in even sizes (a consequence of ¼″ alignment).
 *
 * This module produces a finite, validated set of scale options for the
 * UI to surface — no arbitrary freeform resize, no rounding cliff.
 */

const QUARTER_INCH = 0.25;
const SCALE_FACTOR_EPSILON = 1e-6;

/** A scale option presented to the user — preserves aspect ratio exactly. */
export interface QuiltScaleOption {
  /** Multiplier relative to the locked-in (base) size, e.g. 1.5 for 150 %. */
  readonly factor: number;
  /** Resulting width in inches (always a multiple of 0.25). */
  readonly width: number;
  /** Resulting height in inches (always a multiple of 0.25). */
  readonly height: number;
  /** Human label, e.g. "100% · 48″ × 60″". */
  readonly label: string;
  /** True when this option is the current dimensions. */
  readonly isCurrent: boolean;
}

/**
 * Round to a multiple of 0.25 with a tight tolerance band, returning null
 * when the input doesn't fall cleanly onto the grid. We don't snap silently
 * here — silent snapping is exactly the behaviour the spec forbids.
 */
function snapToQuarter(value: number): number | null {
  const ratio = value / QUARTER_INCH;
  const rounded = Math.round(ratio);
  if (Math.abs(ratio - rounded) > SCALE_FACTOR_EPSILON * 1e3) {
    return null;
  }
  return rounded * QUARTER_INCH;
}

/**
 * Approximate equality for floating-point dimension comparisons. The spec
 * works in 0.25″ increments so we use 0.001″ — well below the smallest
 * possible legal step.
 */
function dimensionsEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.001;
}

/**
 * Generate the validated set of scale options for a base (locked-in)
 * quilt. Only options whose width and height are both multiples of 0.25″
 * are returned, so every option keeps the entire quilt on the ¼″ grid
 * (and therefore every piece on an "even" size).
 *
 * The factors include the canonical 50 / 75 / 100 / 125 / 150 / 175 / 200
 * percentages, plus an extra 90 / 110 set for fine adjustments. Factors
 * that don't land on the grid are silently dropped — for typical whole-
 * inch base dimensions all of them survive; for a 51″ × 67″ quilt some
 * will not, which is the correct behaviour.
 */
export function getQuiltScaleOptions(
  baseWidth: number,
  baseHeight: number,
  currentWidth: number,
  currentHeight: number,
): QuiltScaleOption[] {
  const factors = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

  const options: QuiltScaleOption[] = [];
  for (const factor of factors) {
    const scaledWidth = snapToQuarter(baseWidth * factor);
    const scaledHeight = snapToQuarter(baseHeight * factor);
    if (scaledWidth == null || scaledHeight == null) continue;
    if (scaledWidth <= 0 || scaledHeight <= 0) continue;

    options.push({
      factor,
      width: scaledWidth,
      height: scaledHeight,
      label: `${Math.round(factor * 100)}% · ${formatInches(scaledWidth)} × ${formatInches(scaledHeight)}`,
      isCurrent:
        dimensionsEqual(scaledWidth, currentWidth) &&
        dimensionsEqual(scaledHeight, currentHeight),
    });
  }

  return options;
}

/**
 * Apply a scale option to the existing (locked) dimensions and return the
 * new pair, snapped to ¼″. Returns null when the option would land off
 * the grid — caller should never see this in practice because options are
 * pre-validated, but we defend in depth.
 */
export function applyScaleOption(
  baseWidth: number,
  baseHeight: number,
  factor: number,
): { width: number; height: number } | null {
  const w = snapToQuarter(baseWidth * factor);
  const h = snapToQuarter(baseHeight * factor);
  if (w == null || h == null || w <= 0 || h <= 0) return null;
  return { width: w, height: h };
}

function formatInches(value: number): string {
  // 24 → "24″", 24.5 → "24½″", 24.25 → "24¼″", 24.75 → "24¾″"
  const whole = Math.trunc(value);
  const fraction = value - whole;
  if (Math.abs(fraction) < 0.001) return `${whole}″`;
  if (Math.abs(fraction - 0.25) < 0.001) return `${whole}¼″`;
  if (Math.abs(fraction - 0.5) < 0.001) return `${whole}½″`;
  if (Math.abs(fraction - 0.75) < 0.001) return `${whole}¾″`;
  return `${value.toFixed(2)}″`;
}
