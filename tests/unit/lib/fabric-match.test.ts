import { describe, expect, it } from 'vitest';
import {
  matchFabricToColor,
  matchFabricsToCells,
  type FabricMatchCandidate,
} from '@/lib/fabric-match';
import type { GridCell } from '@/lib/photo-layout-types';

describe('matchFabricToColor', () => {
  it('returns { fabricId: null } when the candidate list is empty', () => {
    const result = matchFabricToColor('#ff0000', []);
    expect(result.fabricId).toBeNull();
    expect(result.hex).toBe('#ff0000');
    expect(result.distance).toBe(Infinity);
  });

  it('returns an exact match with distance ~0 when the sampled color is in the library', () => {
    const candidates: FabricMatchCandidate[] = [
      { id: 'red', hex: '#ff0000' },
      { id: 'green', hex: '#00ff00' },
      { id: 'blue', hex: '#0000ff' },
    ];
    const result = matchFabricToColor('#ff0000', candidates);
    expect(result.fabricId).toBe('red');
    expect(result.hex).toBe('#ff0000');
    expect(result.distance).toBeLessThan(0.5);
  });

  it('picks the nearest-neighbour in LAB space across a 3-color library', () => {
    const candidates: FabricMatchCandidate[] = [
      { id: 'red', hex: '#ff0000' },
      { id: 'green', hex: '#00ff00' },
      { id: 'blue', hex: '#0000ff' },
    ];
    // A slightly darker red — should still bucket to "red", not "green" or "blue".
    const result = matchFabricToColor('#c80f0a', candidates);
    expect(result.fabricId).toBe('red');
  });

  it('skips candidates whose hex is null and returns null if nothing is matchable', () => {
    const candidates: FabricMatchCandidate[] = [
      { id: 'ghost', hex: null },
      { id: 'spooky', hex: null },
    ];
    const result = matchFabricToColor('#808080', candidates);
    expect(result.fabricId).toBeNull();
    expect(result.hex).toBe('#808080');
  });
});

describe('matchFabricsToCells', () => {
  const makeCell = (
    id: string,
    fabricColor: string,
    assignedFabricId: string | null = null
  ): GridCell => ({
    id,
    row: 0,
    col: 0,
    polygonInches: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    centroidInches: { x: 0.5, y: 0.5 },
    fabricColor,
    assignedFabricId,
  });

  it('passes cells through unchanged when the candidate list is empty', () => {
    const cells = [makeCell('a', '#ff0000'), makeCell('b', '#00ff00')];
    const result = matchFabricsToCells(cells, []);
    expect(result).toBe(cells);
  });

  it('leaves cells that already have an assigned fabric untouched', () => {
    const cells = [makeCell('a', '#ff0000', 'userpick')];
    const candidates: FabricMatchCandidate[] = [{ id: 'auto', hex: '#ff0000' }];
    const result = matchFabricsToCells(cells, candidates);
    expect(result[0].assignedFabricId).toBe('userpick');
  });

  it('respects the maxDistance threshold and preserves unmatched cells verbatim', () => {
    // All candidates are far from the sampled grey → cell stays unassigned.
    const cells = [makeCell('a', '#808080')];
    const candidates: FabricMatchCandidate[] = [{ id: 'red', hex: '#ff0000' }];
    const result = matchFabricsToCells(cells, candidates, /* maxDistance */ 5);
    expect(result[0].assignedFabricId).toBeNull();
    expect(result[0].fabricColor).toBe('#808080');
  });

  it('assigns the nearest fabric when it is within maxDistance', () => {
    const cells = [makeCell('a', '#fa0000')];
    const candidates: FabricMatchCandidate[] = [
      { id: 'red', hex: '#ff0000' },
      { id: 'blue', hex: '#0000ff' },
    ];
    const result = matchFabricsToCells(cells, candidates, /* maxDistance */ 25);
    expect(result[0].assignedFabricId).toBe('red');
    expect(result[0].fabricColor).toBe('#ff0000');
  });
});
