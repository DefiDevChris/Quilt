/**
 * Layout Renderer — Pure engine that computes LayoutArea[] from a LayoutTemplate.
 *
 * Takes a LayoutTemplate + quilt dimensions (width x height in inches) and
 * calculates the position and size of every layout area (block cells, sashing,
 * cornerstones, borders, binding) in canvas pixel coordinates.
 *
 * Zero DOM / React / Fabric.js dependencies — fully testable in Vitest.
 */

import type { LayoutTemplate, LayoutArea, LayoutCategory } from '@/types/layout';
import { computeLayout, type LayoutConfig, type LayoutResult } from '@/lib/layout-utils';
import { DEFAULT_SASHING_COLOR, DEFAULT_BORDER_COLOR } from '@/lib/constants';

/**
 * Map template category to the internal LayoutType used by computeLayout.
 */
function categoryToLayoutType(category: LayoutCategory): 'grid' | 'sashing' | 'on-point' {
  switch (category) {
    case 'straight':
      return 'grid';
    case 'sashing':
      return 'sashing';
    case 'on-point':
      return 'on-point';
    case 'medallion':
      return 'grid';
    case 'strippy':
      return 'grid';
  }
}

/**
 * Compute all layout areas from a template definition.
 *
 * @param template  The layout template to render
 * @param pxPerUnit Pixels per unit (inch or cm)
 * @returns Array of LayoutArea objects with pixel coordinates
 */
export function renderLayoutTemplate(template: LayoutTemplate, pxPerUnit: number): LayoutArea[] {
  if (template.category === 'strippy') {
    return computeStrippyAreas(template, pxPerUnit);
  }

  if (template.category === 'medallion') {
    return computeMedallionAreas(template, pxPerUnit);
  }

  const config: LayoutConfig = {
    type: categoryToLayoutType(template.category),
    rows: template.gridRows,
    cols: template.gridCols,
    blockSize: template.defaultBlockSize,
    sashing: {
      width: template.sashingWidth,
      color: DEFAULT_SASHING_COLOR,
      fabricId: null,
    },
    borders: template.borders.map((b) => ({
      width: b.width,
      color: DEFAULT_BORDER_COLOR,
      fabricId: null,
    })),
  };

  const result = computeLayout(config, pxPerUnit);
  return convertResultToAreas(result, template);
}

/**
 * Compute the natural footprint of a layout template (in inches/units),
 * unscaled — i.e. what the layout would measure if rendered with its
 * `defaultBlockSize`. Returns null for medallion/strippy categories which
 * have their own sizing rules.
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
    // 'straight'
    innerW = template.gridCols * template.defaultBlockSize;
    innerH = template.gridRows * template.defaultBlockSize;
  }

  return {
    width: innerW + totalBorderWidth * 2 + bindingExtra,
    height: innerH + totalBorderWidth * 2 + bindingExtra,
  };
}

/**
 * Fit a layout template inside a quilt of the given dimensions, scaling the
 * block size uniformly so the entire layout (with borders + binding) fits
 * inside the quilt's available area, then centering the result on the canvas.
 *
 * The quilt is the source of truth for finished dimensions. Layouts adapt
 * to fit inside the quilt — never the other way around.
 *
 * @param template       The layout template to render
 * @param quiltWidth     Quilt finished width (in current unit, e.g. inches)
 * @param quiltHeight    Quilt finished height (in current unit)
 * @param pxPerUnit      Pixels per unit (96 for imperial, ~37.8 for metric)
 * @returns Array of LayoutArea objects in canvas pixel coordinates,
 *          translated so the layout is centered inside the quilt area.
 */
export function fitLayoutToQuilt(
  template: LayoutTemplate,
  quiltWidth: number,
  quiltHeight: number,
  pxPerUnit: number
): LayoutArea[] {
  const footprint = computeTemplateFootprint(template);

  // Medallion and strippy don't have a clean uniform-scale fit — fall back
  // to their bespoke renderers and let the user resize as needed.
  if (!footprint) {
    return renderLayoutTemplate(template, pxPerUnit);
  }

  if (footprint.width <= 0 || footprint.height <= 0) {
    return [];
  }

  const scale = Math.min(quiltWidth / footprint.width, quiltHeight / footprint.height);
  if (!Number.isFinite(scale) || scale <= 0) {
    return [];
  }

  // Build a scaled clone of the template using the fitted block size.
  const fittedTemplate: LayoutTemplate = {
    ...template,
    defaultBlockSize: template.defaultBlockSize * scale,
    sashingWidth: template.sashingWidth * scale,
    bindingWidth: template.bindingWidth * scale,
    borders: template.borders.map((b) => ({
      ...b,
      width: b.width * scale,
    })),
  };

  const areas = renderLayoutTemplate(fittedTemplate, pxPerUnit);

  // Compute the actual rendered footprint after scaling, then center it
  // inside the quilt. We translate every area by (offsetX, offsetY).
  const fittedFootprint = computeTemplateFootprint(fittedTemplate);
  if (!fittedFootprint) return areas;

  const quiltWPx = quiltWidth * pxPerUnit;
  const quiltHPx = quiltHeight * pxPerUnit;
  const fittedWPx = fittedFootprint.width * pxPerUnit;
  const fittedHPx = fittedFootprint.height * pxPerUnit;

  // Areas are emitted relative to the inner layout origin (0,0). We need
  // them centered inside the quilt, accounting for the border ring that
  // sits OUTSIDE the inner origin (negative coordinates from
  // computeBorderStrips).
  const totalBorderPx = fittedTemplate.borders.reduce((sum, b) => sum + b.width * pxPerUnit, 0);
  const bindingPx = fittedTemplate.bindingWidth * pxPerUnit;

  const offsetX = (quiltWPx - fittedWPx) / 2 + totalBorderPx + bindingPx;
  const offsetY = (quiltHPx - fittedHPx) / 2 + totalBorderPx + bindingPx;

  return areas.map((area) => ({
    ...area,
    x: area.x + offsetX,
    y: area.y + offsetY,
  }));
}

/**
 * Convert a LayoutResult (from computeLayout) into LayoutArea[].
 */
function convertResultToAreas(result: LayoutResult, template: LayoutTemplate): LayoutArea[] {
  const areas: LayoutArea[] = [];

  // Block cells
  for (const cell of result.cells) {
    areas.push({
      id: `cell-${cell.row}-${cell.col}`,
      role: 'block-cell',
      row: cell.row,
      col: cell.col,
      x: cell.centerX - cell.size / 2,
      y: cell.centerY - cell.size / 2,
      width: cell.size,
      height: cell.size,
      rotation: cell.rotation,
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

  // Border strips
  for (const strip of result.borderStrips) {
    areas.push({
      id: `border-${strip.borderIndex}-${strip.side}`,
      role: 'border',
      borderIndex: strip.borderIndex,
      x: strip.x,
      y: strip.y,
      width: strip.width,
      height: strip.height,
    });
  }

  // Binding (outermost edge)
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
): { sashingAreas: LayoutArea[]; cornerstoneAreas: LayoutArea[] } {
  const sashingAreas: LayoutArea[] = [];
  const cornerstoneAreas: LayoutArea[] = [];
  let sashIdx = 0;
  let csIdx = 0;

  for (const strip of result.sashingStrips) {
    const isSquare = Math.abs(strip.width - strip.height) < 0.01 && strip.width > 0;

    if (isSquare && template.hasCornerstones) {
      cornerstoneAreas.push({
        id: `cornerstone-${csIdx}`,
        role: 'cornerstone',
        x: strip.x,
        y: strip.y,
        width: strip.width,
        height: strip.height,
      });
      csIdx++;
    } else if (!isSquare) {
      sashingAreas.push({
        id: `sashing-${sashIdx}`,
        role: 'sashing',
        x: strip.x,
        y: strip.y,
        width: strip.width,
        height: strip.height,
      });
      sashIdx++;
    }
  }

  return { sashingAreas, cornerstoneAreas };
}

/**
 * Compute binding areas — thin strips around the outermost border.
 */
function computeBindingAreas(result: LayoutResult, template: LayoutTemplate): LayoutArea[] {
  const bw = template.bindingWidth;
  if (bw <= 0) return [];

  // Binding goes outside the total layout dimensions
  const tw = result.totalWidth;
  const th = result.totalHeight;

  // Offset from inner origin to outer border edge
  const borderOffset = template.borders.reduce((sum, b) => sum + b.width, 0);
  const ox = -borderOffset;
  const oy = -borderOffset;

  return [
    {
      id: 'binding-top',
      role: 'binding',
      x: ox - bw,
      y: oy - bw,
      width: tw + bw * 2,
      height: bw,
    },
    {
      id: 'binding-bottom',
      role: 'binding',
      x: ox - bw,
      y: oy + th,
      width: tw + bw * 2,
      height: bw,
    },
    {
      id: 'binding-left',
      role: 'binding',
      x: ox - bw,
      y: oy,
      width: bw,
      height: th,
    },
    {
      id: 'binding-right',
      role: 'binding',
      x: ox + tw,
      y: oy,
      width: bw,
      height: th,
    },
  ];
}

/**
 * Compute strippy layout — alternating vertical columns of blocks and strips.
 */
function computeStrippyAreas(template: LayoutTemplate, pxPerUnit: number): LayoutArea[] {
  const areas: LayoutArea[] = [];
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
          row: r,
          col: colIdx,
          x: xOffset,
          y: r * blockPx,
          width: blockPx,
          height: blockPx,
        });
      }
      colIdx++;
      xOffset += blockPx;
    } else {
      areas.push({
        id: `sashing-strip-${c}`,
        role: 'sashing',
        x: xOffset,
        y: 0,
        width: stripPx,
        height: rows * blockPx,
      });
      xOffset += stripPx;
    }
  }

  return areas;
}

/**
 * Compute medallion layout — center block with concentric borders.
 */
function computeMedallionAreas(template: LayoutTemplate, pxPerUnit: number): LayoutArea[] {
  const areas: LayoutArea[] = [];
  const blockPx = template.defaultBlockSize * pxPerUnit;

  // Center block
  const totalBorderWidth = template.borders.reduce((sum, b) => sum + b.width * pxPerUnit, 0);

  areas.push({
    id: 'cell-0-0',
    role: 'block-cell',
    row: 0,
    col: 0,
    x: totalBorderWidth,
    y: totalBorderWidth,
    width: blockPx,
    height: blockPx,
  });

  // Concentric borders
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
        borderIndex: i,
        x: x,
        y: y,
        width: w,
        height: h,
      });
    }
    offset += bw;
  }

  return areas;
}
