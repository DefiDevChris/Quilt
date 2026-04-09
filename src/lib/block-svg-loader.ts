/**
 * Block SVG Loader
 *
 * Loads a block SVG from /quilt_blocks/ and converts it to a Fabric.js Group,
 * positioned and scaled to fit a target cell on the canvas.
 *
 * Each SVG patch becomes an individually fillable fabric.Polygon/fabric.Path/fabric.Rect,
 * tagged with metadata for sub-target fabric assignment.
 *
 * Used by usePhotoLayoutImport to place matched block cells as clean, editable groups.
 */

import type { Point2D } from '@/lib/photo-layout-types';

/** A single patch extracted from a block SVG. */
interface SvgPatchDef {
  readonly type: 'rect' | 'polygon' | 'path' | 'circle';
  readonly fill: string;
  readonly stroke: string | null;
  readonly strokeWidth: number;
  readonly shade: string;
  readonly patchIndex: number;
  // For rect
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  // For polygon
  readonly points?: readonly Point2D[];
  // For path
  readonly pathData?: string;
  // For circle
  readonly cx?: number;
  readonly cy?: number;
  readonly r?: number;
}

/** Result of loading a block SVG into Fabric.js. */
export interface BlockFabricGroup {
  /** The Fabric.js Group containing all patches */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  group: any;
  /** Number of patches in the group */
  patchCount: number;
  /** Block ID */
  blockId: string;
}

// ============================================================================
// SVG Parsing
// ============================================================================

function parseAttr(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([\w-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

/**
 * Parse a block SVG into an array of patch definitions.
 */
export function parseBlockSvg(svgData: string): SvgPatchDef[] {
  const patches: SvgPatchDef[] = [];
  let index = 0;

  // <rect ... />
  const rectRegex = /<rect\s+([^>]+?)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = rectRegex.exec(svgData)) !== null) {
    const a = parseAttr(m[1]);
    patches.push({
      type: 'rect',
      x: parseFloat(a.x ?? '0'),
      y: parseFloat(a.y ?? '0'),
      width: parseFloat(a.width ?? '0'),
      height: parseFloat(a.height ?? '0'),
      fill: a.fill ?? '#D0D0D0',
      stroke: a.stroke === 'none' ? null : (a.stroke ?? '#333'),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
      shade: a['data-shade'] ?? 'unknown',
      patchIndex: index++,
    });
  }

  // <polygon ... />
  const polyRegex = /<polygon\s+([^>]+?)\/>/g;
  while ((m = polyRegex.exec(svgData)) !== null) {
    const a = parseAttr(m[1]);
    const pointsRaw = (a.points ?? '')
      .trim()
      .split(/\s+/)
      .map((p) => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      })
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (pointsRaw.length < 3) continue;
    patches.push({
      type: 'polygon',
      points: pointsRaw,
      fill: a.fill ?? '#D0D0D0',
      stroke: a.stroke === 'none' ? null : (a.stroke ?? '#333'),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
      shade: a['data-shade'] ?? 'unknown',
      patchIndex: index++,
    });
  }

  // <path d="..."/>
  const pathRegex = /<path\s+([^>]+?)\/>/g;
  while ((m = pathRegex.exec(svgData)) !== null) {
    const a = parseAttr(m[1]);
    if (!a.d) continue;
    patches.push({
      type: 'path',
      pathData: a.d,
      fill: a.fill === 'none' ? '' : (a.fill ?? '#D0D0D0'),
      stroke: a.stroke === 'none' ? null : (a.stroke ?? '#333'),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
      shade: a['data-shade'] ?? 'unknown',
      patchIndex: index++,
    });
  }

  // <circle ... />
  const circleRegex = /<circle\s+([^>]+?)\/>/g;
  while ((m = circleRegex.exec(svgData)) !== null) {
    const a = parseAttr(m[1]);
    const cx = parseFloat(a.cx ?? '0');
    const cy = parseFloat(a.cy ?? '0');
    const r = parseFloat(a.r ?? '0');
    if (r <= 0) continue;
    patches.push({
      type: 'circle',
      cx,
      cy,
      r,
      fill: a.fill ?? '#D0D0D0',
      stroke: a.stroke === 'none' ? null : (a.stroke ?? '#333'),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
      shade: a['data-shade'] ?? 'unknown',
      patchIndex: index++,
    });
  }

  return patches;
}

// ============================================================================
// Fabric.js Group Creation
// ============================================================================

/** SVG viewBox size for all block SVGs. */
const SVG_SIZE = 300;

/**
 * Load a block SVG and create a Fabric.js Group from its patches,
 * scaled and positioned to fit the target cell.
 *
 * @param svgData - Raw SVG string
 * @param blockId - Block identifier
 * @param targetLeft - Canvas X position
 * @param targetTop - Canvas Y position
 * @param targetWidth - Target cell width in canvas pixels
 * @param targetHeight - Target cell height in canvas pixels
 * @returns Fabric.js Group or null on failure
 */
export async function createBlockFabricGroup(
  svgData: string,
  blockId: string,
  targetLeft: number,
  targetTop: number,
  targetWidth: number,
  targetHeight: number
): Promise<BlockFabricGroup | null> {
  const fabric = await import('fabric');

  const patches = parseBlockSvg(svgData);
  if (patches.length === 0) return null;

  // Compute scale factor to fit target
  const scaleX = targetWidth / SVG_SIZE;
  const scaleY = targetHeight / SVG_SIZE;

  const fabricObjects: Array<InstanceType<typeof fabric.FabricObject>> = [];

  for (const patch of patches) {
    let obj: InstanceType<typeof fabric.FabricObject>;

    switch (patch.type) {
      case 'rect': {
        obj = new fabric.Rect({
          left: patch.x! * scaleX,
          top: patch.y! * scaleY,
          width: patch.width! * scaleX,
          height: patch.height! * scaleY,
          fill: patch.fill,
          stroke: patch.stroke ?? undefined,
          strokeWidth: patch.strokeWidth * Math.min(scaleX, scaleY),
          originX: 'left',
          originY: 'top',
        });
        break;
      }

      case 'polygon': {
        const scaledPoints = patch.points!.map((p) => ({
          x: p.x * scaleX,
          y: p.y * scaleY,
        }));
        obj = new fabric.Polygon(scaledPoints, {
          fill: patch.fill,
          stroke: patch.stroke ?? undefined,
          strokeWidth: patch.strokeWidth * Math.min(scaleX, scaleY),
        });
        break;
      }

      case 'path': {
        // For paths, we scale using the path's transform
        obj = new fabric.Path(patch.pathData!, {
          fill: patch.fill,
          stroke: patch.stroke ?? undefined,
          strokeWidth: patch.strokeWidth * Math.min(scaleX, scaleY),
          scaleX,
          scaleY,
        });
        break;
      }

      case 'circle': {
        obj = new fabric.Circle({
          left: patch.cx! * scaleX - patch.r! * scaleX,
          top: patch.cy! * scaleY - patch.r! * scaleY,
          radius: patch.r! * scaleX,
          fill: patch.fill,
          stroke: patch.stroke ?? undefined,
          strokeWidth: patch.strokeWidth * Math.min(scaleX, scaleY),
        });
        break;
      }

      default:
        continue;
    }

    // Tag with metadata for sub-target detection and fabric assignment
    (obj as unknown as Record<string, unknown>).__pieceRole = 'block';
    (obj as unknown as Record<string, unknown>).__blockPatchIndex = patch.patchIndex;
    (obj as unknown as Record<string, unknown>).__blockId = blockId;
    (obj as unknown as Record<string, unknown>).__shade = patch.shade;
    (obj as unknown as Record<string, unknown>).subTargetCheck = true;

    fabricObjects.push(obj);
  }

  // Create the group
  const group = new fabric.Group(fabricObjects, {
    left: targetLeft,
    top: targetTop,
    selectable: true,
    evented: true,
    subTargetCheck: true,
  } as Record<string, unknown>);

  // Tag the group
  (group as unknown as Record<string, unknown>).__blockId = blockId;
  (group as unknown as Record<string, unknown>).__isBlockGroup = true;

  return {
    group,
    patchCount: patches.length,
    blockId,
  };
}

/**
 * Fetch a block SVG from the public /quilt_blocks/ directory.
 */
export async function fetchBlockSvg(blockId: string): Promise<string | null> {
  try {
    const response = await fetch(`/quilt_blocks/${blockId}.svg`);
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

/**
 * Full pipeline: fetch SVG → parse → create Fabric group.
 */
export async function loadBlockGroup(
  blockId: string,
  targetLeft: number,
  targetTop: number,
  targetWidth: number,
  targetHeight: number
): Promise<BlockFabricGroup | null> {
  const svgData = await fetchBlockSvg(blockId);
  if (!svgData) return null;

  return createBlockFabricGroup(
    svgData,
    blockId,
    targetLeft,
    targetTop,
    targetWidth,
    targetHeight
  );
}
