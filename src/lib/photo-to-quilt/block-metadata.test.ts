import { describe, it, expect } from 'vitest';
import { patternResultToFabricJson } from '@/lib/photo-to-quilt/to-fabric';

describe('photo-to-quilt block metadata', () => {
  it('marks all top-level objects as block groups with subTargetCheck', () => {
    const result = {
      cols: 6,
      rows: 6,
      blockSize: 3,
      pieceSizeInches: 2.5,
      palette: ['#d44', '#4a4', '#44a'],
      cells: [
        {
          x: 0,
          y: 0,
          pieces: [{ colorIndex: 0, kind: 'square' as const }],
        },
        {
          x: 1,
          y: 0,
          pieces: [
            { colorIndex: 1, kind: 'triangle-a' as const },
            { colorIndex: 2, kind: 'triangle-b' as const },
          ],
        },
      ],
    };

    const json = patternResultToFabricJson(result as never);
    const objects = (json.objects as unknown[]) ?? [];

    expect(objects.length).toBeGreaterThan(0);

    for (const obj of objects) {
      const meta = obj as Record<string, unknown>;
      expect(meta.__isBlockGroup).toBe(true);
      expect(meta.subTargetCheck).toBe(true);
      expect(meta.interactive).toBe(true);
      expect(meta.__photoQuiltBlock).toBeDefined();
      expect((meta.__photoQuiltBlock as Record<string, unknown>).bx).toBeDefined();
      expect((meta.__photoQuiltBlock as Record<string, unknown>).by).toBeDefined();
    }
  });

  it('marks all patches with correct metadata', () => {
    const result = {
      cols: 6,
      rows: 6,
      blockSize: 3,
      pieceSizeInches: 2.5,
      palette: ['#d44', '#4a4', '#44a'],
      cells: [
        {
          x: 0,
          y: 0,
          pieces: [{ colorIndex: 0, kind: 'square' as const }],
        },
        {
          x: 1,
          y: 0,
          pieces: [
            { colorIndex: 1, kind: 'triangle-a' as const },
            { colorIndex: 2, kind: 'triangle-b' as const },
          ],
        },
      ],
    };

    const json = patternResultToFabricJson(result as never);
    const objects = (json.objects as unknown[]) ?? [];

    for (const obj of objects) {
      const meta = obj as Record<string, unknown>;
      const patches = (meta.objects as unknown[]) ?? [];

      for (const patch of patches) {
        const patchMeta = patch as Record<string, unknown>;
        expect(patchMeta.__pieceRole).toBe('patch');
        expect(['square', 'triangle-a', 'triangle-b']).toContain(patchMeta.__pieceKind);
        expect(patchMeta.__photoQuiltCell).toBeDefined();
        expect((patchMeta.__photoQuiltCell as Record<string, unknown>).x).toBeDefined();
        expect((patchMeta.__photoQuiltCell as Record<string, unknown>).y).toBeDefined();
      }
    }
  });
});
