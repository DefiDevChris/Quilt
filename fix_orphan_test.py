import re

with open('tests/unit/lib/orphan-filter.test.ts', 'r') as f:
    content = f.read()

# Fix rejects pieces outside tolerance test
bad_test = """  it('rejects pieces outside tolerance', () => {
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

    const result = filterOrphanPieces([a, b]);

    // 15px gap > 8px tolerance → both orphans
    expect(result.orphanCount).toBe(2);
    expect(result.pieces).toHaveLength(0);
  });"""

good_test = """  it('rejects pieces outside tolerance', () => {
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
  });"""

content = content.replace(bad_test, good_test)

# Fix handles custom tolerance override test
bad_custom_test = """  it('handles custom tolerance override', () => {
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
    const defaultResult = filterOrphanPieces([a, b]);
    expect(defaultResult.orphanCount).toBe(2);

    // Custom 15px tolerance → connected
    const customResult = filterOrphanPieces([a, b], { tolerance: 15 });
    expect(customResult.orphanCount).toBe(0);
    expect(customResult.pieces).toHaveLength(2);
  });"""

good_custom_test = """  it('handles custom tolerance override', () => {
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
  });"""

content = content.replace(bad_custom_test, good_custom_test)

with open('tests/unit/lib/orphan-filter.test.ts', 'w') as f:
    f.write(content)
