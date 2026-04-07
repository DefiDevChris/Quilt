import type { LayoutPreset } from './layout-library';

export const STANDARD_BLOCK_SIZES = [6, 8, 10, 12, 14, 16] as const;

export type StandardBlockSize = (typeof STANDARD_BLOCK_SIZES)[number];

export function snapToStandardBlockSize(blockSize: number): number {
  return STANDARD_BLOCK_SIZES.reduce((prev, curr) =>
    Math.abs(curr - blockSize) < Math.abs(prev - blockSize) ? curr : prev
  );
}

export function computeLayoutSize(
  preset: LayoutPreset,
  blockSize: number,
  rotated: boolean = false
): { width: number; height: number } {
  const rows = rotated ? preset.config.cols : preset.config.rows;
  const cols = rotated ? preset.config.rows : preset.config.cols;

  const sashingWidth = preset.config.sashing?.width || 0;
  const sashingHeight = preset.config.sashing?.width || sashingWidth;

  const totalBorder =
    (preset.config.borders || []).reduce((acc: number, b: any) => acc + (b.width || 0), 0) * 2;

  const width = cols * blockSize + Math.max(0, cols - 1) * sashingWidth + totalBorder;
  const height = rows * blockSize + Math.max(0, rows - 1) * sashingHeight + totalBorder;

  return { width, height };
}

export function computeTemplateSize(
  template: any,
  blockSize: number,
  rotated: boolean = false
): { width: number; height: number } {
  let rows = template.templateData?.grid?.rows || 1;
  let cols = template.templateData?.grid?.cols || 1;

  if (rotated) {
    const temp = rows;
    rows = cols;
    cols = temp;
  }

  const sashingWidth = template.templateData?.sashing?.width || 0;
  const sashingHeight = template.templateData?.sashing?.height ?? sashingWidth;
  const totalBorder =
    (template.templateData?.borders || []).reduce(
      (acc: number, b: any) => acc + (b.width || b.size || 0),
      0
    ) * 2;

  const width = cols * blockSize + Math.max(0, cols - 1) * sashingWidth + totalBorder;
  const height = rows * blockSize + Math.max(0, rows - 1) * sashingHeight + totalBorder;

  return { width, height };
}
