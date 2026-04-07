import {
  resolveSelection,
  isLayoutArea,
  isUserBlock,
  isPiece,
  readLayoutRole,
  readLayoutAreaId,
  readBorderIndex,
  readInLayoutCellId,
} from '@/lib/canvas-selection';
import type { Canvas as FabricCanvas, FabricObject } from 'fabric';

// ── Test fixtures ────────────────────────────────────────────────

function makeLayoutCell(id = 'cell-0-0', extra: Record<string, unknown> = {}): FabricObject {
  return {
    id,
    type: 'rect',
    _layoutRendererElement: true,
    _layoutAreaId: id,
    _layoutAreaRole: 'block-cell',
    ...extra,
  } as unknown as FabricObject;
}

function makeSashing(id = 'sashing-0'): FabricObject {
  return {
    id,
    type: 'rect',
    _layoutRendererElement: true,
    _layoutAreaId: id,
    _layoutAreaRole: 'sashing',
  } as unknown as FabricObject;
}

function makeBorder(id = 'border-0-top', borderIndex = 0): FabricObject {
  return {
    id,
    type: 'rect',
    _layoutRendererElement: true,
    _layoutAreaId: id,
    _layoutAreaRole: 'border',
    _layoutBorderIndex: borderIndex,
  } as unknown as FabricObject;
}

function makeBinding(id = 'binding-top'): FabricObject {
  return {
    id,
    type: 'rect',
    _layoutRendererElement: true,
    _layoutAreaId: id,
    _layoutAreaRole: 'binding',
  } as unknown as FabricObject;
}

function makeUserBlock(id = 'block-1', cellId?: string): FabricObject {
  return {
    id,
    type: 'group',
    subTargetCheck: true,
    ...(cellId ? { _inLayoutCellId: cellId } : {}),
  } as unknown as FabricObject;
}

function makePiece(parent: FabricObject, id = 'piece-1'): FabricObject {
  return {
    id,
    type: 'polygon',
    group: parent,
  } as unknown as FabricObject;
}

function makeFreeShape(id = 'shape-1'): FabricObject {
  return {
    id,
    type: 'rect',
  } as unknown as FabricObject;
}

function makeCanvas(objects: FabricObject[]): FabricCanvas {
  return {
    getObjects: () => objects,
    getActiveObjects: () => [],
  } as unknown as FabricCanvas;
}

// ── Tests ────────────────────────────────────────────────────────

describe('canvas-selection helpers', () => {
  describe('isLayoutArea', () => {
    it('returns true for tagged layout objects', () => {
      expect(isLayoutArea(makeLayoutCell())).toBe(true);
      expect(isLayoutArea(makeSashing())).toBe(true);
      expect(isLayoutArea(makeBinding())).toBe(true);
    });
    it('returns false for user blocks and free shapes', () => {
      expect(isLayoutArea(makeUserBlock())).toBe(false);
      expect(isLayoutArea(makeFreeShape())).toBe(false);
    });
    it('returns false for null/undefined', () => {
      expect(isLayoutArea(null)).toBe(false);
      expect(isLayoutArea(undefined)).toBe(false);
    });
  });

  describe('isUserBlock', () => {
    it('returns true for groups with subTargetCheck', () => {
      expect(isUserBlock(makeUserBlock())).toBe(true);
    });
    it('returns false for layout areas', () => {
      expect(isUserBlock(makeLayoutCell())).toBe(false);
    });
    it('returns false for free shapes', () => {
      expect(isUserBlock(makeFreeShape())).toBe(false);
    });
  });

  describe('isPiece', () => {
    it('returns true for sub-objects of a user block', () => {
      const block = makeUserBlock();
      const piece = makePiece(block);
      expect(isPiece(piece)).toBe(true);
    });
    it('returns false for sub-objects of layout areas', () => {
      const cell = makeLayoutCell();
      const child = makePiece(cell);
      expect(isPiece(child)).toBe(false);
    });
    it('returns false for top-level objects', () => {
      expect(isPiece(makeFreeShape())).toBe(false);
      expect(isPiece(makeUserBlock())).toBe(false);
    });
  });

  describe('readLayoutRole / readLayoutAreaId', () => {
    it('reads tags from layout-area objects', () => {
      const sash = makeSashing('s-1');
      expect(readLayoutRole(sash)).toBe('sashing');
      expect(readLayoutAreaId(sash)).toBe('s-1');
    });
    it('returns null for non-layout objects', () => {
      expect(readLayoutRole(makeUserBlock())).toBeNull();
      expect(readLayoutAreaId(makeUserBlock())).toBeNull();
    });
  });

  describe('readBorderIndex', () => {
    it('returns the index for tagged border strips', () => {
      expect(readBorderIndex(makeBorder('b-1', 2))).toBe(2);
    });
    it('returns undefined for objects without the tag', () => {
      expect(readBorderIndex(makeUserBlock())).toBeUndefined();
    });
  });

  describe('readInLayoutCellId', () => {
    it('returns the cell ID for placed blocks', () => {
      expect(readInLayoutCellId(makeUserBlock('b-1', 'cell-2-2'))).toBe('cell-2-2');
    });
    it('returns undefined for free blocks', () => {
      expect(readInLayoutCellId(makeUserBlock())).toBeUndefined();
    });
  });
});

describe('resolveSelection', () => {
  it('returns "none" for empty selection', () => {
    const canvas = makeCanvas([]);
    expect(resolveSelection(canvas, []).kind).toBe('none');
  });

  it('returns "none" when canvas is null', () => {
    expect(resolveSelection(null, ['anything']).kind).toBe('none');
  });

  it('resolves a selected block-cell', () => {
    const cell = makeLayoutCell('cell-1-2');
    const canvas = makeCanvas([cell]);
    const result = resolveSelection(canvas, ['cell-1-2']);
    expect(result.kind).toBe('block-cell');
    expect(result.layoutAreaId).toBe('cell-1-2');
    expect(result.layoutAreaRole).toBe('block-cell');
  });

  it('resolves sashing', () => {
    const sash = makeSashing('s-0');
    const canvas = makeCanvas([sash]);
    expect(resolveSelection(canvas, ['s-0']).kind).toBe('sashing');
  });

  it('resolves border with borderIndex', () => {
    const b = makeBorder('b-2-top', 2);
    const canvas = makeCanvas([b]);
    const r = resolveSelection(canvas, ['b-2-top']);
    expect(r.kind).toBe('border');
    expect(r.borderIndex).toBe(2);
  });

  it('resolves binding', () => {
    const b = makeBinding('binding-bottom');
    const canvas = makeCanvas([b]);
    expect(resolveSelection(canvas, ['binding-bottom']).kind).toBe('binding');
  });

  it('resolves a user-placed block group', () => {
    const block = makeUserBlock('blk-1', 'cell-0-0');
    const canvas = makeCanvas([block]);
    const r = resolveSelection(canvas, ['blk-1']);
    expect(r.kind).toBe('block');
    expect(r.inLayoutCellId).toBe('cell-0-0');
  });

  it('resolves a piece selection (sub-target inside a block)', () => {
    const block = makeUserBlock('blk-1');
    const piece = makePiece(block, 'piece-x');
    const canvas = makeCanvas([block, piece]);
    const r = resolveSelection(canvas, ['piece-x']);
    expect(r.kind).toBe('piece');
    expect(r.blockGroup).toBe(block);
  });

  it('resolves a free-form shape', () => {
    const shape = makeFreeShape('rect-1');
    const canvas = makeCanvas([shape]);
    expect(resolveSelection(canvas, ['rect-1']).kind).toBe('free-shape');
  });

  it('returns "mixed" for heterogeneous multi-selection', () => {
    const cell = makeLayoutCell('cell-1-1');
    const block = makeUserBlock('blk-1');
    const canvas = makeCanvas([cell, block]);
    const r = resolveSelection(canvas, ['cell-1-1', 'blk-1']);
    expect(r.kind).toBe('mixed');
  });

  it('collapses homogeneous multi-selection to a single kind', () => {
    const a = makeSashing('s-1');
    const b = makeSashing('s-2');
    const canvas = makeCanvas([a, b]);
    const r = resolveSelection(canvas, ['s-1', 's-2']);
    expect(r.kind).toBe('sashing');
    expect(r.objects.length).toBe(2);
  });

  it('falls back to active selection when ID lookup misses', () => {
    const block = makeUserBlock('blk-active');
    const canvas = {
      getObjects: () => [],
      getActiveObjects: () => [block],
    } as unknown as FabricCanvas;
    const r = resolveSelection(canvas, ['stale-id']);
    expect(r.kind).toBe('block');
  });
});
