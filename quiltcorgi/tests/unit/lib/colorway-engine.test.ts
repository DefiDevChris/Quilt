import { describe, it, expect } from 'vitest';
import {
  normalizeColor,
  spraycanRecolor,
  swapColors,
  randomizeColors,
  extractUniquePalette,
  eyedropperPick,
  type PatchColor,
  type ColorChange,
} from '@/lib/colorway-engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePatches(entries: Array<[string, string]>): PatchColor[] {
  return entries.map(([objectId, currentFill]) => ({ objectId, currentFill }));
}

// ---------------------------------------------------------------------------
// normalizeColor
// ---------------------------------------------------------------------------

describe('normalizeColor', () => {
  it('lowercases a 6-digit hex with hash', () => {
    expect(normalizeColor('#FF0000')).toBe('#ff0000');
  });

  it('keeps an already-lowercase 6-digit hex unchanged', () => {
    expect(normalizeColor('#ff0000')).toBe('#ff0000');
  });

  it('expands a 3-digit shorthand with hash', () => {
    expect(normalizeColor('#fff')).toBe('#ffffff');
  });

  it('expands a 3-digit shorthand and lowercases it', () => {
    expect(normalizeColor('#FFF')).toBe('#ffffff');
  });

  it('expands a mixed-case 3-digit shorthand', () => {
    expect(normalizeColor('#AbC')).toBe('#aabbcc');
  });

  it('adds a missing hash to a 6-digit hex', () => {
    expect(normalizeColor('FF0000')).toBe('#ff0000');
  });

  it('adds a missing hash to a 3-digit hex', () => {
    expect(normalizeColor('fff')).toBe('#ffffff');
  });

  it('handles pure black shorthand', () => {
    expect(normalizeColor('#000')).toBe('#000000');
  });

  it('handles pure white 6-digit', () => {
    expect(normalizeColor('#FFFFFF')).toBe('#ffffff');
  });

  it('handles mixed-case 6-digit without hash', () => {
    expect(normalizeColor('aAbBcC')).toBe('#aabbcc');
  });
});

// ---------------------------------------------------------------------------
// spraycanRecolor
// ---------------------------------------------------------------------------

describe('spraycanRecolor', () => {
  it('returns a change for every patch matching the target fill', () => {
    const patches = makePatches([
      ['p1', '#ff0000'],
      ['p2', '#ff0000'],
      ['p3', '#0000ff'],
    ]);
    const changes = spraycanRecolor(patches, '#ff0000', '#00ff00');
    expect(changes).toHaveLength(2);
    expect(changes.every((c) => c.newFill === '#00ff00')).toBe(true);
  });

  it('returns an empty array when no patches match', () => {
    const patches = makePatches([['p1', '#ff0000']]);
    const changes = spraycanRecolor(patches, '#0000ff', '#00ff00');
    expect(changes).toHaveLength(0);
  });

  it('matches regardless of case in the source patches', () => {
    const patches = makePatches([['p1', '#FF0000']]);
    const changes = spraycanRecolor(patches, '#ff0000', '#00ff00');
    expect(changes).toHaveLength(1);
    expect(changes[0].objectId).toBe('p1');
  });

  it('matches regardless of case in the targetFill argument', () => {
    const patches = makePatches([['p1', '#ff0000']]);
    const changes = spraycanRecolor(patches, '#FF0000', '#00ff00');
    expect(changes).toHaveLength(1);
  });

  it('normalizes the newFill in the returned changes', () => {
    const patches = makePatches([['p1', '#ff0000']]);
    const changes = spraycanRecolor(patches, '#FF0000', '#00FF00');
    expect(changes[0].newFill).toBe('#00ff00');
  });

  it('handles 3-digit shorthand in targetFill', () => {
    const patches = makePatches([['p1', '#ffffff']]);
    const changes = spraycanRecolor(patches, '#fff', '#000000');
    expect(changes).toHaveLength(1);
  });

  it('returns an empty array when patches is empty', () => {
    const changes = spraycanRecolor([], '#ff0000', '#00ff00');
    expect(changes).toHaveLength(0);
  });

  it('does not mutate the input patches array', () => {
    const patches = makePatches([['p1', '#ff0000']]);
    const original = patches[0].currentFill;
    spraycanRecolor(patches, '#ff0000', '#00ff00');
    expect(patches[0].currentFill).toBe(original);
  });

  it('includes the correct objectId in each change', () => {
    const patches = makePatches([
      ['alpha', '#aaaaaa'],
      ['beta', '#aaaaaa'],
    ]);
    const changes = spraycanRecolor(patches, '#aaaaaa', '#bbbbbb');
    const ids = changes.map((c) => c.objectId);
    expect(ids).toContain('alpha');
    expect(ids).toContain('beta');
  });
});

// ---------------------------------------------------------------------------
// swapColors
// ---------------------------------------------------------------------------

describe('swapColors', () => {
  it('swaps colorA patches to colorB', () => {
    const patches = makePatches([['p1', '#ff0000']]);
    const changes = swapColors(patches, '#ff0000', '#0000ff');
    expect(changes).toHaveLength(1);
    expect(changes[0].newFill).toBe('#0000ff');
  });

  it('swaps colorB patches to colorA', () => {
    const patches = makePatches([['p2', '#0000ff']]);
    const changes = swapColors(patches, '#ff0000', '#0000ff');
    expect(changes).toHaveLength(1);
    expect(changes[0].newFill).toBe('#ff0000');
  });

  it('performs a bidirectional swap in one call', () => {
    const patches = makePatches([
      ['p1', '#ff0000'],
      ['p2', '#0000ff'],
      ['p3', '#00ff00'],
    ]);
    const changes = swapColors(patches, '#ff0000', '#0000ff');

    const byId = Object.fromEntries(changes.map((c) => [c.objectId, c.newFill]));
    expect(byId['p1']).toBe('#0000ff');
    expect(byId['p2']).toBe('#ff0000');
    // p3 is neither color, no change expected
    expect(byId['p3']).toBeUndefined();
  });

  it('returns no changes when neither color is present', () => {
    const patches = makePatches([['p1', '#aaaaaa']]);
    const changes = swapColors(patches, '#ff0000', '#0000ff');
    expect(changes).toHaveLength(0);
  });

  it('returns no changes for an empty patches array', () => {
    expect(swapColors([], '#ff0000', '#0000ff')).toHaveLength(0);
  });

  it('is a no-op when colorA === colorB (same color swap)', () => {
    const patches = makePatches([['p1', '#ff0000']]);
    const changes = swapColors(patches, '#ff0000', '#ff0000');
    // Patch already has the color — change would be to the same value.
    // A valid implementation may return an entry or not; what matters is
    // that if it returns one, the newFill equals the currentFill (no visible change).
    for (const c of changes) {
      expect(c.newFill).toBe('#ff0000');
    }
  });

  it('uses normalized comparison for colorA argument', () => {
    const patches = makePatches([['p1', '#ff0000']]);
    const changes = swapColors(patches, '#FF0000', '#0000ff');
    expect(changes[0].newFill).toBe('#0000ff');
  });

  it('uses normalized comparison for colorB argument', () => {
    const patches = makePatches([['p1', '#0000ff']]);
    const changes = swapColors(patches, '#ff0000', '#0000FF');
    expect(changes[0].newFill).toBe('#ff0000');
  });

  it('does not mutate the input patches array', () => {
    const patches = makePatches([
      ['p1', '#ff0000'],
      ['p2', '#0000ff'],
    ]);
    const originals = patches.map((p) => p.currentFill);
    swapColors(patches, '#ff0000', '#0000ff');
    expect(patches.map((p) => p.currentFill)).toEqual(originals);
  });
});

// ---------------------------------------------------------------------------
// randomizeColors
// ---------------------------------------------------------------------------

describe('randomizeColors', () => {
  const palette = ['#ff0000', '#00ff00', '#0000ff'];

  it('returns a change for every patch', () => {
    const patches = makePatches([
      ['p1', '#aaaaaa'],
      ['p2', '#bbbbbb'],
      ['p3', '#cccccc'],
    ]);
    const changes = randomizeColors(patches, palette);
    expect(changes).toHaveLength(3);
  });

  it('assigns only colors from the palette', () => {
    const patches = makePatches([
      ['p1', '#111111'],
      ['p2', '#222222'],
      ['p3', '#333333'],
      ['p4', '#444444'],
      ['p5', '#555555'],
    ]);
    const normalizedPalette = palette.map((c) => c.toLowerCase());
    const changes = randomizeColors(patches, palette);
    for (const change of changes) {
      expect(normalizedPalette).toContain(change.newFill);
    }
  });

  it('produces deterministic output with a fixed seed', () => {
    const patches = makePatches([
      ['p1', '#111111'],
      ['p2', '#222222'],
      ['p3', '#333333'],
    ]);
    const first = randomizeColors(patches, palette, 42);
    const second = randomizeColors(patches, palette, 42);
    expect(first.map((c) => c.newFill)).toEqual(second.map((c) => c.newFill));
  });

  it('produces different output with different seeds', () => {
    // Use enough patches that the probability of all matching by coincidence is negligible
    const patches = makePatches(
      Array.from({ length: 20 }, (_, i) => [`p${i}`, '#aaaaaa'])
    );
    const first = randomizeColors(patches, palette, 1);
    const second = randomizeColors(patches, palette, 9999);
    // At least one assignment should differ
    const differs = first.some((c, i) => c.newFill !== second[i].newFill);
    expect(differs).toBe(true);
  });

  it('returns an empty array for empty patches', () => {
    expect(randomizeColors([], palette)).toHaveLength(0);
  });

  it('handles a single-color palette', () => {
    const patches = makePatches([
      ['p1', '#aaaaaa'],
      ['p2', '#bbbbbb'],
    ]);
    const changes = randomizeColors(patches, ['#ffffff']);
    expect(changes.every((c) => c.newFill === '#ffffff')).toBe(true);
  });

  it('normalizes palette colors in the output', () => {
    const patches = makePatches([['p1', '#aaaaaa']]);
    const changes = randomizeColors(patches, ['#FF0000']);
    expect(changes[0].newFill).toBe('#ff0000');
  });

  it('preserves objectId for each returned change', () => {
    const patches = makePatches([['my-patch-id', '#aaaaaa']]);
    const changes = randomizeColors(patches, palette, 1);
    expect(changes[0].objectId).toBe('my-patch-id');
  });

  it('does not mutate the input patches array', () => {
    const patches = makePatches([['p1', '#aaaaaa']]);
    const original = patches[0].currentFill;
    randomizeColors(patches, palette);
    expect(patches[0].currentFill).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// extractUniquePalette
// ---------------------------------------------------------------------------

describe('extractUniquePalette', () => {
  it('returns all unique colors from patches', () => {
    const patches = makePatches([
      ['p1', '#ff0000'],
      ['p2', '#00ff00'],
      ['p3', '#0000ff'],
    ]);
    const palette = extractUniquePalette(patches);
    expect(palette).toHaveLength(3);
    expect(palette).toContain('#ff0000');
    expect(palette).toContain('#00ff00');
    expect(palette).toContain('#0000ff');
  });

  it('deduplicates identical colors', () => {
    const patches = makePatches([
      ['p1', '#ff0000'],
      ['p2', '#ff0000'],
      ['p3', '#ff0000'],
    ]);
    const palette = extractUniquePalette(patches);
    expect(palette).toHaveLength(1);
    expect(palette[0]).toBe('#ff0000');
  });

  it('deduplicates case-insensitively', () => {
    const patches = makePatches([
      ['p1', '#FF0000'],
      ['p2', '#ff0000'],
    ]);
    const palette = extractUniquePalette(patches);
    expect(palette).toHaveLength(1);
    expect(palette[0]).toBe('#ff0000');
  });

  it('normalizes 3-digit shorthand colors', () => {
    const patches = makePatches([
      ['p1', '#fff'],
      ['p2', '#ffffff'],
    ]);
    const palette = extractUniquePalette(patches);
    expect(palette).toHaveLength(1);
    expect(palette[0]).toBe('#ffffff');
  });

  it('returns an empty array for empty input', () => {
    expect(extractUniquePalette([])).toHaveLength(0);
  });

  it('handles a single patch', () => {
    const patches = makePatches([['p1', '#123456']]);
    expect(extractUniquePalette(patches)).toEqual(['#123456']);
  });

  it('does not mutate the input patches array', () => {
    const patches = makePatches([['p1', '#ff0000']]);
    const original = patches[0].currentFill;
    extractUniquePalette(patches);
    expect(patches[0].currentFill).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// eyedropperPick
// ---------------------------------------------------------------------------

describe('eyedropperPick', () => {
  it('returns the normalized fill for a found patch', () => {
    const patches = makePatches([
      ['p1', '#ff0000'],
      ['p2', '#00ff00'],
    ]);
    expect(eyedropperPick(patches, 'p1')).toBe('#ff0000');
  });

  it('normalizes the returned fill', () => {
    const patches = makePatches([['p1', '#FF0000']]);
    expect(eyedropperPick(patches, 'p1')).toBe('#ff0000');
  });

  it('normalizes a 3-digit shorthand fill', () => {
    const patches = makePatches([['p1', '#fff']]);
    expect(eyedropperPick(patches, 'p1')).toBe('#ffffff');
  });

  it('returns null when the objectId is not found', () => {
    const patches = makePatches([['p1', '#ff0000']]);
    expect(eyedropperPick(patches, 'nonexistent')).toBeNull();
  });

  it('returns null for an empty patches array', () => {
    expect(eyedropperPick([], 'p1')).toBeNull();
  });

  it('returns the correct patch when multiple patches share similar IDs', () => {
    const patches = makePatches([
      ['patch-1', '#ff0000'],
      ['patch-10', '#00ff00'],
      ['patch-100', '#0000ff'],
    ]);
    expect(eyedropperPick(patches, 'patch-10')).toBe('#00ff00');
  });

  it('does not mutate the input patches array', () => {
    const patches = makePatches([['p1', '#ff0000']]);
    const original = patches[0].currentFill;
    eyedropperPick(patches, 'p1');
    expect(patches[0].currentFill).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// Type shape smoke tests
// ---------------------------------------------------------------------------

describe('type shapes', () => {
  it('PatchColor has objectId and currentFill', () => {
    const patch: PatchColor = { objectId: 'x', currentFill: '#ff0000' };
    expect(patch.objectId).toBe('x');
    expect(patch.currentFill).toBe('#ff0000');
  });

  it('ColorChange has objectId and newFill', () => {
    const change: ColorChange = { objectId: 'x', newFill: '#00ff00' };
    expect(change.objectId).toBe('x');
    expect(change.newFill).toBe('#00ff00');
  });
});
