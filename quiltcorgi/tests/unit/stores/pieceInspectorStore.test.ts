import { describe, it, expect, beforeEach } from 'vitest';
import { usePieceInspectorStore } from '@/stores/pieceInspectorStore';
import type { PieceGeometry, PieceDimensions } from '@/lib/piece-inspector-engine';

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

    it('has isPuzzleViewActive set to false', () => {
      expect(usePieceInspectorStore.getState().isPuzzleViewActive).toBe(false);
    });

    it('has seamAllowance set to 0.25', () => {
      expect(usePieceInspectorStore.getState().seamAllowance).toBe(0.25);
    });

    it('has selectedPieceId set to null', () => {
      expect(usePieceInspectorStore.getState().selectedPieceId).toBeNull();
    });

    it('has hoveredPieceId set to null', () => {
      expect(usePieceInspectorStore.getState().hoveredPieceId).toBeNull();
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

  // ── togglePuzzleView ────────────────────────────────────────────

  describe('togglePuzzleView', () => {
    it('flips isPuzzleViewActive from false to true', () => {
      usePieceInspectorStore.getState().togglePuzzleView();
      expect(usePieceInspectorStore.getState().isPuzzleViewActive).toBe(true);
    });

    it('flips isPuzzleViewActive from true to false', () => {
      usePieceInspectorStore.getState().togglePuzzleView();
      usePieceInspectorStore.getState().togglePuzzleView();
      expect(usePieceInspectorStore.getState().isPuzzleViewActive).toBe(false);
    });

    it('clears selection when deactivating', () => {
      // Activate puzzle view and select a piece
      usePieceInspectorStore.getState().togglePuzzleView();
      usePieceInspectorStore.getState().selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);

      // Deactivate puzzle view
      usePieceInspectorStore.getState().togglePuzzleView();

      const state = usePieceInspectorStore.getState();
      expect(state.isPuzzleViewActive).toBe(false);
      expect(state.selectedPieceId).toBeNull();
      expect(state.pieceGeometry).toBeNull();
      expect(state.pieceDimensions).toBeNull();
    });

    it('closes panel when deactivating', () => {
      usePieceInspectorStore.getState().togglePuzzleView();
      usePieceInspectorStore.getState().setOpen(true);
      usePieceInspectorStore.getState().togglePuzzleView();

      expect(usePieceInspectorStore.getState().isOpen).toBe(false);
    });

    it('clears hoveredPieceId when deactivating', () => {
      usePieceInspectorStore.getState().togglePuzzleView();
      usePieceInspectorStore.getState().setHoveredPiece('hover-1');
      usePieceInspectorStore.getState().togglePuzzleView();

      expect(usePieceInspectorStore.getState().hoveredPieceId).toBeNull();
    });

    it('preserves selection state when activating', () => {
      // Set up some state first
      usePieceInspectorStore.getState().setOpen(true);
      usePieceInspectorStore.getState().togglePuzzleView();

      // isOpen should remain as it was
      expect(usePieceInspectorStore.getState().isOpen).toBe(true);
    });
  });

  // ── setPuzzleViewActive ─────────────────────────────────────────

  describe('setPuzzleViewActive', () => {
    it('sets isPuzzleViewActive to true', () => {
      usePieceInspectorStore.getState().setPuzzleViewActive(true);
      expect(usePieceInspectorStore.getState().isPuzzleViewActive).toBe(true);
    });

    it('clears all state when setting to false', () => {
      // Set up state
      usePieceInspectorStore.getState().setPuzzleViewActive(true);
      usePieceInspectorStore.getState().selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);
      usePieceInspectorStore.getState().setHoveredPiece('hover-1');

      // Deactivate
      usePieceInspectorStore.getState().setPuzzleViewActive(false);

      const state = usePieceInspectorStore.getState();
      expect(state.isPuzzleViewActive).toBe(false);
      expect(state.isOpen).toBe(false);
      expect(state.selectedPieceId).toBeNull();
      expect(state.hoveredPieceId).toBeNull();
      expect(state.pieceGeometry).toBeNull();
      expect(state.pieceDimensions).toBeNull();
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

  // ── setHoveredPiece ─────────────────────────────────────────────

  describe('setHoveredPiece', () => {
    it('sets hoveredPieceId', () => {
      usePieceInspectorStore.getState().setHoveredPiece('hover-1');
      expect(usePieceInspectorStore.getState().hoveredPieceId).toBe('hover-1');
    });

    it('clears hoveredPieceId with null', () => {
      usePieceInspectorStore.getState().setHoveredPiece('hover-1');
      usePieceInspectorStore.getState().setHoveredPiece(null);
      expect(usePieceInspectorStore.getState().hoveredPieceId).toBeNull();
    });

    it('does not affect other state', () => {
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);
      usePieceInspectorStore.getState().setHoveredPiece('hover-1');

      const state = usePieceInspectorStore.getState();
      expect(state.selectedPieceId).toBe('piece-1');
      expect(state.isOpen).toBe(true);
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

    it('does not affect puzzle view or seam allowance', () => {
      usePieceInspectorStore.getState().setPuzzleViewActive(true);
      usePieceInspectorStore.getState().setSeamAllowance(0.5);
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);
      usePieceInspectorStore.getState().clearSelection();

      const state = usePieceInspectorStore.getState();
      expect(state.isPuzzleViewActive).toBe(true);
      expect(state.seamAllowance).toBe(0.5);
    });

    it('does not affect hoveredPieceId', () => {
      usePieceInspectorStore.getState().setHoveredPiece('hover-1');
      usePieceInspectorStore.getState().clearSelection();

      expect(usePieceInspectorStore.getState().hoveredPieceId).toBe('hover-1');
    });
  });

  // ── reset ───────────────────────────────────────────────────────

  describe('reset', () => {
    it('returns to initial state', () => {
      // Modify every field
      usePieceInspectorStore.getState().setPuzzleViewActive(true);
      usePieceInspectorStore
        .getState()
        .selectPiece('piece-1', MOCK_GEOMETRY, MOCK_DIMENSIONS);
      usePieceInspectorStore.getState().setHoveredPiece('hover-1');
      usePieceInspectorStore.getState().setSeamAllowance(0.5);

      // Reset
      usePieceInspectorStore.getState().reset();

      const state = usePieceInspectorStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.isPuzzleViewActive).toBe(false);
      expect(state.selectedPieceId).toBeNull();
      expect(state.hoveredPieceId).toBeNull();
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
