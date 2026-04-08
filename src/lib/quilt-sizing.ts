/**
 * Pure sizing helpers used by the New Project wizard, the project create
 * route, and the studio bootstrap. No DOM, no Fabric, no React — fully
 * unit-testable.
 */
import type { LayoutPreset } from './layout-library';

export const STANDARD_BLOCK_SIZES = [6, 8, 10, 12, 14, 16] as const;

export type StandardBlockSize = (typeof STANDARD_BLOCK_SIZES)[number];

/**
 * Canonical shape for layout preset templateData JSONB.
 * Fields are intentionally optional — incomplete seeds gracefully fall
 * back to the row's stored finishedWidth/finishedHeight.
 */
export interface QuiltTemplateData {
  readonly category?: string;
  readonly gridRows?: number;
  readonly gridCols?: number;
  readonly defaultBlockSize?: number;
  readonly sashingWidth?: number;
  readonly hasCornerstones?: boolean;
  readonly borders?: ReadonlyArray<{ readonly width?: number; readonly position?: number }>;
  readonly bindingWidth?: number;
}

/**
 * Minimal subset of a layout preset that the sizing engine reads.
 * templateData is unknown and re-narrowed internally.
 */
export interface QuiltTemplateForSizing {
  readonly finishedWidth?: number | null;
  readonly finishedHeight?: number | null;
  readonly templateData: unknown;
}

export function snapToStandardBlockSize(blockSize: number): StandardBlockSize {
  return STANDARD_BLOCK_SIZES.reduce<StandardBlockSize>(
    (prev, curr) => (Math.abs(curr - blockSize) < Math.abs(prev - blockSize) ? curr : prev),
    STANDARD_BLOCK_SIZES[0]
  );
}

export function isStandardBlockSize(value: number): value is StandardBlockSize {
  return (STANDARD_BLOCK_SIZES as readonly number[]).includes(value);
}

interface BorderLike {
  readonly width?: number;
}

function sumBorderWidths(borders: ReadonlyArray<BorderLike> | undefined): number {
  if (!borders || borders.length === 0) return 0;
  return borders.reduce((acc, b) => acc + (typeof b.width === 'number' ? b.width : 0), 0);
}

/**
 * Compute the finished quilt dimensions for a layout preset at the given
 * block size. The aspect ratio is locked by the preset's rows × cols; the
 * `rotated` flag swaps them so non-square layouts can be flipped to
 * landscape orientation.
 */
export function computeLayoutSize(
  preset: LayoutPreset,
  blockSize: number,
  rotated: boolean = false
): { width: number; height: number } {
  const rows = rotated ? preset.config.cols : preset.config.rows;
  const cols = rotated ? preset.config.rows : preset.config.cols;

  const sashingWidth = preset.config.sashing?.width ?? 0;
  const totalBorder = sumBorderWidths(preset.config.borders) * 2;

  const width = cols * blockSize + Math.max(0, cols - 1) * sashingWidth + totalBorder;
  const height = rows * blockSize + Math.max(0, rows - 1) * sashingWidth + totalBorder;

  return { width, height };
}

function readTemplateData(template: QuiltTemplateForSizing): QuiltTemplateData | null {
  const raw = template.templateData;
  if (!raw || typeof raw !== 'object') return null;
  return raw as QuiltTemplateData;
}

/**
 * Compute the finished quilt dimensions for a quilt template at the given
 * block size. Falls back to the row's stored finishedWidth/finishedHeight
 * when templateData doesn't carry grid information.
 */
export function computeTemplateSize(
  template: QuiltTemplateForSizing,
  blockSize: number,
  rotated: boolean = false
): { width: number; height: number } {
  const data = readTemplateData(template);

  const rawRows = data?.gridRows ?? 0;
  const rawCols = data?.gridCols ?? 0;

  if (rawRows > 0 && rawCols > 0) {
    const rows = rotated ? rawCols : rawRows;
    const cols = rotated ? rawRows : rawCols;

    const sashingWidth = data?.sashingWidth ?? 0;
    const totalBorder = sumBorderWidths(data?.borders) * 2;

    const width = cols * blockSize + Math.max(0, cols - 1) * sashingWidth + totalBorder;
    const height = rows * blockSize + Math.max(0, rows - 1) * sashingWidth + totalBorder;
    return { width, height };
  }

  // Fallback: stored finishedWidth/finishedHeight if present.
  const fallbackW = template.finishedWidth ?? 60;
  const fallbackH = template.finishedHeight ?? 60;
  return rotated
    ? { width: fallbackH, height: fallbackW }
    : { width: fallbackW, height: fallbackH };
}
