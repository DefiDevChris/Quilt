import type { DrawSegment, Patch, GridPoint, Segment, ArcSegment } from '@/lib/blockbuilder-utils';
import type { BlockBuilderMode } from '@/components/studio/BlockBuilderWorktable';

export type { DrawSegment, Patch, GridPoint, Segment, ArcSegment, BlockBuilderMode };

export interface BlockBuilderOptions {
  draftCanvasRef: React.MutableRefObject<unknown>;
  isOpen: boolean;
  gridCols: number;
  gridRows: number;
  canvasSize: number;
  activeMode: BlockBuilderMode;
}

export interface SnapHelpers {
  gridSize: number;
  gridCols: number;
  gridRows: number;
  snapToGridPoint: (x: number, y: number) => GridPoint | null;
  snapToNearestGridPoint: (x: number, y: number) => GridPoint;
}

export interface SegmentHelpers {
  segmentsRef: React.MutableRefObject<readonly DrawSegment[]>;
  addShapeSegments: (segs: Segment[]) => void;
  replaceSegmentAt: (index: number, replacement: DrawSegment) => void;
  findNearestSegment: (
    x: number,
    y: number,
    segs: readonly Segment[],
    tolerance: number
  ) => { index: number; seg: Segment } | null;
}

// Minimal canvas interface to avoid importing fabric at type-check time
export interface MinimalCanvas {
  add: (o: unknown) => void;
  remove: (o: unknown) => void;
  renderAll: () => void;
}
