import { beforeEach, describe, expect, it } from 'vitest';
import {
  composeInteractivePatch,
  usePhotoDesignStore,
} from '@/stores/photoDesignStore';
import type { EngineOutput, GridSpec, Patch, Point } from '@/lib/photo-to-design/types';

const GRID: GridSpec = { cellSize: 40, offsetX: 0, offsetY: 0, cols: 10, rows: 10 };

const SQUARE: Point[] = [
  { x: 0, y: 0 },
  { x: 40, y: 0 },
  { x: 40, y: 40 },
  { x: 0, y: 40 },
];

const TRIANGLE: Point[] = [
  { x: 0, y: 0 },
  { x: 80, y: 0 },
  { x: 40, y: 80 },
];

function patch(id: number, templateId: string, vertices: Point[]): Patch {
  return { id, templateId, vertices, svgPath: 'M0 0 Z' };
}

function engineOutputWith(patches: Patch[]): EngineOutput {
  return { patches, gridSpec: GRID, processingTime: 42 };
}

function resetStore(): void {
  usePhotoDesignStore.getState().reset();
}

// ---------------------------------------------------------------------------
// composeInteractivePatch
// ---------------------------------------------------------------------------

describe('composeInteractivePatch', () => {
  it('mints the first id/templateId for an empty result set', () => {
    const next = composeInteractivePatch([], {
      vertices: SQUARE,
      svgPath: 'M0 0 Z',
    });
    expect(next.id).toBe(1);
    expect(next.templateId).toBe('t1');
  });

  it('increments the max existing id', () => {
    const existing = [patch(7, 't1', SQUARE), patch(12, 't2', TRIANGLE)];
    const next = composeInteractivePatch(existing, {
      vertices: SQUARE.map((p) => ({ x: p.x + 100, y: p.y + 100 })),
      svgPath: 'M100 100 Z',
    });
    expect(next.id).toBe(13);
  });

  it('reuses an existing templateId when the candidate matches a shape', () => {
    const existing = [patch(1, 't1', SQUARE)];
    const translated = SQUARE.map((p) => ({ x: p.x + 200, y: p.y + 200 }));
    const next = composeInteractivePatch(existing, {
      vertices: translated,
      svgPath: 'M200 200 Z',
    });
    expect(next.templateId).toBe('t1');
  });

  it('mints a fresh templateId for a genuinely new shape', () => {
    const existing = [patch(1, 't1', SQUARE), patch(2, 't2', TRIANGLE)];
    const diagonalSquare: Point[] = [
      { x: 20, y: 0 },
      { x: 40, y: 20 },
      { x: 20, y: 40 },
      { x: 0, y: 20 },
    ];
    const next = composeInteractivePatch(existing, {
      vertices: diagonalSquare,
      svgPath: 'M20 0 Z',
    });
    expect(next.templateId).toBe('t3');
  });

  it('skips non-"t<n>" templateIds when picking the next number', () => {
    const existing = [patch(1, 'custom-a', SQUARE)];
    const next = composeInteractivePatch(existing, {
      vertices: TRIANGLE,
      svgPath: 'M0 0 Z',
    });
    expect(next.templateId).toBe('t1');
  });
});

// ---------------------------------------------------------------------------
// undo stack behaviour
// ---------------------------------------------------------------------------

describe('applyInteractivePatch / undoLastPatch', () => {
  beforeEach(() => {
    resetStore();
  });

  it('is a no-op when there is no existing result', () => {
    usePhotoDesignStore.getState().applyInteractivePatch({
      vertices: SQUARE,
      svgPath: 'M0 0 Z',
    });
    expect(usePhotoDesignStore.getState().result).toBeNull();
    expect(usePhotoDesignStore.getState().patchUndoStack).toHaveLength(0);
  });

  it('appends a new patch and snapshots the prior set onto the undo stack', () => {
    const initial: Patch[] = [patch(1, 't1', SQUARE)];
    usePhotoDesignStore.getState().setResult(engineOutputWith(initial));
    usePhotoDesignStore.getState().applyInteractivePatch({
      vertices: TRIANGLE,
      svgPath: 'M0 0 Z',
    });
    const s = usePhotoDesignStore.getState();
    expect(s.result?.patches).toHaveLength(2);
    expect(s.patchUndoStack).toHaveLength(1);
    expect(s.patchUndoStack[0]).toEqual(initial);
  });

  it('restores the prior patch set on undo (deep equality)', () => {
    const initial: Patch[] = [patch(1, 't1', SQUARE)];
    usePhotoDesignStore.getState().setResult(engineOutputWith(initial));
    usePhotoDesignStore.getState().applyInteractivePatch({
      vertices: TRIANGLE,
      svgPath: 'M0 0 Z',
    });
    usePhotoDesignStore.getState().undoLastPatch();

    const s = usePhotoDesignStore.getState();
    expect(s.result?.patches).toEqual(initial);
    expect(s.patchUndoStack).toHaveLength(0);
  });

  it('undoes multiple interactions in LIFO order', () => {
    const initial: Patch[] = [patch(1, 't1', SQUARE)];
    usePhotoDesignStore.getState().setResult(engineOutputWith(initial));
    usePhotoDesignStore.getState().applyInteractivePatch({
      vertices: TRIANGLE,
      svgPath: 'M0 0 Z',
    });
    const afterOne = usePhotoDesignStore.getState().result?.patches ?? [];
    usePhotoDesignStore.getState().applyInteractivePatch({
      vertices: [
        { x: 200, y: 200 },
        { x: 240, y: 200 },
        { x: 240, y: 240 },
      ],
      svgPath: 'M200 200 Z',
    });

    expect(usePhotoDesignStore.getState().result?.patches).toHaveLength(3);

    usePhotoDesignStore.getState().undoLastPatch();
    expect(usePhotoDesignStore.getState().result?.patches).toEqual(afterOne);

    usePhotoDesignStore.getState().undoLastPatch();
    expect(usePhotoDesignStore.getState().result?.patches).toEqual(initial);
  });

  it('is a no-op when the undo stack is empty', () => {
    const initial: Patch[] = [patch(1, 't1', SQUARE)];
    usePhotoDesignStore.getState().setResult(engineOutputWith(initial));
    usePhotoDesignStore.getState().undoLastPatch();
    const s = usePhotoDesignStore.getState();
    expect(s.result?.patches).toEqual(initial);
    expect(s.patchUndoStack).toHaveLength(0);
  });

  it('caps the undo stack at the session limit (50)', () => {
    usePhotoDesignStore.getState().setResult(engineOutputWith([]));
    for (let i = 0; i < 60; i++) {
      usePhotoDesignStore.getState().applyInteractivePatch({
        vertices: [
          { x: i * 40, y: 0 },
          { x: i * 40 + 40, y: 0 },
          { x: i * 40, y: 40 },
        ],
        svgPath: 'M0 0 Z',
      });
    }
    const s = usePhotoDesignStore.getState();
    expect(s.patchUndoStack.length).toBeLessThanOrEqual(50);
    expect(s.result?.patches.length).toBe(60);
  });

  it('resetting the result clears the undo stack', () => {
    usePhotoDesignStore.getState().setResult(engineOutputWith([patch(1, 't1', SQUARE)]));
    usePhotoDesignStore.getState().applyInteractivePatch({
      vertices: TRIANGLE,
      svgPath: 'M0 0 Z',
    });
    expect(usePhotoDesignStore.getState().patchUndoStack).toHaveLength(1);
    usePhotoDesignStore.getState().setResult(engineOutputWith([]));
    expect(usePhotoDesignStore.getState().patchUndoStack).toHaveLength(0);
  });
});
