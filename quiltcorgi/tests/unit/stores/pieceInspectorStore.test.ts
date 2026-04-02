import { describe, it, expect, beforeEach } from 'vitest';
import { usePieceInspectorStore } from '@/stores/pieceInspectorStore';
import type { PieceGeometry, PieceDimensions } from '@/lib/piece-inspector-utils';

// ── Test Fixtures ─────────────────────────────────────────────────

const MOCK_GEOMETRY: PieceGeometry = {
  vertices: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
  boundingBox: { width: 1, height: 1, minX: 0, minY: 0 },
  shapeType: 'square',
  svgPathData: 'M 0 0 L 1 0 L 1 1 L 0 1 Z',
  isCurved: false,
};

const MOCK_DIMENSIONS: PieceDimensions = {
  finishedWidth: 1,
  finishedHeight: 1,
  cutWidth: 1.5,
  cutHeight: 1.5,
  seamAllowance: 0.25,
  specialInstructions: null,
};

// ── Tests ─────────────────────────────────────────────────────────

describe('pieceInspectorStore', () => {
  beforeEach(() => {
    usePieceInspectorStore.getState().reset();
  });

  // ── Initial State ───────────────────────────────────────────────

  describe('initial state', () => {
    it('has isOpen set to false', () => {
      expect(usePieceInspectorStore.getState().isOpen).toBe(false);
    });

    it('has seamAllowance set to 0.25', () => {
      expect(usePieceInspectorStore.getState().seamAllowance).toBe(0.25);
    });

    it('has selectedPieceId set to null', () => {
      expect(usePieceInspectorStore.getState().selectedPieceId).toBeNull();
    });

    it('has pieceGeometry set to null', () => {
      expect(usePieceInspectorStore.getState().pieceGeometry).toBeNull();
    });

    it('has pieceDimensions set to null', () => {
      expect(usePieceInspectorStore.getState().pieceDimensions).toBeNull();
    });
  });

  // ── setOpen ─────────────────────────────────────────────────────

  describe('setOpen', () => {
    it('sets isOpen to true', () => {
      usePieceInspectorStore.getState().setOpen(true);
      expect(usePieceInspectorStore.getState().isOpen).toBe(true);
    });

    it('sets isOpen to false', () => {
      usePieceInspectorStore.getState().setOpen(true);
      usePieceInspectorStore.getState().setOpen(false);
      expect(usePieceInspectorStore.getState().isOpen).toBe(false);
    });
  });

  // ── selectPiece ─────────────────────────────────────────────────

  describe('selectPiece', () => {
    it('sets geometry, dimensions, and piece ID', () => {
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);

      const state = usePieceInspectorStore.getState();
      expect(state.selectedPieceId).toBe('piece-1');
      expect(state.pieceGeometry).toEqual(MOCK_GEOMETRY);
      expect(state.pieceDimensions).toEqual(MOCK_DIMENSIONS);
    });

    it('opens panel when a piece is selected', () => {
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);

      expect(usePieceInspectorStore.getState().isOpen).toBe(true);
    });

    it('closes panel when null is passed for pieceId', () => {
      // First select something
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);
      // Then deselect
      usePieceInspectorStore.getState().selectPiece(null, null, null);

      const state = usePieceInspectorStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.selectedPieceId).toBeNull();
      expect(state.pieceGeometry).toBeNull();
      expect(state.pieceDimensions).toBeNull();
    });

    it('replaces existing selection', () => {
      const otherGeometry: PieceGeometry = {
        ...MOCK_GEOMETRY,
        shapeType: 'hst',
      };
      const otherDims: PieceDimensions = {
        ...MOCK_DIMENSIONS,
        finishedWidth: 2,
      };

      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-2', otherGeometry, otherDims);

      const state = usePieceInspectorStore.getState();
      expect(state.selectedPieceId).toBe('piece-2');
      expect(state.pieceGeometry?.shapeType).toBe('hst');
      expect(state.pieceDimensions?.finishedWidth).toBe(2);
    });
  });

  // ── setSeamAllowance ────────────────────────────────────────────

  describe('setSeamAllowance', () => {
    it('updates the seam allowance value', () => {
      usePieceInspectorStore.getState().setSeamAllowance(0.375);
      expect(usePieceInspectorStore.getState().seamAllowance).toBe(0.375);
    });

    it('accepts 0.5 seam allowance', () => {
      usePieceInspectorStore.getState().setSeamAllowance(0.5);
      expect(usePieceInspectorStore.getState().seamAllowance).toBe(0.5);
    });

    it('does not affect other state', () => {
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);
      usePieceInspectorStore.getState().setSeamAllowance(0.5);

      expect(usePieceInspectorStore.getState().selectedPieceId).toBe('piece-1');
    });
  });

  // ── clearSelection ──────────────────────────────────────────────

  describe('clearSelection', () => {
    it('clears piece data and closes panel', () => {
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);
      usePieceInspectorStore.getState().clearSelection();

      const state = usePieceInspectorStore.getState();
      expect(state.selectedPieceId).toBeNull();
      expect(state.pieceGeometry).toBeNull();
      expect(state.pieceDimensions).toBeNull();
      expect(state.isOpen).toBe(false);
    });

    it('does not affect seam allowance', () => {
      usePieceInspectorStore.getState().setSeamAllowance(0.5);
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);
      usePieceInspectorStore.getState().clearSelection();

      const state = usePieceInspectorStore.getState();
      expect(state.seamAllowance).toBe(0.5);
    });
  });

  // ── reset ───────────────────────────────────────────────────────

  describe('reset', () => {
    it('returns to initial state', () => {
      // Modify every field
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);
      usePieceInspectorStore.getState().setSeamAllowance(0.5);

      // Reset
      usePieceInspectorStore.getState().reset();

      const state = usePieceInspectorStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.selectedPieceId).toBeNull();
      expect(state.seamAllowance).toBe(0.25);
      expect(state.pieceGeometry).toBeNull();
      expect(state.pieceDimensions).toBeNull();
    });

    it('is idempotent', () => {
      usePieceInspectorStore.getState().reset();
      usePieceInspectorStore.getState().reset();

      const state = usePieceInspectorStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.seamAllowance).toBe(0.25);
    });
  });
});
