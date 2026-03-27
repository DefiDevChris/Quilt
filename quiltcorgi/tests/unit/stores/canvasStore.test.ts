import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '@/stores/canvasStore';
import { ZOOM_MIN, ZOOM_MAX, UNDO_HISTORY_MAX } from '@/lib/constants';

function resetStore() {
  useCanvasStore.setState({
    fabricCanvas: null,
    zoom: 1,
    unitSystem: 'imperial',
    gridSettings: { enabled: true, size: 1, snapToGrid: true },
    selectedObjectIds: [],
    activeTool: 'select',
    cursorPosition: { x: 0, y: 0 },
    isSpacePressed: false,
    fillColor: '#D4883C',
    strokeColor: '#2D2D2D',
    strokeWidth: 1,
    undoStack: [],
    redoStack: [],
  });
}

describe('canvasStore', () => {
  beforeEach(resetStore);

  describe('zoom', () => {
    it('sets zoom within bounds', () => {
      useCanvasStore.getState().setZoom(2);
      expect(useCanvasStore.getState().zoom).toBe(2);
    });

    it('clamps zoom to min', () => {
      useCanvasStore.getState().setZoom(0.01);
      expect(useCanvasStore.getState().zoom).toBe(ZOOM_MIN);
    });

    it('clamps zoom to max', () => {
      useCanvasStore.getState().setZoom(10);
      expect(useCanvasStore.getState().zoom).toBe(ZOOM_MAX);
    });
  });

  describe('gridSettings', () => {
    it('partially updates grid settings', () => {
      useCanvasStore.getState().setGridSettings({ enabled: false });
      const gs = useCanvasStore.getState().gridSettings;
      expect(gs.enabled).toBe(false);
      expect(gs.size).toBe(1);
      expect(gs.snapToGrid).toBe(true);
    });
  });

  describe('activeTool', () => {
    it('sets active tool', () => {
      useCanvasStore.getState().setActiveTool('rectangle');
      expect(useCanvasStore.getState().activeTool).toBe('rectangle');
    });

    it('sets curve tool', () => {
      useCanvasStore.getState().setActiveTool('curve');
      expect(useCanvasStore.getState().activeTool).toBe('curve');
    });
  });

  describe('undo/redo', () => {
    it('pushes undo state and clears redo', () => {
      useCanvasStore.setState({ redoStack: ['old-redo'] });
      useCanvasStore.getState().pushUndoState('state1');
      expect(useCanvasStore.getState().undoStack).toEqual(['state1']);
      expect(useCanvasStore.getState().redoStack).toEqual([]);
    });

    it('popUndo returns previous state and moves current to redo', () => {
      useCanvasStore.getState().pushUndoState('state1');
      const prev = useCanvasStore.getState().popUndo('state2');
      expect(prev).toBe('state1');
      expect(useCanvasStore.getState().undoStack).toEqual([]);
      expect(useCanvasStore.getState().redoStack).toEqual(['state2']);
    });

    it('popUndo returns null when stack is empty', () => {
      const prev = useCanvasStore.getState().popUndo('current');
      expect(prev).toBeNull();
    });

    it('popRedo returns next state and moves current to undo', () => {
      useCanvasStore.setState({ redoStack: ['state3'] });
      const next = useCanvasStore.getState().popRedo('state2');
      expect(next).toBe('state3');
      expect(useCanvasStore.getState().undoStack).toEqual(['state2']);
      expect(useCanvasStore.getState().redoStack).toEqual([]);
    });

    it('popRedo returns null when stack is empty', () => {
      const next = useCanvasStore.getState().popRedo('current');
      expect(next).toBeNull();
    });

    it('limits undo stack to UNDO_HISTORY_MAX', () => {
      for (let i = 0; i < UNDO_HISTORY_MAX + 10; i++) {
        useCanvasStore.getState().pushUndoState(`state-${i}`);
      }
      expect(useCanvasStore.getState().undoStack.length).toBe(UNDO_HISTORY_MAX);
    });

    it('canUndo and canRedo reflect stack state', () => {
      expect(useCanvasStore.getState().canUndo()).toBe(false);
      expect(useCanvasStore.getState().canRedo()).toBe(false);

      useCanvasStore.getState().pushUndoState('s1');
      expect(useCanvasStore.getState().canUndo()).toBe(true);

      useCanvasStore.getState().popUndo('s2');
      expect(useCanvasStore.getState().canRedo()).toBe(true);
    });

    it('resetHistory clears both stacks', () => {
      useCanvasStore.getState().pushUndoState('s1');
      useCanvasStore.setState({ redoStack: ['s2'] });
      useCanvasStore.getState().resetHistory();
      expect(useCanvasStore.getState().undoStack).toEqual([]);
      expect(useCanvasStore.getState().redoStack).toEqual([]);
    });
  });

  describe('colors', () => {
    it('sets fill color', () => {
      useCanvasStore.getState().setFillColor('#FF0000');
      expect(useCanvasStore.getState().fillColor).toBe('#FF0000');
    });

    it('sets stroke color', () => {
      useCanvasStore.getState().setStrokeColor('#00FF00');
      expect(useCanvasStore.getState().strokeColor).toBe('#00FF00');
    });

    it('sets stroke width', () => {
      useCanvasStore.getState().setStrokeWidth(3);
      expect(useCanvasStore.getState().strokeWidth).toBe(3);
    });
  });
});
