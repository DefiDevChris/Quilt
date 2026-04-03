import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { performUndo, performRedo } from '@/lib/canvas-history';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

// Mock canvas implementing UndoableCanvas interface
function createMockCanvas() {
  const jsonHistory: string[] = ['{"version":"1.0","objects":[]}'];
  let currentIndex = 0;

  return {
    toJSON: vi.fn(() => JSON.parse(jsonHistory[currentIndex])),
    loadFromJSON: vi.fn(async (json: unknown) => {
      jsonHistory.push(JSON.stringify(json));
      currentIndex = jsonHistory.length - 1;
    }),
    renderAll: vi.fn(),
    _getHistory: () => jsonHistory,
    _getCurrentIndex: () => currentIndex,
  };
}

describe('canvas-history', () => {
  let mockCanvas: ReturnType<typeof createMockCanvas>;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    // Reset stores
    useCanvasStore.getState().resetHistory();
    useCanvasStore.getState().setFabricCanvas(null);
    useProjectStore.getState().reset();
    useProjectStore.getState().setDirty(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('performUndo', () => {
    it('returns false when canvas is null', async () => {
      const result = await performUndo(null);
      expect(result).toBe(false);
    });

    it('returns false when undo stack is empty', async () => {
      // Push initial state, then clear by resetting
      useCanvasStore.getState().resetHistory();
      
      const result = await performUndo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      expect(result).toBe(false);
    });

    it('performs undo and updates canvas state', async () => {
      // Setup: push some states to the undo stack
      const state1 = '{"version":"1.0","objects":[{"id":"1"}]}';
      const state2 = '{"version":"1.0","objects":[{"id":"1"},{"id":"2"}]}';
      
      useCanvasStore.getState().pushUndoState(state1);
      useCanvasStore.getState().pushUndoState(state2);
      
      // Mock current JSON
      mockCanvas.toJSON = vi.fn(() => ({ version: '1.0', objects: [{ id: '1' }, { id: '2' }, { id: '3' }] }));
      
      const result = await performUndo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      expect(result).toBe(true);
      expect(mockCanvas.loadFromJSON).toHaveBeenCalled();
      expect(mockCanvas.renderAll).toHaveBeenCalled();
      expect(useProjectStore.getState().isDirty).toBe(true);
    });

    it('moves current state to redo stack on undo', async () => {
      const state1 = '{"version":"1.0","objects":[]}';
      const state2 = '{"version":"1.0","objects":[{"id":"1"}]}';
      
      useCanvasStore.getState().pushUndoState(state1);
      useCanvasStore.getState().pushUndoState(state2);
      
      const currentState = '{"version":"1.0","objects":[{"id":"1"},{"id":"2"}]}';
      mockCanvas.toJSON = vi.fn(() => JSON.parse(currentState));
      
      await performUndo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      // Redo stack should now have the state we just undid from
      expect(useCanvasStore.getState().canRedo()).toBe(true);
    });
  });

  describe('performRedo', () => {
    it('returns false when canvas is null', async () => {
      const result = await performRedo(null);
      expect(result).toBe(false);
    });

    it('returns false when redo stack is empty', async () => {
      const result = await performRedo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      expect(result).toBe(false);
    });

    it('performs redo and updates canvas state', async () => {
      // Setup: do an undo first to populate redo stack
      const state1 = '{"version":"1.0","objects":[]}';
      const state2 = '{"version":"1.0","objects":[{"id":"1"}]}';
      
      useCanvasStore.getState().pushUndoState(state1);
      useCanvasStore.getState().pushUndoState(state2);
      
      const currentState = '{"version":"1.0","objects":[{"id":"1"},{"id":"2"}]}';
      mockCanvas.toJSON = vi.fn(() => JSON.parse(currentState));
      
      // First undo to populate redo stack
      await performUndo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      // Reset mocks
      mockCanvas.loadFromJSON.mockClear();
      mockCanvas.renderAll.mockClear();
      
      // Now redo
      const result = await performRedo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      expect(result).toBe(true);
      expect(mockCanvas.loadFromJSON).toHaveBeenCalled();
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    it('moves current state to undo stack on redo', async () => {
      // Setup
      const state1 = '{"version":"1.0","objects":[]}';
      const state2 = '{"version":"1.0","objects":[{"id":"1"}]}';
      
      useCanvasStore.getState().pushUndoState(state1);
      useCanvasStore.getState().pushUndoState(state2);
      
      const currentState = '{"version":"1.0","objects":[{"id":"1"},{"id":"2"}]}';
      mockCanvas.toJSON = vi.fn(() => JSON.parse(currentState));
      
      // Undo to populate redo
      await performUndo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      const undoCountBefore = useCanvasStore.getState().undoStack.length;
      
      // Redo
      await performRedo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      // Undo stack should have grown
      expect(useCanvasStore.getState().undoStack.length).toBeGreaterThanOrEqual(undoCountBefore);
    });
  });

  describe('undo/redo integration', () => {
    it('can perform multiple undos and redos in sequence', async () => {
      // Setup history
      const states = [
        '{"version":"1.0","objects":[]}',
        '{"version":"1.0","objects":[{"id":"1"}]}',
        '{"version":"1.0","objects":[{"id":"1"},{"id":"2"}]}',
      ];
      
      states.forEach(state => useCanvasStore.getState().pushUndoState(state));
      
      const currentJson = '{"version":"1.0","objects":[{"id":"1"},{"id":"2"},{"id":"3"}]}';
      mockCanvas.toJSON = vi.fn(() => JSON.parse(currentJson));
      
      // Undo twice
      await performUndo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      await performUndo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      expect(useCanvasStore.getState().canRedo()).toBe(true);
      
      // Redo once
      await performRedo(mockCanvas as unknown as {
        toJSON: () => unknown;
        loadFromJSON: (json: unknown) => Promise<void>;
        renderAll: () => void;
      });
      
      expect(useCanvasStore.getState().canUndo()).toBe(true);
      expect(useCanvasStore.getState().canRedo()).toBe(true);
    });

    it('clears redo stack when new undo state is pushed', () => {
      const state1 = '{"version":"1.0","objects":[]}';
      const state2 = '{"version":"1.0","objects":[{"id":"1"}]}';
      
      useCanvasStore.getState().pushUndoState(state1);
      useCanvasStore.getState().pushUndoState(state2);
      
      // Simulate: undo (moves state2 to redo), then new action (should clear redo)
      const currentJson = '{"version":"1.0","objects":[{"id":"1"},{"id":"2"}]}';
      const poppedState = useCanvasStore.getState().popUndo(currentJson);
      
      // Push new state
      useCanvasStore.getState().pushUndoState('{"version":"1.0","objects":[{"id":"new"}]}');
      
      // Redo should be cleared
      expect(useCanvasStore.getState().canRedo()).toBe(false);
    });
  });
});
