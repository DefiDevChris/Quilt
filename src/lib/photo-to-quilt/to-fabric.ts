import { PIXELS_PER_INCH } from '@/lib/constants/canvas';

// FP rounding helpers to eliminate drift when snapping to pixels
const PX_EPSILON = 0.01;
function snapPx(value: number): number {
  // Snap to nearest integer pixel coordinate/dimension
  // We keep the helper centralized for easy adjustments if needed
  return Math.round(value);
}

/**
 * Minimal Pattern types duplicated here so this lib module does not import a
 * component. Types are erased at compile time and carry no runtime / DOM
 * dependency.
 */
interface PatternPiece {
  colorIndex: number;
  kind: 'square' | 'triangle-a' | 'triangle-b';
  spanW?: number;
  spanH?: number;
  isBackground?: boolean;
}

interface PatternCell {
  x: number;
  y: number;
  pieces: PatternPiece[];
  blockId?: number;
}

interface PatternResult {
  cols: number;
  rows: number;
  blockSize: number;
  pieceSizeInches: number;
  palette: string[];
  cells: PatternCell[];
  backgroundFabric?: string;
}

/**
 * Convert a photo-to-quilt PatternResult into Fabric.js 7 JSON that can be
 * loaded with canvas.loadFromJSON().  Each grid cell becomes a Fabric Rect
 * or Polygon so the design is fully editable inside the studio.
 */
export function patternResultToFabricJson(
  result: PatternResult,
): Record<string, unknown> {
  const ppi = PIXELS_PER_INCH;
  // Snap cell size to integer pixels to avoid FP drift
  const cellPx = Math.round(result.pieceSizeInches * ppi);
  const objects: Record<string, unknown>[] = [];

  for (const cell of result.cells) {
    for (const piece of cell.pieces) {
      if (piece.isBackground) continue;

      const left = snapPx(cell.x * cellPx);
      const top = snapPx(cell.y * cellPx);
      const fill = result.palette[piece.colorIndex];

      if (piece.kind === 'square') {
        const w = snapPx(cellPx * (piece.spanW ?? 1));
        const h = snapPx(cellPx * (piece.spanH ?? 1));
        objects.push({
          type: 'rect',
          left,
          top,
          width: w,
          height: h,
          fill,
          stroke: fill,
          strokeWidth: 0.5,
          originX: 'left',
          originY: 'top',
          selectable: true,
          evented: true,
        });
      } else if (piece.kind === 'triangle-a') {
        objects.push({
          type: 'polygon',
          left,
          top,
          width: snapPx(cellPx),
          height: snapPx(cellPx),
          fill,
          stroke: fill,
          strokeWidth: 0.5,
          points: [
            { x: snapPx(0), y: snapPx(0) },
            { x: snapPx(cellPx), y: snapPx(0) },
            { x: snapPx(0), y: snapPx(cellPx) },
          ],
          originX: 'left',
          originY: 'top',
          selectable: true,
          evented: true,
        });
      } else if (piece.kind === 'triangle-b') {
        objects.push({
          type: 'polygon',
          left,
          top,
          width: snapPx(cellPx),
          height: snapPx(cellPx),
          fill,
          stroke: fill,
          strokeWidth: 0.5,
          points: [
            { x: snapPx(cellPx), y: snapPx(0) },
            { x: snapPx(cellPx), y: snapPx(cellPx) },
            { x: snapPx(0), y: snapPx(cellPx) },
          ],
          originX: 'left',
          originY: 'top',
          selectable: true,
          evented: true,
        });
      }
    }
  }

  return {
    version: '7.2.0',
    objects,
    backgroundColor: result.backgroundFabric ?? 'transparent',
  };
}
