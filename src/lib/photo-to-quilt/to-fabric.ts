import { PIXELS_PER_INCH } from '@/lib/constants/canvas';

// FP rounding helpers to eliminate drift when snapping to pixels
const PX_EPSILON = 0.01;
function snapPx(value: number): number {
  return Math.round(value);
}

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

export function patternResultToFabricJson(
  result: PatternResult,
): Record<string, unknown> {
  const ppi = PIXELS_PER_INCH;
  const cellPx = snapPx(result.pieceSizeInches * ppi);
  const blockSize = result.blockSize;
  const objects: Record<string, unknown>[] = [];

  // Group cells by 3x3 block coordinates (bx, by)
  const blockMap = new Map<string, { bx: number; by: number; cells: PatternCell[] }>();
  for (const cell of result.cells) {
    const bx = Math.floor(cell.x / blockSize);
    const by = Math.floor(cell.y / blockSize);
    const key = `${bx}-${by}`;
    if (!blockMap.has(key)) {
      blockMap.set(key, { bx, by, cells: [] });
    }
    blockMap.get(key)!.cells.push(cell);
  }

  // Process each block into a Fabric group
  for (const { bx, by, cells: blockCells } of blockMap.values()) {
    const patches: Record<string, unknown>[] = [];

    for (const cell of blockCells) {
      const dx = cell.x - bx * blockSize;
      const dy = cell.y - by * blockSize;

      for (let idx = 0; idx < cell.pieces.length; idx++) {
        const piece = cell.pieces[idx];
        if (piece.isBackground) continue;

        const fill = result.palette[piece.colorIndex];
        const patchId = `p2q-${by}-${bx}-${dy}-${dx}-${idx}`;
        const patch: Record<string, unknown> = {
          id: patchId,
          __pieceRole: 'patch',
          __pieceKind: piece.kind,
          __sizeInches: { w: result.pieceSizeInches, h: result.pieceSizeInches },
          __photoQuiltCell: { x: cell.x, y: cell.y },
          fill,
          stroke: 'transparent',
          strokeWidth: 0,
          type: piece.kind === 'square' ? 'rect' : 'polygon',
        };

        const patchLeft = snapPx(dx * cellPx);
        const patchTop = snapPx(dy * cellPx);

        if (piece.kind === 'square') {
          const w = snapPx(cellPx * (piece.spanW ?? 1));
          const h = snapPx(cellPx * (piece.spanH ?? 1));
          Object.assign(patch, {
            left: patchLeft,
            top: patchTop,
            width: w,
            height: h,
            originX: 'left',
            originY: 'top',
          });
        } else {
          const points = piece.kind === 'triangle-a'
            ? [
                { x: snapPx(0), y: snapPx(0) },
                { x: snapPx(cellPx), y: snapPx(0) },
                { x: snapPx(0), y: snapPx(cellPx) },
              ]
            : [
                { x: snapPx(cellPx), y: snapPx(0) },
                { x: snapPx(cellPx), y: snapPx(cellPx) },
                { x: snapPx(0), y: snapPx(cellPx) },
              ];
          Object.assign(patch, {
            left: patchLeft,
            top: patchTop,
            points,
            originX: 'left',
            originY: 'top',
          });
        }

        patches.push(patch);
      }
    }

    // Skip empty blocks with no valid patches
    if (patches.length === 0) continue;

    const groupId = `p2q-block-${by}-${bx}`;
    const groupLeft = snapPx(bx * blockSize * cellPx);
    const groupTop = snapPx(by * blockSize * cellPx);

    const group: Record<string, unknown> = {
      type: 'group',
      __isBlockGroup: true,
      __blockId: groupId,
      __photoQuiltBlock: { bx, by },
      id: groupId,
      subTargetCheck: true,
      interactive: true,
      originX: 'left',
      originY: 'top',
      left: groupLeft,
      top: groupTop,
      objects: patches,
    };

    objects.push(group);
  }

  return {
    version: '7.2.0',
    objects,
  };
}
