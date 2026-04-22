'use client';

import { useState, useCallback, useRef } from 'react';
import type { DrawSegment, Segment, GridPoint, Patch } from './types';

export function useSegments(gridCols: number, gridRows: number) {
  const [segments, setSegments] = useState<readonly DrawSegment[]>([]);
  const [patches, setPatches] = useState<readonly Patch[]>([]);
  const [patchFills, setPatchFills] = useState<Record<string, string>>({});
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const segmentsRef = useRef<readonly DrawSegment[]>(segments);
  // eslint-disable-next-line react-hooks/refs
  segmentsRef.current = segments;

  const segmentsIntersectAtGridPoint = useCallback((a: Segment, b: Segment): GridPoint | null => {
    const pointsA: GridPoint[] = [];
    const drA = a.to.row - a.from.row;
    const dcA = a.to.col - a.from.col;
    const stepsA = Math.max(Math.abs(drA), Math.abs(dcA));
    if (stepsA === 0) return null;
    for (let i = 1; i < stepsA; i++) {
      const t = i / stepsA;
      pointsA.push({
        row: Math.round(a.from.row + drA * t),
        col: Math.round(a.from.col + dcA * t),
      });
    }

    const pointsB: GridPoint[] = [];
    const drB = b.to.row - b.from.row;
    const dcB = b.to.col - b.from.col;
    const stepsB = Math.max(Math.abs(drB), Math.abs(dcB));
    if (stepsB === 0) return null;
    for (let i = 1; i < stepsB; i++) {
      const t = i / stepsB;
      pointsB.push({
        row: Math.round(b.from.row + drB * t),
        col: Math.round(b.from.col + dcB * t),
      });
    }

    for (const pa of pointsA) {
      for (const pb of pointsB) {
        if (pa.row === pb.row && pa.col === pb.col) return pa;
      }
    }
    return null;
  }, []);

  const splitSegmentAtIntersection = useCallback(
    (seg: Segment, splitPoint: GridPoint): [Segment, Segment] | null => {
      const minR = Math.min(seg.from.row, seg.to.row);
      const maxR = Math.max(seg.from.row, seg.to.row);
      const minC = Math.min(seg.from.col, seg.to.col);
      const maxC = Math.max(seg.from.col, seg.to.col);
      if (splitPoint.row <= minR || splitPoint.row >= maxR) return null;
      if (splitPoint.col <= minC || splitPoint.col >= maxC) return null;
      return [
        { from: seg.from, to: splitPoint },
        { from: splitPoint, to: seg.to },
      ];
    },
    []
  );

  const addShapeSegments = useCallback(
    (newSegs: Segment[]) => {
      setSegments((prev) => {
        const existingSegments = prev.filter((s): s is Segment => !('center' in s));
        let toAdd: Segment[] = [];

        for (const newSeg of newSegs) {
          let segmentsToProcess: Segment[] = [newSeg];
          const finalSegments: Segment[] = [];
          let changed = true;

          while (changed) {
            changed = false;
            const nextIteration: Segment[] = [];
            for (const seg of segmentsToProcess) {
              let splitFound = false;
              for (const existing of existingSegments) {
                const intersection = segmentsIntersectAtGridPoint(seg, existing);
                if (intersection) {
                  const splitResult = splitSegmentAtIntersection(seg, intersection);
                  if (splitResult) {
                    nextIteration.push(splitResult[0], splitResult[1]);
                    splitFound = true;
                    changed = true;
                    break;
                  }
                }
              }
              if (!splitFound) finalSegments.push(seg);
            }
            segmentsToProcess = nextIteration;
          }
          toAdd = [...toAdd, ...finalSegments];
        }

        const existing = new Set(
          existingSegments.map((s) => {
            const [a, b] =
              s.from.row < s.to.row || (s.from.row === s.to.row && s.from.col < s.to.col)
                ? [s.from, s.to]
                : [s.to, s.from];
            return `${a.row},${a.col}-${b.row},${b.col}`;
          })
        );

        const uniqueToAdd = toAdd.filter((s) => {
          const [a, b] =
            s.from.row < s.to.row || (s.from.row === s.to.row && s.from.col < s.to.col)
              ? [s.from, s.to]
              : [s.to, s.from];
          return !existing.has(`${a.row},${a.col}-${b.row},${b.col}`);
        });

        if (uniqueToAdd.length === 0) return prev;
        return [...prev, ...uniqueToAdd];
      });
    },
    [segmentsIntersectAtGridPoint, splitSegmentAtIntersection]
  );

  const setPatchFill = useCallback((patchId: string, fabricId: string) => {
    setPatchFills((prev) => ({ ...prev, [patchId]: fabricId }));
  }, []);

  const clearSegments = useCallback(() => {
    setSegments([]);
    setPatchFills({});
    setSelectedPatchId(null);
  }, []);

  const undoSegment = useCallback(() => {
    setSegments((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  const replaceSegmentAt = useCallback((index: number, replacement: DrawSegment) => {
    setSegments((prev) => {
      const next = [...prev];
      next[index] = replacement;
      return next;
    });
  }, []);

  return {
    segments,
    patches,
    setPatches,
    patchFills,
    selectedPatchId,
    setSelectedPatchId,
    segmentsRef,
    addShapeSegments,
    setPatchFill,
    clearSegments,
    undoSegment,
    replaceSegmentAt,
  };
}
