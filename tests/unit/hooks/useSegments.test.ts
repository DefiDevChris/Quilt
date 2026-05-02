/**
 * useSegments Hook Tests
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSegments } from '@/hooks/useBlockBuilder/useSegments';

function makeSeg(r1: number, c1: number, r2: number, c2: number) {
  return { from: { row: r1, col: c1 }, to: { row: r2, col: c2 } };
}

describe('useSegments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add segments and reflect them in segments array', () => {
    const { result } = renderHook(() => useSegments(12, 12));

    act(() => {
      result.current.addShapeSegments([makeSeg(0, 0, 0, 3)]);
    });

    expect(result.current.segments).toHaveLength(1);
    expect(result.current.segments[0]).toEqual(makeSeg(0, 0, 0, 3));
  });

  it('should undo the last segment and push it onto the redo stack', () => {
    const { result } = renderHook(() => useSegments(12, 12));

    act(() => {
      result.current.addShapeSegments([makeSeg(0, 0, 0, 3)]);
    });

    act(() => {
      result.current.undoSegment();
    });

    expect(result.current.segments).toHaveLength(0);
    expect(result.current.redoStack).toHaveLength(1);
    expect(result.current.redoStack[0]).toEqual(makeSeg(0, 0, 0, 3));
  });

  it('should redo the last undone segment', () => {
    const { result } = renderHook(() => useSegments(12, 12));

    act(() => {
      result.current.addShapeSegments([makeSeg(0, 0, 0, 3)]);
    });

    act(() => {
      result.current.undoSegment();
    });

    act(() => {
      result.current.redoSegment();
    });

    expect(result.current.segments).toHaveLength(1);
    expect(result.current.segments[0]).toEqual(makeSeg(0, 0, 0, 3));
    expect(result.current.redoStack).toHaveLength(0);
  });

  it('should clear the redo stack when a new segment is drawn', () => {
    const { result } = renderHook(() => useSegments(12, 12));

    act(() => {
      result.current.addShapeSegments([makeSeg(0, 0, 0, 3)]);
    });

    act(() => {
      result.current.undoSegment();
    });

    expect(result.current.redoStack).toHaveLength(1);

    act(() => {
      result.current.addShapeSegments([makeSeg(3, 3, 6, 6)]);
    });

    expect(result.current.redoStack).toHaveLength(0);
    expect(result.current.segments).toHaveLength(1);
  });

  it('should support undo -> redo -> undo cycle correctly', () => {
    const { result } = renderHook(() => useSegments(12, 12));

    act(() => {
      result.current.addShapeSegments([makeSeg(0, 0, 0, 3)]);
    });

    act(() => {
      result.current.addShapeSegments([makeSeg(0, 3, 3, 3)]);
    });

    // Undo second segment
    act(() => {
      result.current.undoSegment();
    });

    expect(result.current.segments).toHaveLength(1);
    expect(result.current.segments[0]).toEqual(makeSeg(0, 0, 0, 3));
    expect(result.current.redoStack).toHaveLength(1);

    // Redo second segment
    act(() => {
      result.current.redoSegment();
    });

    expect(result.current.segments).toHaveLength(2);
    expect(result.current.segments[1]).toEqual(makeSeg(0, 3, 3, 3));
    expect(result.current.redoStack).toHaveLength(0);

    // Undo second segment again
    act(() => {
      result.current.undoSegment();
    });

    expect(result.current.segments).toHaveLength(1);
    expect(result.current.redoStack).toHaveLength(1);
  });

  it('should clear all segments and redo stack on clearSegments', () => {
    const { result } = renderHook(() => useSegments(12, 12));

    act(() => {
      result.current.addShapeSegments([makeSeg(0, 0, 0, 3)]);
      result.current.addShapeSegments([makeSeg(0, 3, 3, 3)]);
    });

    act(() => {
      result.current.undoSegment();
    });

    expect(result.current.redoStack).toHaveLength(1);

    act(() => {
      result.current.clearSegments();
    });

    expect(result.current.segments).toHaveLength(0);
    expect(result.current.redoStack).toHaveLength(0);
  });

  it('should not error when undo is called with empty segments', () => {
    const { result } = renderHook(() => useSegments(12, 12));

    act(() => {
      result.current.undoSegment();
    });

    expect(result.current.segments).toHaveLength(0);
    expect(result.current.redoStack).toHaveLength(0);
  });

  it('should not error when redo is called with empty redo stack', () => {
    const { result } = renderHook(() => useSegments(12, 12));

    act(() => {
      result.current.redoSegment();
    });

    expect(result.current.segments).toHaveLength(0);
    expect(result.current.redoStack).toHaveLength(0);
  });
});
