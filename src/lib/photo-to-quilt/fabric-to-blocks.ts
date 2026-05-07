export type BlockCell =
  | { kind: 'empty' }
  | { kind: 'square'; color: string }
  | { kind: 'hst'; ulColor?: string; lrColor?: string };

export interface BlockData {
  bx: number;
  by: number;
  cells: BlockCell[][];
}

interface FabricBlockGroup {
  __isBlockGroup: true;
  __photoQuiltBlock: { bx: number; by: number };
  _objects?: FabricPatch[];
  objects?: FabricPatch[];
  getObjects?: () => FabricPatch[];
}

export interface FabricPatch {
  __pieceRole: 'patch';
  __pieceKind: 'square' | 'triangle-a' | 'triangle-b';
  __photoQuiltCell: { x: number; y: number };
  __sizeInches?: number;
  fill: string;
}

function isFabricBlockGroup(obj: unknown): obj is FabricBlockGroup {
  if (!obj || typeof obj !== 'object') return false;
  const meta = obj as Record<string, unknown>;
  return meta.__isBlockGroup === true
    && typeof meta.__photoQuiltBlock === 'object'
    && meta.__photoQuiltBlock !== null;
}

export function isFabricPatch(obj: unknown): obj is FabricPatch {
  if (!obj || typeof obj !== 'object') return false;
  const meta = obj as Record<string, unknown>;
  return meta.__pieceRole === 'patch'
    && typeof meta.__pieceKind === 'string'
    && typeof meta.__photoQuiltCell === 'object'
    && meta.__photoQuiltCell !== null;
}

function makeEmptyGrid(): BlockCell[][] {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, (): BlockCell => ({
      kind: 'empty',
    })),
  );
}

export function extractBlocksFromFabricObjects(
  objects: unknown[],
): BlockData[] {
  const blocks: BlockData[] = [];

  for (const obj of objects) {
    if (!isFabricBlockGroup(obj)) continue;

    const { bx, by } = obj.__photoQuiltBlock;
    if (bx === undefined || by === undefined) continue;

    const cells = makeEmptyGrid();
    const children = obj._objects ?? obj.objects ?? obj.getObjects?.() ?? [];

    for (const child of children) {
      if (!isFabricPatch(child)) continue;

      const { x, y } = child.__photoQuiltCell;
      if (x === undefined || y === undefined) continue;

      const dx = x - bx * 3;
      const dy = y - by * 3;
      if (dx < 0 || dx >= 3 || dy < 0 || dy >= 3) continue;

      const fill = child.fill || '#ffffff';
      const pieceKind = child.__pieceKind;
      const acc = cells[dy][dx];

      if (pieceKind === 'square') {
        cells[dy][dx] = { kind: 'square', color: fill };
      } else if (pieceKind === 'triangle-a') {
        cells[dy][dx] = {
          kind: 'hst',
          ulColor: fill,
          lrColor: acc.kind === 'hst' ? acc.lrColor : undefined,
        };
      } else if (pieceKind === 'triangle-b') {
        cells[dy][dx] = {
          kind: 'hst',
          ulColor: acc.kind === 'hst' ? acc.ulColor : undefined,
          lrColor: fill,
        };
      }
    }

    blocks.push({ bx, by, cells });
  }

  return blocks;
}

export function computeQuiltLayout(blocks: BlockData[]): {
  rows: number;
  cols: number;
} {
  if (blocks.length === 0) return { rows: 1, cols: 1 };
  return {
    rows: Math.max(...blocks.map((b) => b.by)) + 1,
    cols: Math.max(...blocks.map((b) => b.bx)) + 1,
  };
}

export function extractPieceSizeInches(objects: unknown[]): number | null {
  for (const obj of objects) {
    if (!isFabricBlockGroup(obj)) continue;
    const children = obj._objects ?? obj.objects ?? obj.getObjects?.() ?? [];
    for (const child of children) {
      if (isFabricPatch(child) && child.__sizeInches !== undefined) {
        return child.__sizeInches;
      }
    }
  }
  return null;
}
