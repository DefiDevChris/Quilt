/// <reference lib="webworker" />
import type { Point, Patch, ShapeTemplate, DetectedGrid, ProcessParams } from '@/types/photo-to-design';

// ── Main → Worker ──────────────────────────────────────────────────────────

export type InMessage =
  | { type: 'init'; requestId: string; payload?: undefined }
  | { type: 'loadImage'; requestId: string; payload: { imageData: ImageData } }
  | { type: 'autoDetectCorners'; requestId: string; payload: { imageData: ImageData } }
  | { type: 'warpPerspective'; requestId: string; payload: { corners: Point[]; imageData: ImageData } }
  | { type: 'process'; requestId: string; payload: { params: ProcessParams; quality: 'preview' | 'full' } }
  | { type: 'splitPatch'; requestId: string; payload: { patchId: number; line: [Point, Point] } }
  | { type: 'mergePatches'; requestId: string; payload: { aId: number; bId: number } }
  | { type: 'floodFill'; requestId: string; payload: { point: Point; targetId: number } }
  | { type: 'undo'; requestId: string; payload?: undefined }
  | { type: 'redo'; requestId: string; payload?: undefined }
  | { type: 'dispose'; requestId: string; payload?: undefined };

// ── Worker → Main ──────────────────────────────────────────────────────────

export type OutMessage =
  | { type: 'response'; requestId: string; payload: { ok: boolean } }
  | { type: 'ready'; requestId: '' }
  | { type: 'progress'; requestId: string; stage: string; percent: number }
  | {
      type: 'previewResult';
      requestId: string;
      outlines: Float32Array;
      colors: string[];
      patchCount: number;
    }
  | {
      type: 'fullResult';
      requestId: string;
      patches: Patch[];
      templates: ShapeTemplate[];
      grid: DetectedGrid;
    }
  | {
      type: 'editResult';
      requestId: string;
      changedPatches: Patch[];
      removedIds: number[];
    }
  | { type: 'undoRedoState'; requestId: string; canUndo: boolean; canRedo: boolean }
  | {
      type: 'error';
      requestId: string;
      stage: string;
      message: string;
      recoverable: boolean;
    };
