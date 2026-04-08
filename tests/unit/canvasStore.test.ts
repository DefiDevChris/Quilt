import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../../src/stores/canvasStore';

describe('canvasStore', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
    useCanvasStore.getState().resetHistory();
  });

  it('should push state to undo stack', () => {
    const state = '{"objects": []}';
    useCanvasStore.getState().pushUndoState(state);
    
    expect(useCanvasStore.getState().undoStack).toContain(state);
    expect(useCanvasStore.getState().canUndo()).toBe(true);
  });

  it('should pop undo state and move current to redo stack', () => {
    const state1 = '{"objects": []}';
    const state2 = '{"objects": [{"type": "rect"}]}';
    
    useCanvasStore.getState().pushUndoState(state1);
    
    const currentState = '{"objects": [{"type": "circle"}]}';
    const popped = useCanvasStore.getState().popUndo(currentState);
    
    expect(popped).toBe(state1);
    expect(useCanvasStore.getState().undoStack).toHaveLength(0);
    expect(useCanvasStore.getState().redoStack).toContain(currentState);
  });

  it('should pop redo state and move current back to undo stack', () => {
    const initialState = '{"objects": []}';
    const currentState = '{"objects": [{"type": "rect"}]}';
    
    // Setup: do an action and then an undo
    useCanvasStore.getState().pushUndoState(initialState);
    useCanvasStore.getState().popUndo(currentState);
    
    expect(useCanvasStore.getState().canRedo()).toBe(true);
    
    const redoneState = useCanvasStore.getState().popRedo(initialState);
    
    expect(redoneState).toBe(currentState);
    expect(useCanvasStore.getState().undoStack).toContain(initialState);
    expect(useCanvasStore.getState().redoStack).toHaveLength(0);
  });

  it('should respect UNDO_HISTORY_MAX', () => {
    // We should check the constant, but let's assume it's small for test or just test large number
    for (let i = 0; i < 60; i++) {
        useCanvasStore.getState().pushUndoState(`state-${i}`);
    }
    
    // UNDO_HISTORY_MAX is 50 in constants.ts
    expect(useCanvasStore.getState().undoStack.length).toBeLessThanOrEqual(50);
    expect(useCanvasStore.getState().undoStack[49]).toBe('state-59');
  });
});
