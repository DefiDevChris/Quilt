/**
 * Layout Thumbnail Renderer
 *
 * Deterministic SVG render of layout configurations for thumbnails
 * in the LayoutsPanel. Renders Grid, Sashing, On-Point, Strippy, and
 * Medallion layout types.
 */

import type { LayoutType } from '@/lib/layout-utils';
import { LAYOUT_PRESETS, getLayoutPreset } from '@/lib/layout-library';
import { generateLayoutSvg } from '@/lib/layout-svg';

interface LayoutThumbnailProps {
  type: LayoutType;
  rows?: number;
  cols?: number;
  blockSize?: number;
  sashingWidth?: number;
  showSashing?: boolean;
  className?: string;
}

export function LayoutThumbnail({
  type,
  rows = 4,
  cols = 4,
  blockSize = 12,
  sashingWidth = 0,
  showSashing = false,
  className,
}: LayoutThumbnailProps) {
  const svg = generateLayoutSvg(type, rows, cols, blockSize, sashingWidth, showSashing);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/**
 * Get preset thumbnail SVG by preset ID.
 */
export function getPresetThumbnail(presetId: string): string {
  const preset = getLayoutPreset(presetId);
  if (!preset) {
    return generateLayoutSvg('grid', 4, 4, 12, 0, false);
  }

  const { type, rows = 4, cols = 4, blockSize = 12, sashing } = preset.config;
  const sashingWidth = sashing?.width ?? 0;

  return generateLayoutSvg(type, rows, cols, blockSize, sashingWidth, sashingWidth > 0);
}

/**
 * Render a preset card thumbnail.
 */
export function PresetThumbnail({ presetId, className }: { presetId: string; className?: string }) {
  const svg = getPresetThumbnail(presetId);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
