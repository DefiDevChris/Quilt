/**
 * Fence Engine — Pure computation engine for fence overlay areas.
 *
 * Takes a LayoutTemplate + quilt dimensions and computes FenceArea[] arrays.
 * Wraps/adapts the existing computeLayout from layout-utils.ts rather than
 * reimplementing layout geometry.
 *
 * Zero React / DOM / Fabric.js dependencies — fully testable in Vitest.
 */

import type { LayoutTemplate, LayoutCategory } from '@/types/layout';
import type { FenceArea } from '@/types/fence';
import { computeLayout, type LayoutConfig, type LayoutResult } from '@/lib/layout-utils';
import { DEFAULT_LAYOUT } from '@/lib/design-system';

/** Map template category to the internal LayoutType used by computeLayout. */
const CATEGORY_TO_LAYOUT_TYPE: Record<LayoutCategory, 'grid' | 'sashing' | 'on-point'> = {
  straight: 'grid',
  sashing: 'sashing',
  'on-point': 'on-point',
  medallion: 'grid',
  strippy: 'grid',
};

/**
 * Map template category to the internal LayoutType used by computeLayout.
 */
function categoryToLayoutType(category: LayoutCategory): 'grid' | 'sashing' | 'on-point' {
  return CATEGORY_TO_LAYOUT_TYPE[category];
}

/**
 * Compute the natural footprint of a layout template (in inches/units),
 * unscaled — i.e. what the layout would measure if rendered with its
 * `defaultBlockSize`. Returns null for medallion/strippy categories.
 */
function computeTemplateFootprint(
  template: LayoutTemplate
): { width: number; height: number } | null {
  if (template.category === 'medallion' || template.category === 'strippy') {
    return null;
  }

  const totalBorderWidth = template.borders.reduce((sum, b) => sum + b.width, 0);
  const bindingExtra = template.bindingWidth * 2;

  let innerW: number;
  let innerH: number;

  if (template.category === 'on-point') {
    const diagonal = template.defaultBlockSize * Math.SQRT2;
    innerW = template.gridCols * diagonal;
    innerH = template.gridRows * diagonal;
  } else if (template.category === 'sashing') {
    innerW =
      template.gridCols * template.defaultBlockSize +
      Math.max(0, template.gridCols - 1) * template.sashingWidth;
    innerH =
      template.gridRows * template.defaultBlockSize +
      Math.max(0, template.gridRows - 1) * template.sashingWidth;
  } else {
    innerW = template.gridCols * template.defaultBlockSize;
    innerH = template.gridRows * template.defaultBlockSize;
  }

  return {
    width: innerW + totalBorderWidth * 2 + bindingExtra,
    height: innerH + totalBorderWidth * 2 + bindingExtra,
  };
}

/**
 * Convert a LayoutResult into FenceArea[].
 *
 * Adapts the raw geometry output from computeLayout into the FenceArea
 * shape expected by the fence overlay system.
 */
function convertResultToFenceAreas(result: LayoutResult, template: LayoutTemplate): FenceArea[] {
  const areas: FenceArea[] = [];

  // Block cells
  for (const cell of result.cells) {
    areas.push({
      id: `cell-${cell.row}-${cell.col}`,
      role: 'block-cell',
      label: 'Block',
      row: cell.row,
      col: cell.col,
      x: cell.centerX - cell.size / 2,
      y: cell.centerY - cell.size / 2,
      width: cell.size,
      height: cell.size,
      rotation: cell.rotation || undefined,
      assignedBlockId: undefined,
      assignedFabricId: null,
    });
  }

  // Sashing strips and cornerstones
  if (template.category === 'sashing') {
    const { sashingAreas, cornerstoneAreas } = separateSashingAndCornerstones(result, template);
    areas.push(...sashingAreas);
    if (template.hasCornerstones) {
      areas.push(...cornerstoneAreas);
    }
  }

  // Setting triangles (on-point layouts)
  for (let i = 0; i < result.settingTriangles.length; i++) {
    const tri = result.settingTriangles[i];
    // Compute bounding box for x/y/width/height (used for hit-testing fallback)
    const xs = tri.points.map((p) => p.x);
    const ys = tri.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    areas.push({
      id: `setting-tri-${tri.type}-${i}`,
      role: 'setting-triangle',
      label: tri.type === 'corner' ? 'Corner' : 'Setting',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      points: tri.points,
      triangleType: tri.type,
      assignedFabricId: null,
    });
  }

  // Border strips
  for (const strip of result.borderStrips) {
    areas.push({
      id: `border-${strip.borderIndex}-${strip.side}`,
      role: 'border',
      label: `Border ${strip.borderIndex + 1}`,
      borderIndex: strip.borderIndex,
      x: strip.x,
      y: strip.y,
      width: strip.width,
      height: strip.height,
      assignedFabricId: null,
    });
  }

  // Binding
  if (template.bindingWidth > 0) {
    areas.push(...computeBindingAreas(result, template));
  }

  return areas;
}

/**
 * Separate sashing strips into regular sashing and cornerstones.
 * Cornerstones are the square intersections where sashing strips meet.
 */
function separateSashingAndCornerstones(
  result: LayoutResult,
  template: LayoutTemplate
): { sashingAreas: FenceArea[]; cornerstoneAreas: FenceArea[] } {
  const sashingAreas: FenceArea[] = [];
  const cornerstoneAreas: FenceArea[] = [];
  let sashIdx = 0;
  let csIdx = 0;

  for (const strip of result.sashingStrips) {
    const isSquare = Math.abs(strip.width - strip.height) < 0.01 && strip.width > 0;

    if (isSquare && template.hasCornerstones) {
      cornerstoneAreas.push({
        id: `cornerstone-${csIdx}`,
        role: 'cornerstone',
        label: 'CS',
        x: strip.x,
        y: strip.y,
        width: strip.width,
        height: strip.height,
        assignedFabricId: null,
      });
      csIdx++;
    } else if (!isSquare) {
      sashingAreas.push({
        id: `sashing-${sashIdx}`,
        role: 'sashing',
        label: 'Sashing',
        x: strip.x,
        y: strip.y,
        width: strip.width,
        height: strip.height,
        assignedFabricId: null,
      });
      sashIdx++;
    }
  }

  return { sashingAreas, cornerstoneAreas };
}

/**
 * Compute binding areas — thin strips around the outermost border.
 */
function computeBindingAreas(result: LayoutResult, template: LayoutTemplate): FenceArea[] {
  const bw = template.bindingWidth;
  if (bw <= 0) return [];

  const tw = result.totalWidth;
  const th = result.totalHeight;

  const borderOffset = template.borders.reduce((sum, b) => sum + b.width, 0);
  const ox = -borderOffset;
  const oy = -borderOffset;

  return [
    {
      id: 'binding-top',
      role: 'binding',
      label: 'Binding',
      x: ox - bw,
      y: oy - bw,
      width: tw + bw * 2,
      height: bw,
      assignedFabricId: null,
    },
    {
      id: 'binding-bottom',
      role: 'binding',
      label: 'Binding',
      x: ox - bw,
      y: oy + th,
      width: tw + bw * 2,
      height: bw,
      assignedFabricId: null,
    },
    {
      id: 'binding-left',
      role: 'binding',
      label: 'Binding',
      x: ox - bw,
      y: oy,
      width: bw,
      height: th,
      assignedFabricId: null,
    },
    {
      id: 'binding-right',
      role: 'binding',
      label: 'Binding',
      x: ox + tw,
      y: oy,
      width: bw,
      height: th,
      assignedFabricId: null,
    },
  ];
}

/**
 * Build a LayoutConfig from a LayoutTemplate for use with computeLayout.
 */
function templateToLayoutConfig(template: LayoutTemplate, pxPerUnit: number): LayoutConfig {
  return {
    type: categoryToLayoutType(template.category),
    rows: template.gridRows,
    cols: template.gridCols,
    blockSize: template.defaultBlockSize,
    sashing: {
      width: template.sashingWidth,
      color: DEFAULT_LAYOUT.sashing,
      fabricId: null,
    },
    borders: template.borders.map((b) => ({
      width: b.width,
      color: DEFAULT_LAYOUT.border,
      fabricId: null,
    })),
  };
}

/**
 * Compute fence areas for a layout template at its natural size.
 *
 * @param template  The layout template to render
 * @param pxPerUnit Pixels per unit (inch or cm)
 * @returns Array of FenceArea objects with pixel coordinates
 */
function renderFenceTemplate(template: LayoutTemplate, pxPerUnit: number): FenceArea[] {
  if (template.category === 'strippy') {
    return computeStrippyAreas(template, pxPerUnit);
  }

  if (template.category === 'medallion') {
    return computeMedallionAreas(template, pxPerUnit);
  }

  const config = templateToLayoutConfig(template, pxPerUnit);
  const result = computeLayout(config, pxPerUnit);
  return convertResultToFenceAreas(result, template);
}

/**
 * Compute strippy layout — alternating vertical columns of blocks and strips.
 */
function computeStrippyAreas(template: LayoutTemplate, pxPerUnit: number): FenceArea[] {
  const areas: FenceArea[] = [];
  const blockPx = template.defaultBlockSize * pxPerUnit;
  const stripPx = template.sashingWidth * pxPerUnit;
  const rows = template.gridRows;
  const cols = template.gridCols;

  let xOffset = 0;
  let colIdx = 0;

  for (let c = 0; c < cols; c++) {
    const isBlockCol = c % 2 === 0;

    if (isBlockCol) {
      for (let r = 0; r < rows; r++) {
        areas.push({
          id: `cell-${r}-${colIdx}`,
          role: 'block-cell',
          label: 'Block',
          row: r,
          col: colIdx,
          x: xOffset,
          y: r * blockPx,
          width: blockPx,
          height: blockPx,
          assignedBlockId: null,
          assignedFabricId: null,
        });
      }
      colIdx++;
      xOffset += blockPx;
    } else {
      areas.push({
        id: `sashing-strip-${c}`,
        role: 'sashing',
        label: 'Strip',
        x: xOffset,
        y: 0,
        width: stripPx,
        height: rows * blockPx,
        assignedFabricId: null,
      });
      xOffset += stripPx;
    }
  }

  return areas;
}

/**
 * Compute medallion layout — center block with concentric borders.
 */
function computeMedallionAreas(template: LayoutTemplate, pxPerUnit: number): FenceArea[] {
  const areas: FenceArea[] = [];
  const blockPx = template.defaultBlockSize * pxPerUnit;

  const totalBorderWidth = template.borders.reduce((sum, b) => sum + b.width * pxPerUnit, 0);

  areas.push({
    id: 'cell-0-0',
    role: 'block-cell',
    label: 'Center',
    row: 0,
    col: 0,
    x: totalBorderWidth,
    y: totalBorderWidth,
    width: blockPx,
    height: blockPx,
    assignedBlockId: null,
    assignedFabricId: null,
  });

  let offset = 0;
  for (let i = 0; i < template.borders.length; i++) {
    const bw = template.borders[i].width * pxPerUnit;
    const innerX = totalBorderWidth - offset - bw;
    const innerY = totalBorderWidth - offset - bw;
    const innerW = blockPx + (offset + bw) * 2;
    const innerH = blockPx + (offset + bw) * 2;

    const sides = ['top', 'bottom', 'left', 'right'] as const;
    for (const side of sides) {
      let x: number, y: number, w: number, h: number;
      switch (side) {
        case 'top':
          x = innerX;
          y = innerY;
          w = innerW;
          h = bw;
          break;
        case 'bottom':
          x = innerX;
          y = innerY + innerH - bw;
          w = innerW;
          h = bw;
          break;
        case 'left':
          x = innerX;
          y = innerY + bw;
          w = bw;
          h = innerH - bw * 2;
          break;
        case 'right':
          x = innerX + innerW - bw;
          y = innerY + bw;
          w = bw;
          h = innerH - bw * 2;
          break;
      }
      areas.push({
        id: `border-${i}-${side}`,
        role: 'border',
        label: `Border ${i + 1}`,
        borderIndex: i,
        x,
        y,
        width: w,
        height: h,
        assignedFabricId: null,
      });
    }
    offset += bw;
  }

  return areas;
}

/**
 * Compute fence areas for a layout template fitted to quilt dimensions.
 *
 * The quilt is the source of truth — fence areas scale to fit inside
 * quilt dimensions. Layouts adapt to fit inside the quilt, never the
 * other way around.
 *
 * @param template      The layout template to render
 * @param quiltWidthIn  Quilt finished width in inches
 * @param quiltHeightIn Quilt finished height in inches
 * @param pxPerUnit     Pixels per unit (96 for imperial, ~37.8 for metric)
 * @returns Array of FenceArea objects scaled to fit inside the quilt
 */
export function computeFenceAreas(
  template: LayoutTemplate,
  quiltWidthIn: number,
  quiltHeightIn: number,
  pxPerUnit: number
): FenceArea[] {
  const footprint = computeTemplateFootprint(template);

  // Medallion and strippy: compute areas at natural size, then scale to
  // fill the quilt dimensions so they don't float at a smaller size.
  if (!footprint) {
    const naturalAreas = renderFenceTemplate(template, pxPerUnit);
    if (naturalAreas.length === 0) return naturalAreas;

    // Compute the bounding box of the natural-size areas
    let maxX = 0;
    let maxY = 0;
    for (const a of naturalAreas) {
      const right = a.x + a.width;
      const bottom = a.y + a.height;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }

    if (maxX <= 0 || maxY <= 0) return naturalAreas;

    const quiltWPx = quiltWidthIn * pxPerUnit;
    const quiltHPx = quiltHeightIn * pxPerUnit;
    const sx = quiltWPx / maxX;
    const sy = quiltHPx / maxY;

    return naturalAreas.map((area) => ({
      ...area,
      x: area.x * sx,
      y: area.y * sy,
      width: area.width * sx,
      height: area.height * sy,
      points: area.points
        ? area.points.map((p) => ({ x: p.x * sx, y: p.y * sy }))
        : undefined,
    }));
  }

  if (footprint.width <= 0 || footprint.height <= 0) {
    return [];
  }

  // Layout must always match grid dimensions exactly — scale to fill entire quilt
  const scaleX = quiltWidthIn / footprint.width;
  const scaleY = quiltHeightIn / footprint.height;

  if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
    return [];
  }

  // Use non-uniform scaling to make layout exactly match grid dimensions
  const scaleFactor = Math.min(scaleX, scaleY);

  const fittedTemplate: LayoutTemplate = {
    ...template,
    defaultBlockSize: template.defaultBlockSize * scaleFactor,
    sashingWidth: template.sashingWidth * scaleFactor,
    bindingWidth: template.bindingWidth * scaleFactor,
    borders: template.borders.map((b) => ({
      ...b,
      width: b.width * scaleFactor,
    })),
  };

  const areas = renderFenceTemplate(fittedTemplate, pxPerUnit);

  // Scale areas to fill entire quilt dimensions exactly
  const fittedFootprint = computeTemplateFootprint(fittedTemplate);
  if (!fittedFootprint) return areas;

  const quiltWPx = quiltWidthIn * pxPerUnit;
  const quiltHPx = quiltHeightIn * pxPerUnit;
  const fittedWPx = fittedFootprint.width * pxPerUnit;
  const fittedHPx = fittedFootprint.height * pxPerUnit;

  const finalScaleX = quiltWPx / fittedWPx;
  const finalScaleY = quiltHPx / fittedHPx;

  // Note: offsetX/Y are always 0 because fittedWPx * finalScaleX = quiltWPx
  // (the second pass stretches the uniformly-scaled template to fill the quilt).
  return areas.map((area) => ({
    ...area,
    x: area.x * finalScaleX,
    y: area.y * finalScaleY,
    width: area.width * finalScaleX,
    height: area.height * finalScaleY,
    // Scale polygon points through the same factors so setting triangles
    // render at correct coordinates when finalScaleX/Y differ from 1
    points: area.points
      ? area.points.map((p) => ({ x: p.x * finalScaleX, y: p.y * finalScaleY }))
      : undefined,
  }));
}
