import { describe, it, expect } from 'vitest';
import { computeResize, type ResizeInput, type CanvasObjectData } from '@/lib/resize-utils';

function makeObject(overrides: Partial<CanvasObjectData> = {}): CanvasObjectData {
  return {
    id: 'obj-1',
    left: 0,
    top: 0,
    scaleX: 1,
    scaleY: 1,
    width: 96,
    height: 96,
    type: 'rect',
    ...overrides,
  };
}

function makeInput(overrides: Partial<ResizeInput> = {}): ResizeInput {
  return {
    currentWidth: 48,
    currentHeight: 48,
    newWidth: 60,
    newHeight: 60,
    mode: 'scale',
    lockAspectRatio: true,
    layoutType: 'free-form',
    layoutSettings: null,
    objects: [],
    tilePattern: false,
    ...overrides,
  };
}

describe('resize-utils', () => {
  describe('scale mode', () => {
    it('returns updated canvas dimensions', () => {
      const result = computeResize(makeInput());
      expect(result.newCanvasWidth).toBe(60);
      expect(result.newCanvasHeight).toBe(60);
    });

    it('scales object position proportionally', () => {
      const obj = makeObject({ left: 96, top: 192 });
      const result = computeResize(makeInput({ objects: [obj] }));
      expect(result.objects[0].left).toBe(120);
      expect(result.objects[0].top).toBe(240);
    });

    it('scales object scaleX/scaleY proportionally', () => {
      const obj = makeObject({ scaleX: 2, scaleY: 1.5 });
      const result = computeResize(makeInput({ objects: [obj] }));
      expect(result.objects[0].scaleX).toBe(2.5);
      expect(result.objects[0].scaleY).toBe(1.875);
    });

    it('preserves object id, width, height, and type', () => {
      const obj = makeObject({ id: 'abc', width: 200, height: 100, type: 'polygon' });
      const result = computeResize(makeInput({ objects: [obj] }));
      expect(result.objects[0].id).toBe('abc');
      expect(result.objects[0].width).toBe(200);
      expect(result.objects[0].height).toBe(100);
      expect(result.objects[0].type).toBe('polygon');
    });

    it('handles non-uniform scaling when aspect ratio unlocked', () => {
      const obj = makeObject({ left: 96, top: 96, scaleX: 1, scaleY: 1 });
      const result = computeResize(
        makeInput({
          newWidth: 60,
          newHeight: 96,
          lockAspectRatio: false,
          objects: [obj],
        })
      );
      expect(result.objects[0].left).toBe(120);
      expect(result.objects[0].top).toBe(192);
      expect(result.objects[0].scaleX).toBe(1.25);
      expect(result.objects[0].scaleY).toBe(2.0);
    });

    it('handles empty objects array', () => {
      const result = computeResize(makeInput({ objects: [] }));
      expect(result.objects).toEqual([]);
      expect(result.newCanvasWidth).toBe(60);
      expect(result.newCanvasHeight).toBe(60);
    });

    it('scales multiple objects independently', () => {
      const objects = [
        makeObject({ id: 'a', left: 0, top: 0, scaleX: 1, scaleY: 1 }),
        makeObject({ id: 'b', left: 480, top: 480, scaleX: 0.5, scaleY: 0.5 }),
      ];
      const result = computeResize(makeInput({ objects }));
      expect(result.objects).toHaveLength(2);
      expect(result.objects[0].id).toBe('a');
      expect(result.objects[1].id).toBe('b');
      expect(result.objects[1].left).toBe(600);
      expect(result.objects[1].scaleX).toBe(0.625);
    });

    it('returns empty addedCells and null layoutSettings for scale mode', () => {
      const result = computeResize(makeInput());
      expect(result.addedCells).toEqual([]);
      expect(result.layoutSettings).toBeNull();
    });
  });

  describe('add-blocks mode', () => {
    it('returns updated canvas dimensions', () => {
      const result = computeResize(makeInput({ mode: 'add-blocks', newWidth: 60, newHeight: 60 }));
      expect(result.newCanvasWidth).toBe(60);
      expect(result.newCanvasHeight).toBe(60);
    });

    it('preserves existing object positions and scale', () => {
      const obj = makeObject({ left: 96, top: 96, scaleX: 2, scaleY: 2 });
      const result = computeResize(makeInput({ mode: 'add-blocks', objects: [obj] }));
      expect(result.objects[0].left).toBe(96);
      expect(result.objects[0].top).toBe(96);
      expect(result.objects[0].scaleX).toBe(2);
      expect(result.objects[0].scaleY).toBe(2);
    });

    it('computes new layout settings for grid layout', () => {
      const result = computeResize(
        makeInput({
          mode: 'add-blocks',
          currentWidth: 48,
          currentHeight: 48,
          newWidth: 60,
          newHeight: 60,
          layoutType: 'grid',
          layoutSettings: { rows: 4, cols: 4, blockSize: 12 },
        })
      );
      expect(result.layoutSettings).toEqual({ rows: 5, cols: 5, blockSize: 12 });
    });

    it('computes added cells for grid layout', () => {
      const result = computeResize(
        makeInput({
          mode: 'add-blocks',
          currentWidth: 48,
          currentHeight: 48,
          newWidth: 60,
          newHeight: 60,
          layoutType: 'grid',
          layoutSettings: { rows: 4, cols: 4, blockSize: 12 },
        })
      );
      // 5x5 - 4x4 = 25 - 16 = 9 new cells
      expect(result.addedCells).toHaveLength(9);
    });

    it('returns no added cells for free-form layout', () => {
      const result = computeResize(
        makeInput({
          mode: 'add-blocks',
          layoutType: 'free-form',
          layoutSettings: null,
        })
      );
      expect(result.addedCells).toEqual([]);
      expect(result.layoutSettings).toBeNull();
    });

    it('computes new layout settings for sashing layout', () => {
      const result = computeResize(
        makeInput({
          mode: 'add-blocks',
          currentWidth: 48,
          currentHeight: 48,
          newWidth: 60,
          newHeight: 60,
          layoutType: 'sashing',
          layoutSettings: { rows: 4, cols: 4, blockSize: 12 },
        })
      );
      expect(result.layoutSettings).toEqual({ rows: 5, cols: 5, blockSize: 12 });
    });

    it('computes new layout for on-point layout', () => {
      const result = computeResize(
        makeInput({
          mode: 'add-blocks',
          currentWidth: 48,
          currentHeight: 48,
          newWidth: 60,
          newHeight: 60,
          layoutType: 'on-point',
          layoutSettings: { rows: 4, cols: 4, blockSize: 12 },
        })
      );
      expect(result.layoutSettings).toEqual({ rows: 5, cols: 5, blockSize: 12 });
    });
  });

  describe('validation', () => {
    it('clamps minimum dimensions to 1', () => {
      const result = computeResize(makeInput({ newWidth: 0.5, newHeight: 0.5 }));
      expect(result.newCanvasWidth).toBe(1);
      expect(result.newCanvasHeight).toBe(1);
    });

    it('clamps maximum dimensions to 200', () => {
      const result = computeResize(makeInput({ newWidth: 300, newHeight: 250 }));
      expect(result.newCanvasWidth).toBe(200);
      expect(result.newCanvasHeight).toBe(200);
    });

    it('enforces aspect ratio lock when lockAspectRatio is true', () => {
      const result = computeResize(
        makeInput({
          currentWidth: 48,
          currentHeight: 48,
          newWidth: 60,
          newHeight: 72,
          lockAspectRatio: true,
        })
      );
      expect(result.newCanvasWidth).toBe(60);
      expect(result.newCanvasHeight).toBe(60);
    });

    it('allows independent width/height when aspect ratio unlocked', () => {
      const result = computeResize(
        makeInput({
          newWidth: 60,
          newHeight: 72,
          lockAspectRatio: false,
        })
      );
      expect(result.newCanvasWidth).toBe(60);
      expect(result.newCanvasHeight).toBe(72);
    });
  });
});
