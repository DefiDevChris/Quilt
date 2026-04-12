import { describe, it, expect } from 'vitest';
import {
  labelComponents,
  maskFromLabelMap,
} from '@/lib/connected-components';

/**
 * Build a mask from a multi-line string of `.` (background) and `#`
 * (foreground). Any trailing or leading whitespace on each line is
 * stripped, and blank lines are dropped — makes the fixtures readable
 * without fighting indentation.
 */
function maskFromAscii(ascii: string): {
  mask: Uint8Array;
  width: number;
  height: number;
} {
  const rows = ascii
    .split('\n')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const row = rows[y];
    if (row.length !== width) {
      throw new Error(`maskFromAscii: row ${y} has length ${row.length}, expected ${width}`);
    }
    for (let x = 0; x < width; x++) {
      mask[y * width + x] = row[x] === '#' ? 1 : 0;
    }
  }
  return { mask, width, height };
}

describe('labelComponents', () => {
  it('labels a single solid rectangle as one component', () => {
    const { mask, width, height } = maskFromAscii(`
      .....
      .###.
      .###.
      .###.
      .....
    `);
    const result = labelComponents(mask, width, height);

    expect(result.components).toHaveLength(1);
    expect(result.components[0].id).toBe(1);
    expect(result.components[0].area).toBe(9);
    expect(result.components[0].bbox).toEqual({
      minX: 1,
      minY: 1,
      maxX: 3,
      maxY: 3,
    });

    // Every foreground pixel carries label 1; every background pixel 0.
    for (let i = 0; i < mask.length; i++) {
      expect(result.labels[i]).toBe(mask[i] === 1 ? 1 : 0);
    }
  });

  it('labels three separated blobs in discovery order', () => {
    const { mask, width, height } = maskFromAscii(`
      #..#.
      #..#.
      .....
      .##..
      .##..
    `);
    const result = labelComponents(mask, width, height);

    expect(result.components).toHaveLength(3);
    // Discovery order: top-left (scan hits first), top-right, then the
    // centre bottom square.
    expect(result.components.map((c) => c.area)).toEqual([2, 2, 4]);
    expect(result.components[0].bbox).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 1 });
    expect(result.components[1].bbox).toEqual({ minX: 3, minY: 0, maxX: 3, maxY: 1 });
    expect(result.components[2].bbox).toEqual({ minX: 1, minY: 3, maxX: 2, maxY: 4 });
  });

  it('computes bboxes correctly when a component touches image edges', () => {
    const { mask, width, height } = maskFromAscii(`
      ####
      ###.
      ##..
      #...
    `);
    const result = labelComponents(mask, width, height);

    expect(result.components).toHaveLength(1);
    expect(result.components[0].area).toBe(10);
    expect(result.components[0].bbox).toEqual({
      minX: 0,
      minY: 0,
      maxX: 3,
      maxY: 3,
    });
  });

  it('returns no components for an all-background mask', () => {
    const width = 5;
    const height = 4;
    const mask = new Uint8Array(width * height); // all zeros
    const result = labelComponents(mask, width, height);

    expect(result.components).toHaveLength(0);
    for (const v of result.labels) expect(v).toBe(0);
  });

  it('merges both branches of an L-shape into a single component', () => {
    // The tricky case — row 4 threads the right branch back to the same
    // blob as the top-left branch. Exercises the union-find merge on two
    // provisional labels that start out as disjoint.
    const { mask, width, height } = maskFromAscii(`
      ##...
      ##...
      ##...
      ##...
      #####
    `);
    const result = labelComponents(mask, width, height);

    expect(result.components).toHaveLength(1);
    expect(result.components[0].area).toBe(13);
    expect(result.components[0].bbox).toEqual({
      minX: 0,
      minY: 0,
      maxX: 4,
      maxY: 4,
    });
  });

  it('4-connectivity keeps diagonally-touching blobs separate', () => {
    // The two `#`s touch only at a corner; 4-connectivity must NOT merge
    // them. 8-connectivity would — this is the regression guard against
    // accidentally switching neighbourhoods.
    const { mask, width, height } = maskFromAscii(`
      #..
      .#.
      ..#
    `);
    const result = labelComponents(mask, width, height);
    expect(result.components).toHaveLength(3);
  });
});

describe('maskFromLabelMap', () => {
  it('extracts exactly the pixels belonging to one cluster', () => {
    // 4x4 labelMap, top-half cluster 0, bottom-half cluster 1.
    const width = 4;
    const height = 4;
    const labelMap = new Uint16Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        labelMap[y * width + x] = y < 2 ? 0 : 1;
      }
    }

    const topMask = maskFromLabelMap(labelMap, 0);
    const bottomMask = maskFromLabelMap(labelMap, 1);

    // 8 pixels each.
    expect(topMask.reduce((a, b) => a + b, 0)).toBe(8);
    expect(bottomMask.reduce((a, b) => a + b, 0)).toBe(8);
    // And the selections are disjoint.
    for (let i = 0; i < labelMap.length; i++) {
      expect(topMask[i] + bottomMask[i]).toBe(1);
    }
  });
});
