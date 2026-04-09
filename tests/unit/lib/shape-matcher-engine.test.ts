import {
  computeBlockSignature,
  polygonArea,
} from '@/lib/block-signature-registry';
import type { DetectedPiece, BlockSignature } from '@/lib/photo-layout-types';
import {
  matchBlockCell,
  extractBlockCells,
  runShapeCorrection,
  DEFAULT_CONFIDENCE_THRESHOLD,
} from '@/lib/shape-matcher-engine';

// ============================================================================
// Test Fixtures
// ============================================================================

/** A simple 9-patch block SVG (3x3 grid of squares). */
const NINE_PATCH_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect x="0" y="0" width="100" height="100" fill="#505050" stroke="#333" stroke-width="1" data-shade="dark" data-role="patch"/>
  <rect x="100" y="0" width="100" height="100" fill="#E0E0E0" stroke="#333" stroke-width="1" data-shade="light" data-role="patch"/>
  <rect x="200" y="0" width="100" height="100" fill="#505050" stroke="#333" stroke-width="1" data-shade="dark" data-role="patch"/>
  <rect x="0" y="100" width="100" height="100" fill="#E0E0E0" stroke="#333" stroke-width="1" data-shade="light" data-role="patch"/>
  <rect x="100" y="100" width="100" height="100" fill="#505050" stroke="#333" stroke-width="1" data-shade="dark" data-role="patch"/>
  <rect x="200" y="100" width="100" height="100" fill="#E0E0E0" stroke="#333" stroke-width="1" data-shade="light" data-role="patch"/>
  <rect x="0" y="200" width="100" height="100" fill="#505050" stroke="#333" stroke-width="1" data-shade="dark" data-role="patch"/>
  <rect x="100" y="200" width="100" height="100" fill="#E0E0E0" stroke="#333" stroke-width="1" data-shade="light" data-role="patch"/>
  <rect x="200" y="200" width="100" height="100" fill="#505050" stroke="#333" stroke-width="1" data-shade="dark" data-role="patch"/>
</svg>`;

/** A 4-patch block SVG (2x2 grid). */
const FOUR_PATCH_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect x="0" y="0" width="150" height="150" fill="#505050" stroke="#333" stroke-width="1" data-shade="dark" data-role="patch"/>
  <rect x="150" y="0" width="150" height="150" fill="#E0E0E0" stroke="#333" stroke-width="1" data-shade="light" data-role="patch"/>
  <rect x="0" y="150" width="150" height="150" fill="#E0E0E0" stroke="#333" stroke-width="1" data-shade="light" data-role="patch"/>
  <rect x="150" y="150" width="150" height="150" fill="#505050" stroke="#333" stroke-width="1" data-shade="dark" data-role="patch"/>
</svg>`;

/** Creates a mock detected piece. */
function makePiece(
  id: string,
  contour: Array<{ x: number; y: number }>,
  area: number = 10000
): DetectedPiece {
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
    areaPx: area,
    dominantColor: '#808080',
  };
}

// ============================================================================
// polygonArea Tests
// ============================================================================

describe('polygonArea', () => {
  it('returns zero for empty points', () => {
    expect(polygonArea([])).toBe(0);
  });

  it('computes area of a 100x100 square', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(polygonArea(square)).toBe(10000);
  });

  it('computes area of a right triangle', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ];
    expect(polygonArea(triangle)).toBe(5000);
  });
});

// ============================================================================
// computeBlockSignature Tests
// ============================================================================

describe('computeBlockSignature', () => {
  it('parses a nine-patch block correctly', () => {
    const sig = computeBlockSignature('01_nine_patch', 'Nine Patch', NINE_PATCH_SVG);

    expect(sig.blockId).toBe('01_nine_patch');
    expect(sig.displayName).toBe('Nine Patch');
    expect(sig.patchCount).toBe(9);
    expect(sig.hasCurves).toBe(false);
    // All 9 patches are quads (4 vertices each)
    expect(sig.vertexDistribution.get(4)).toBe(9);
    // All patches are equal area → relative areas are all 1/9
    expect(sig.relativeAreas).toHaveLength(9);
    for (const area of sig.relativeAreas) {
      expect(area).toBeCloseTo(1 / 9, 4);
    }
    // Adjacency: each interior patch touches 4 neighbors, edge patches 2-3
    expect(sig.adjacencyPairs.length).toBeGreaterThan(0);
  });

  it('parses a four-patch block correctly', () => {
    const sig = computeBlockSignature('10_four_patch', 'Four Patch', FOUR_PATCH_SVG);

    expect(sig.patchCount).toBe(4);
    expect(sig.vertexDistribution.get(4)).toBe(4);
    expect(sig.relativeAreas).toHaveLength(4);
    for (const area of sig.relativeAreas) {
      expect(area).toBeCloseTo(0.25, 4);
    }
  });

  it('distinguishes nine-patch from four-patch', () => {
    const nine = computeBlockSignature('01_nine_patch', 'Nine Patch', NINE_PATCH_SVG);
    const four = computeBlockSignature('10_four_patch', 'Four Patch', FOUR_PATCH_SVG);

    expect(nine.patchCount).not.toBe(four.patchCount);
    expect(nine.adjacencyPairs.length).not.toBe(four.adjacencyPairs.length);
  });
});

// ============================================================================
// matchBlockCell Tests
// ============================================================================

describe('matchBlockCell', () => {
  const signatures = new Map<string, BlockSignature>();
  signatures.set(
    '01_nine_patch',
    computeBlockSignature('01_nine_patch', 'Nine Patch', NINE_PATCH_SVG)
  );
  signatures.set(
    '10_four_patch',
    computeBlockSignature('10_four_patch', 'Four Patch', FOUR_PATCH_SVG)
  );

  it('matches 9 detected squares to a nine-patch block', () => {
    // Simulate 9 detected pieces arranged in a 3x3 grid
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

    const result = matchBlockCell(pieces, signatures);

    expect(result).not.toBeNull();
    expect(result!.blockId).toBe('01_nine_patch');
    expect(result!.confidence).toBeGreaterThan(DEFAULT_CONFIDENCE_THRESHOLD);
  });

  it('matches 4 detected squares to a four-patch block', () => {
    const pieces: DetectedPiece[] = [
      makePiece('p0', [
        { x: 0, y: 0 },
        { x: 150, y: 0 },
        { x: 150, y: 150 },
        { x: 0, y: 150 },
      ]),
      makePiece('p1', [
        { x: 150, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 150 },
        { x: 150, y: 150 },
      ]),
      makePiece('p2', [
        { x: 0, y: 150 },
        { x: 150, y: 150 },
        { x: 150, y: 300 },
        { x: 0, y: 300 },
      ]),
      makePiece('p3', [
        { x: 150, y: 150 },
        { x: 300, y: 150 },
        { x: 300, y: 300 },
        { x: 150, y: 300 },
      ]),
    ];

    const result = matchBlockCell(pieces, signatures);

    expect(result).not.toBeNull();
    expect(result!.blockId).toBe('10_four_patch');
  });

  it('returns null for a piece count that matches no block', () => {
    // 2 pieces — doesn't match 9-patch or 4-patch
    const pieces: DetectedPiece[] = [
      makePiece('p0', [
        { x: 0, y: 0 },
        { x: 150, y: 0 },
        { x: 150, y: 150 },
        { x: 0, y: 150 },
      ]),
      makePiece('p1', [
        { x: 150, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 150 },
        { x: 150, y: 150 },
      ]),
    ];

    const result = matchBlockCell(pieces, signatures, {
      confidenceThreshold: 0.8,
    });

    expect(result).toBeNull();
  });

  it('handles noisy detections with slight vertex offsets', () => {
    // 9 pieces with slight noise (±3px)
    const pieces: DetectedPiece[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * 100 + (Math.random() * 6 - 3);
        const y = row * 100 + (Math.random() * 6 - 3);
        pieces.push(
          makePiece(`p-${row}-${col}`, [
            { x, y },
            { x: x + 98 + Math.random() * 4, y },
            { x: x + 98 + Math.random() * 4, y: y + 98 + Math.random() * 4 },
            { x, y: y + 98 + Math.random() * 4 },
          ])
        );
      }
    }

    const result = matchBlockCell(pieces, signatures);

    // Should still match nine-patch despite noise
    expect(result).not.toBeNull();
    expect(result!.blockId).toBe('01_nine_patch');
  });
});

// ============================================================================
// extractBlockCells Tests
// ============================================================================

describe('extractBlockCells', () => {
  it('extracts cells from a 3x3 grid', () => {
    const pieceMap = new Map<string, DetectedPiece>();
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const id = `p-${row}-${col}`;
        pieceMap.set(id, makePiece(id, [{ x: 0, y: 0 }]));
      }
    }

    const grid = {
      cells: Array.from({ length: 9 }, (_, i) => ({
        row: Math.floor(i / 3),
        col: i % 3,
        pieceIds: [`p-${Math.floor(i / 3)}-${i % 3}`],
      })),
    };

    const cells = extractBlockCells(grid, pieceMap);

    expect(cells).toHaveLength(9);
    expect(cells[0].cellKey).toBe('0,0');
    expect(cells[8].cellKey).toBe('2,2');
  });

  it('skips cells with no matching pieces', () => {
    const pieceMap = new Map<string, DetectedPiece>();
    pieceMap.set('p0', makePiece('p0', [{ x: 0, y: 0 }]));

    const grid = {
      cells: [
        { row: 0, col: 0, pieceIds: ['p0'] },
        { row: 0, col: 1, pieceIds: ['missing'] },
      ],
    };

    const cells = extractBlockCells(grid, pieceMap);
    expect(cells).toHaveLength(1);
  });
});

// ============================================================================
// runShapeCorrection Tests
// ============================================================================

describe('runShapeCorrection', () => {
  const signatures = new Map<string, BlockSignature>();
  signatures.set(
    '01_nine_patch',
    computeBlockSignature('01_nine_patch', 'Nine Patch', NINE_PATCH_SVG)
  );

  it('matches cells and reports unmatched cells', () => {
    const pieceMap = new Map<string, DetectedPiece>();
    // 9 pieces for a 3x3 grid (matching nine-patch)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const id = `p-${row}-${col}`;
        const x = col * 100;
        const y = row * 100;
        pieceMap.set(
          id,
          makePiece(id, [
            { x, y },
            { x: x + 100, y },
            { x: x + 100, y: y + 100 },
            { x, y: y + 100 },
          ])
        );
      }
    }

    const blockCells = [
      {
        cellKey: '0,0',
        row: 0,
        col: 0,
        pieceIds: Array.from({ length: 9 }, (_, i) => `p-${Math.floor(i / 3)}-${i % 3}`),
        boundsPx: { x: 0, y: 0, width: 300, height: 300 },
      },
    ];

    const result = runShapeCorrection(blockCells, pieceMap, signatures);

    expect(result.blockMatches.size).toBe(1);
    expect(result.blockMatches.get('0,0')?.blockId).toBe('01_nine_patch');
    expect(result.unmatchedCellKeys).toHaveLength(0);
    expect(result.correctedPieces.length).toBe(9); // 9 patches from nine-patch
  });

  it('reports unmatched cells when no block matches', () => {
    const pieceMap = new Map<string, DetectedPiece>();
    // Only 2 pieces — won't match any block
    pieceMap.set('p0', makePiece('p0', [{ x: 0, y: 0 }]));
    pieceMap.set('p1', makePiece('p1', [{ x: 100, y: 0 }]));

    const blockCells = [
      {
        cellKey: '0,0',
        row: 0,
        col: 0,
        pieceIds: ['p0', 'p1'],
        boundsPx: { x: 0, y: 0, width: 200, height: 100 },
      },
    ];

    const result = runShapeCorrection(blockCells, pieceMap, signatures);

    expect(result.blockMatches.size).toBe(0);
    expect(result.unmatchedCellKeys).toContain('0,0');
  });
});
