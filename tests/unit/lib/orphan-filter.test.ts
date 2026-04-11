import { filterOrphanPieces } from '@/lib/orphan-filter';
import type { DetectedPiece } from '@/lib/photo-layout-types';

// ============================================================================
// Test Helpers
// ============================================================================

/** Create a mock detected piece from a contour. */
function makePiece(id: string, contour: Array<{ x: number; y: number }>): DetectedPiece {
  const xs = contour.map((p) => p.x);
  const ys = contour.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    id,
    contour: Object.freeze(contour),
    boundingRect: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    centroid: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    },
    areaPx: (maxX - minX) * (maxY - minY),
    dominantColor: '#808080',
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('filterOrphanPieces', () => {
  it('returns empty result for no pieces', () => {
    const result = filterOrphanPieces([]);

    expect(result.pieces).toEqual([]);
    expect(result.orphanIds).toEqual([]);
    expect(result.orphanCount).toBe(0);
  });

  it('marks a single piece as orphan (no neighbor possible)', () => {
    const piece = makePiece('p0', [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]);

    const result = filterOrphanPieces([piece]);

    expect(result.orphanCount).toBe(1);
    expect(result.orphanIds).toContain('p0');
    expect(result.pieces).toHaveLength(0);
  });

  it('keeps two adjacent squares (share a common edge)', () => {
    const a = makePiece('a', [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]);
    const b = makePiece('b', [
      { x: 100, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 100, y: 100 },
    ]);

    const result = filterOrphanPieces([a, b]);

    expect(result.orphanCount).toBe(0);
    expect(result.pieces).toHaveLength(2);
    expect(result.pieces.map((p) => p.id)).toContain('a');
    expect(result.pieces.map((p) => p.id)).toContain('b');
  });

  it('removes two distant pieces (no shared edge)', () => {
    const a = makePiece('a', [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 0, y: 50 },
    ]);
    const b = makePiece('b', [
      { x: 200, y: 200 },
      { x: 250, y: 200 },
      { x: 250, y: 250 },
      { x: 200, y: 250 },
    ]);

    const result = filterOrphanPieces([a, b]);

    expect(result.orphanCount).toBe(2);
    expect(result.orphanIds).toContain('a');
    expect(result.orphanIds).toContain('b');
    expect(result.pieces).toHaveLength(0);
  });

  it('keeps connected pieces and removes isolated ones', () => {
    // 3-piece chain: A-B-C (all connected)
    const a = makePiece('a', [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]);
    const b = makePiece('b', [
      { x: 100, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 100, y: 100 },
    ]);
    const c = makePiece('c', [
      { x: 200, y: 0 },
      { x: 300, y: 0 },
      { x: 300, y: 100 },
      { x: 200, y: 100 },
    ]);
    // Orphan floating far away
    const orphan = makePiece('orphan', [
      { x: 500, y: 500 },
      { x: 550, y: 500 },
      { x: 550, y: 550 },
      { x: 500, y: 550 },
    ]);

    const result = filterOrphanPieces([a, b, c, orphan]);

    expect(result.orphanCount).toBe(1);
    expect(result.orphanIds).toContain('orphan');
    expect(result.pieces).toHaveLength(3);
  });

  it('handles pieces within tolerance boundary', () => {
    // Two pieces with a 5px gap — within 8px tolerance
    const a = makePiece('a', [
      { x: 0, y: 0 },
      { x: 98, y: 0 },
      { x: 98, y: 100 },
      { x: 0, y: 100 },
    ]);
    const b = makePiece('b', [
      { x: 103, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 103, y: 100 },
    ]);

    const result = filterOrphanPieces([a, b]);

    // 5px gap < 8px tolerance → should be considered connected
    expect(result.orphanCount).toBe(0);
    expect(result.pieces).toHaveLength(2);
  });

  it('rejects pieces outside tolerance', () => {
    // Two pieces with a 15px gap — beyond 8px tolerance
    const a = makePiece('a', [
      { x: 0, y: 0 },
      { x: 90, y: 0 },
      { x: 90, y: 100 },
      { x: 0, y: 100 },
    ]);
    const b = makePiece('b', [
      { x: 105, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 105, y: 100 },
    ]);

    const result = filterOrphanPieces([a, b], { tolerance: 8 });

    // 15px gap > 8px tolerance → both orphans
    expect(result.orphanCount).toBe(2);
    expect(result.pieces).toHaveLength(0);
  });

  it('handles a 3x3 grid of connected pieces', () => {
    const pieces: DetectedPiece[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * 100;
        const y = row * 100;
        pieces.push(
          makePiece(`p-${row}-${col}`, [
            { x, y },
            { x: x + 100, y },
            { x: x + 100, y: y + 100 },
            { x, y: y + 100 },
          ])
        );
      }
    }

    const result = filterOrphanPieces(pieces);

    expect(result.orphanCount).toBe(0);
    expect(result.pieces).toHaveLength(9);
  });

  it('handles custom tolerance override', () => {
    // Two pieces with a 12px gap
    const a = makePiece('a', [
      { x: 0, y: 0 },
      { x: 94, y: 0 },
      { x: 94, y: 100 },
      { x: 0, y: 100 },
    ]);
    const b = makePiece('b', [
      { x: 106, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 106, y: 100 },
    ]);

    // Default 8px tolerance → both orphans
    const defaultResult = filterOrphanPieces([a, b], { tolerance: 8 });
    expect(defaultResult.orphanCount).toBe(2);

    // Custom 15px tolerance → connected
    const customResult = filterOrphanPieces([a, b], { tolerance: 15 });
    expect(customResult.orphanCount).toBe(0);
    expect(customResult.pieces).toHaveLength(2);
  });

  it('returns immutable result arrays', () => {
    const a = makePiece('a', [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]);

    const result = filterOrphanPieces([a]);

    // Should not be able to mutate the returned arrays
    expect(() => {
      (result.pieces as DetectedPiece[]).push(a);
    }).toThrow();
    expect(() => {
      (result.orphanIds as string[]).push('x');
    }).toThrow();
  });

  it('handles multiple orphans in a real-world quilt scenario', () => {
    // Simulate a real quilt with 4 pieces + 3 noise artifacts
    const quilt = [
      makePiece('q1', [
        { x: 0, y: 0 },
        { x: 150, y: 0 },
        { x: 150, y: 150 },
        { x: 0, y: 150 },
      ]),
      makePiece('q2', [
        { x: 150, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 150 },
        { x: 150, y: 150 },
      ]),
      makePiece('q3', [
        { x: 0, y: 150 },
        { x: 150, y: 150 },
        { x: 150, y: 300 },
        { x: 0, y: 300 },
      ]),
      makePiece('q4', [
        { x: 150, y: 150 },
        { x: 300, y: 150 },
        { x: 300, y: 300 },
        { x: 150, y: 300 },
      ]),
    ];
    const noise = [
      makePiece('noise-dust', [
        { x: 500, y: 500 },
        { x: 510, y: 500 },
        { x: 510, y: 510 },
        { x: 500, y: 510 },
      ]),
      makePiece('noise-shadow', [
        { x: 600, y: 20 },
        { x: 620, y: 20 },
        { x: 620, y: 40 },
        { x: 600, y: 40 },
      ]),
      makePiece('noise-lint', [
        { x: 10, y: 400 },
        { x: 15, y: 400 },
        { x: 15, y: 405 },
        { x: 10, y: 405 },
      ]),
    ];

    const result = filterOrphanPieces([...quilt, ...noise]);

    expect(result.orphanCount).toBe(3);
    expect(result.orphanIds).toContain('noise-dust');
    expect(result.orphanIds).toContain('noise-shadow');
    expect(result.orphanIds).toContain('noise-lint');
    expect(result.pieces).toHaveLength(4);
    expect(result.pieces.map((p) => p.id).sort()).toEqual(['q1', 'q2', 'q3', 'q4']);
  });
});
