/**
 * Canvas Snapshot Utilities
 * Extracts data from the Fabric.js canvas for PDF embedding.
 *
 * These functions accept the canvas as `unknown` and cast internally,
 * keeping the PDF engines free of direct Fabric.js dependencies.
 */

import { GRID_LINE_COLOR } from '@/lib/constants';
import { DEFAULT_CANVAS } from '@/lib/design-system';

// ── Types ──────────────────────────────────────────────────────────

export interface BlockSnapshot {
  blockName: string | null;
  svgData: string;
  pieces: PieceSnapshot[];
  position: { x: number; y: number; width: number; height: number };
}

export interface PieceSnapshot {
  shapeType: string;
  svgData: string;
  fill: string;
  fabricId?: string;
  dimensions: { width: number; height: number };
  vertices: { x: number; y: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────

/** Check if a Fabric object is a grid line or overlay (non-user content). */
function isSystemObject(obj: Record<string, unknown>): boolean {
  const stroke = obj.stroke as string | undefined;
  const name = obj.name as string | undefined;

  if (stroke === GRID_LINE_COLOR) return true;
  if (name === 'overlay-ref') return true;
  if (name === 'grid-line') return true;

  return false;
}

/** Safely get a number property from a Fabric object. */
function num(obj: Record<string, unknown>, key: string, fallback = 0): number {
  const v = obj[key];
  return typeof v === 'number' ? v : fallback;
}

/** Safely get a string property. */
function str(obj: Record<string, unknown>, key: string, fallback = ''): string {
  const v = obj[key];
  return typeof v === 'string' ? v : fallback;
}

// ── Canvas PNG Capture ─────────────────────────────────────────────

/**
 * Capture the current Fabric.js canvas as a PNG image.
 * Returns null if the canvas is unavailable.
 */
export async function captureCanvasPng(canvas: unknown): Promise<Uint8Array | null> {
  if (!canvas) return null;

  try {
    const fabricCanvas = canvas as {
      toDataURL: (opts: Record<string, unknown>) => string;
      getWidth: () => number;
      getHeight: () => number;
    };

    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });

    // Convert data URL to Uint8Array
    const base64 = dataUrl.split(',')[1] ?? '';
    if (!base64) return null;

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

// ── Block Extraction ───────────────────────────────────────────────

/**
 * Extract block and piece data from the Fabric.js canvas.
 * Groups objects by their block group (or treats ungrouped shapes as standalone blocks).
 */
export async function extractBlocksFromCanvas(canvas: unknown): Promise<BlockSnapshot[]> {
  if (!canvas) return [];

  try {
    const fabricCanvas = canvas as {
      getObjects: () => Array<Record<string, unknown>>;
    };

    const objects = fabricCanvas.getObjects();
    const blocks: BlockSnapshot[] = [];
    const ungroupedPieces: PieceSnapshot[] = [];

    for (const obj of objects) {
      if (isSystemObject(obj)) continue;

      const objType = str(obj, 'type');

      if (objType === 'group') {
        // This is a block group — extract its children
        const groupObjects =
          typeof obj.getObjects === 'function'
            ? (obj.getObjects as () => Array<Record<string, unknown>>)()
            : ((obj._objects as Array<Record<string, unknown>> | undefined) ?? []);

        const pieces: PieceSnapshot[] = [];
        for (const child of groupObjects) {
          if (isSystemObject(child)) continue;
          const piece = extractPiece(child);
          if (piece) pieces.push(piece);
        }

        const blockName = str(obj, 'blockName') || str(obj, 'name') || null;

        // Get SVG from group if possible
        let svgData = '';
        if (typeof obj.toSVG === 'function') {
          svgData = (obj.toSVG as () => string)();
        }

        blocks.push({
          blockName,
          svgData,
          pieces,
          position: {
            x: num(obj, 'left'),
            y: num(obj, 'top'),
            width: num(obj, 'width') * num(obj, 'scaleX', 1),
            height: num(obj, 'height') * num(obj, 'scaleY', 1),
          },
        });
      } else {
        // Standalone shape — collect as ungrouped piece
        const piece = extractPiece(obj);
        if (piece) ungroupedPieces.push(piece);
      }
    }

    // If there are ungrouped pieces, treat them as a single "Ungrouped" block
    if (ungroupedPieces.length > 0) {
      blocks.push({
        blockName: null,
        svgData: '',
        pieces: ungroupedPieces,
        position: { x: 0, y: 0, width: 0, height: 0 },
      });
    }

    return blocks;
  } catch {
    return [];
  }
}

/**
 * Extract piece data from a single Fabric.js object.
 */
function extractPiece(obj: Record<string, unknown>): PieceSnapshot | null {
  const objType = str(obj, 'type');
  if (!objType) return null;

  // Skip images and text
  if (objType === 'image' || objType === 'i-text' || objType === 'textbox') {
    return null;
  }

  let svgData = '';
  if (typeof obj.toSVG === 'function') {
    svgData = (obj.toSVG as () => string)();
  }

  // Handle both string fills and fabric.Pattern objects.
  // Pattern fills are objects with a `source` property (image element).
  const rawFill = obj.fill;
  let fill: string;
  if (typeof rawFill === 'string') {
    fill = rawFill || DEFAULT_CANVAS.stroke;
  } else if (rawFill && typeof rawFill === 'object') {
    // fabric.Pattern — try to extract a representative color.
    // The actual pattern image renders correctly in captureCanvasPng().
    // For structured data (yardage, cutting charts), we use fabricId below.
    const patternObj = rawFill as Record<string, unknown>;
    const sourceEl = patternObj.source as { src?: string } | undefined;
    fill = sourceEl?.src ? `pattern:${sourceEl.src}` : DEFAULT_CANVAS.stroke;
  } else {
    fill = DEFAULT_CANVAS.stroke;
  }
  const fabricId = str(obj, 'fabricId') || undefined;

  const width = num(obj, 'width') * num(obj, 'scaleX', 1);
  const height = num(obj, 'height') * num(obj, 'scaleY', 1);

  // Extract vertices from polygon/polyline points
  const vertices: { x: number; y: number }[] = [];
  const points = obj.points as Array<{ x: number; y: number }> | undefined;
  if (points && Array.isArray(points)) {
    for (const p of points) {
      vertices.push({ x: p.x, y: p.y });
    }
  }

  // Map Fabric type to a simpler shape type
  let shapeType = objType;
  if (objType === 'polygon') shapeType = 'polygon';
  else if (objType === 'rect') shapeType = 'rect';
  else if (objType === 'triangle') shapeType = 'triangle';
  else if (objType === 'path') shapeType = 'path';

  return {
    shapeType,
    svgData,
    fill,
    fabricId,
    dimensions: { width, height },
    vertices,
  };
}
