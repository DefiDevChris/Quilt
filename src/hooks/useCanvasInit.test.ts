import { describe, it, expect } from 'vitest';
import { resolveSubTargetPatch } from './useCanvasInit';

describe('resolveSubTargetPatch', () => {
  it('returns the patch when clicking a patch inside a block group', () => {
    const patch = { __pieceRole: 'patch', id: 'patch-1' };
    expect(
      resolveSubTargetPatch({
        target: { __isBlockGroup: true },
        subTargets: [patch],
      })
    ).toBe(patch);
  });

  it('returns null when target is undefined', () => {
    expect(resolveSubTargetPatch({})).toBeNull();
  });

  it('returns null when target is not a block group', () => {
    expect(
      resolveSubTargetPatch({ target: { type: 'rect' }, subTargets: [{ __pieceRole: 'patch' }] })
    ).toBeNull();
  });

  it('returns null when subTarget is not a patch', () => {
    expect(
      resolveSubTargetPatch({
        target: { __isBlockGroup: true },
        subTargets: [{ __pieceRole: 'something-else' }],
      })
    ).toBeNull();
  });

  it('returns null when subTargets is empty', () => {
    expect(
      resolveSubTargetPatch({ target: { __isBlockGroup: true }, subTargets: [] })
    ).toBeNull();
  });
});
