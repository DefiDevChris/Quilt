import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '@/stores/canvasStore';
import type { ToolType } from '@/stores/canvasStore';

describe('canvasStore Phase 14 extensions', () => {
  beforeEach(() => {
    // Reset store to initial state
    useCanvasStore.setState({
      activeTool: 'select',
      blockDraftingMode: 'freeform',
      referenceImageOpacity: 0.5,
      activeColorwayTool: null,
      fillColor: '#8d4f00',
      strokeColor: '#383831',
      undoStack: [],
      redoStack: [],
    });
  });

  describe('extended ToolType', () => {
    const newToolTypes: ToolType[] = ['easydraw', 'text', 'eyedropper', 'spraycan'];

    it.each(newToolTypes)('accepts new tool type: %s', (toolType) => {
      useCanvasStore.getState().setActiveTool(toolType);
      expect(useCanvasStore.getState().activeTool).toBe(toolType);
    });

    it('still accepts existing tool types', () => {
      const existingTools: ToolType[] = ['select', 'rectangle', 'triangle', 'polygon', 'line', 'curve'];
      for (const tool of existingTools) {
        useCanvasStore.getState().setActiveTool(tool);
        expect(useCanvasStore.getState().activeTool).toBe(tool);
      }
    });
  });

  describe('blockDraftingMode', () => {
    it('defaults to freeform', () => {
      expect(useCanvasStore.getState().blockDraftingMode).toBe('freeform');
    });

    it('can be set to easydraw', () => {
      useCanvasStore.getState().setBlockDraftingMode('easydraw');
      expect(useCanvasStore.getState().blockDraftingMode).toBe('easydraw');
    });

    it('can be set to applique', () => {
      useCanvasStore.getState().setBlockDraftingMode('applique');
      expect(useCanvasStore.getState().blockDraftingMode).toBe('applique');
    });

    it('updates immutably (does not mutate previous state snapshot)', () => {
      const before = useCanvasStore.getState();
      useCanvasStore.getState().setBlockDraftingMode('easydraw');
      const after = useCanvasStore.getState();
      expect(before.blockDraftingMode).toBe('freeform');
      expect(after.blockDraftingMode).toBe('easydraw');
    });
  });

  describe('referenceImageOpacity', () => {
    it('defaults to 0.5', () => {
      expect(useCanvasStore.getState().referenceImageOpacity).toBe(0.5);
    });

    it('can be set to valid values', () => {
      useCanvasStore.getState().setReferenceImageOpacity(0.8);
      expect(useCanvasStore.getState().referenceImageOpacity).toBe(0.8);
    });

    it('clamps to minimum 0', () => {
      useCanvasStore.getState().setReferenceImageOpacity(-0.5);
      expect(useCanvasStore.getState().referenceImageOpacity).toBe(0);
    });

    it('clamps to maximum 1', () => {
      useCanvasStore.getState().setReferenceImageOpacity(1.5);
      expect(useCanvasStore.getState().referenceImageOpacity).toBe(1);
    });
  });

  describe('activeColorwayTool', () => {
    it('defaults to null', () => {
      expect(useCanvasStore.getState().activeColorwayTool).toBeNull();
    });

    it('can be set to spraycan', () => {
      useCanvasStore.getState().setActiveColorwayTool('spraycan');
      expect(useCanvasStore.getState().activeColorwayTool).toBe('spraycan');
    });

    it('can be set to swap', () => {
      useCanvasStore.getState().setActiveColorwayTool('swap');
      expect(useCanvasStore.getState().activeColorwayTool).toBe('swap');
    });

    it('can be set to randomize', () => {
      useCanvasStore.getState().setActiveColorwayTool('randomize');
      expect(useCanvasStore.getState().activeColorwayTool).toBe('randomize');
    });

    it('can be set to eyedropper', () => {
      useCanvasStore.getState().setActiveColorwayTool('eyedropper');
      expect(useCanvasStore.getState().activeColorwayTool).toBe('eyedropper');
    });

    it('can be cleared to null', () => {
      useCanvasStore.getState().setActiveColorwayTool('spraycan');
      useCanvasStore.getState().setActiveColorwayTool(null);
      expect(useCanvasStore.getState().activeColorwayTool).toBeNull();
    });
  });
});
