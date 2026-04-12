import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasStore } from '@/stores/canvasStore';
import type { ToolType } from '@/stores/canvasStore';
import {
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_DEFAULT,
  UNDO_HISTORY_MAX,
  UNDO_SNAPSHOT_SIZE_LIMIT,
} from '@/lib/constants';
import { DEFAULT_CANVAS } from '@/lib/design-system';

describe('canvasStore', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  describe('zoom', () => {
    it('sets zoom within bounds', () => {
      useCanvasStore.getState().setZoom(0.15);
      expect(useCanvasStore.getState().zoom).toBe(0.15);
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

    it('sets polygon tool', () => {
      useCanvasStore.getState().setActiveTool('polygon');
      expect(useCanvasStore.getState().activeTool).toBe('polygon');
    });

    it('setActiveTool saves previous tool settings', () => {
      useCanvasStore.getState().setFillColor('#FF0000');
      useCanvasStore.getState().setStrokeColor('#00FF00');
      useCanvasStore.getState().setStrokeWidth(3);
      useCanvasStore.getState().setActiveTool('rectangle');
      expect(useCanvasStore.getState().toolSettings.select).toEqual({
        fillColor: '#FF0000',
        strokeColor: '#00FF00',
        strokeWidth: 3,
      });
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

    it('pushUndoState returns false when exceeding size limit', () => {
      const largeState = 'x'.repeat(UNDO_SNAPSHOT_SIZE_LIMIT + 1);
      const result = useCanvasStore.getState().pushUndoState(largeState);
      expect(result).toBe(false);
      expect(useCanvasStore.getState().undoStack).toEqual([]);
    });

    it('pushUndoState returns true when within size limit', () => {
      const result = useCanvasStore.getState().pushUndoState('normal-state');
      expect(result).toBe(true);
      expect(useCanvasStore.getState().undoStack).toEqual(['normal-state']);
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

  describe('toolSettings', () => {
    it('saveToolSettings saves current colors and stroke', () => {
      useCanvasStore.getState().setFillColor('#AAAA00');
      useCanvasStore.getState().setStrokeColor('#BBBB00');
      useCanvasStore.getState().setStrokeWidth(5);
      useCanvasStore.getState().saveToolSettings('rectangle');
      expect(useCanvasStore.getState().toolSettings.rectangle).toEqual({
        fillColor: '#AAAA00',
        strokeColor: '#BBBB00',
        strokeWidth: 5,
      });
    });

    it('saveToolSettings saves current colors and stroke', () => {
      useCanvasStore.getState().setFillColor('#AAAA00');
      useCanvasStore.getState().setStrokeColor('#BBBB00');
      useCanvasStore.getState().setStrokeWidth(5);
      useCanvasStore.getState().saveToolSettings('rectangle');
      expect(useCanvasStore.getState().toolSettings.rectangle).toEqual({
        fillColor: '#AAAA00',
        strokeColor: '#BBBB00',
        strokeWidth: 5,
      });
    });

    it('loadToolSettings restores saved settings', () => {
      useCanvasStore.getState().setFillColor('#AAAA00');
      useCanvasStore.getState().setStrokeColor('#BBBB00');
      useCanvasStore.getState().setStrokeWidth(5);
      useCanvasStore.getState().saveToolSettings('rectangle');
      useCanvasStore.getState().setFillColor('#FFFFFF');
      useCanvasStore.getState().setStrokeColor('#FFFFFF');
      useCanvasStore.getState().setStrokeWidth(1);
      useCanvasStore.getState().loadToolSettings('rectangle');
      expect(useCanvasStore.getState().fillColor).toBe('#AAAA00');
      expect(useCanvasStore.getState().strokeColor).toBe('#BBBB00');
      expect(useCanvasStore.getState().strokeWidth).toBe(5);
    });

    it('loadToolSettings uses defaults when no settings saved', () => {
      useCanvasStore.getState().loadToolSettings('polygon');
      expect(useCanvasStore.getState().fillColor).toBe(DEFAULT_CANVAS.fill);
      expect(useCanvasStore.getState().strokeColor).toBe(DEFAULT_CANVAS.stroke);
      expect(useCanvasStore.getState().strokeWidth).toBe(1);
    });
  });

  describe('tool type validation', () => {
    const toolTypes: ToolType[] = [
      'select',
      'pan',
      'rectangle',
      'circle',
      'triangle',
      'polygon',
      'easydraw',
    ];

    it.each(toolTypes)('accepts tool type: %s', (toolType) => {
      useCanvasStore.getState().setActiveTool(toolType);
      expect(useCanvasStore.getState().activeTool).toBe(toolType);
    });
  });

  describe('blockDraftingMode', () => {
    it('defaults to freeform', () => {
      expect(useCanvasStore.getState().blockDraftingMode).toBe('freeform');
    });

    it('can be set to easydraw', () => {
      useCanvasStore.getState().setBlockDraftingMode('blockbuilder');
      expect(useCanvasStore.getState().blockDraftingMode).toBe('blockbuilder');
    });

    it('updates immutably (does not mutate previous state snapshot)', () => {
      const before = useCanvasStore.getState();
      useCanvasStore.getState().setBlockDraftingMode('blockbuilder');
      const after = useCanvasStore.getState();
      expect(before.blockDraftingMode).toBe('freeform');
      expect(after.blockDraftingMode).toBe('blockbuilder');
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

  describe('viewport and other settings', () => {
    it('setViewportLocked sets isViewportLocked', () => {
      useCanvasStore.getState().setViewportLocked(false);
      expect(useCanvasStore.getState().isViewportLocked).toBe(false);
      useCanvasStore.getState().setViewportLocked(true);
      expect(useCanvasStore.getState().isViewportLocked).toBe(true);
    });

    it('toggleSeamAllowance toggles showSeamAllowance', () => {
      expect(useCanvasStore.getState().showSeamAllowance).toBe(true);
      useCanvasStore.getState().toggleSeamAllowance();
      expect(useCanvasStore.getState().showSeamAllowance).toBe(false);
    });

    it('setPrintScale clamps to 0.1-2.0', () => {
      useCanvasStore.getState().setPrintScale(0.05);
      expect(useCanvasStore.getState().printScale).toBe(0.1);
      useCanvasStore.getState().setPrintScale(3);
      expect(useCanvasStore.getState().printScale).toBe(2.0);
      useCanvasStore.getState().setPrintScale(1.5);
      expect(useCanvasStore.getState().printScale).toBe(1.5);
    });

    it('setClipboard sets clipboard', () => {
      useCanvasStore.getState().setClipboard([{ type: 'rect' }]);
      expect(useCanvasStore.getState().clipboard).toEqual([{ type: 'rect' }]);
    });

    it('setActiveWorktable sets active worktable', () => {
      useCanvasStore.getState().setActiveWorktable('block-builder');
      expect(useCanvasStore.getState().activeWorktable).toBe('block-builder');
      useCanvasStore.getState().setActiveWorktable('quilt');
      expect(useCanvasStore.getState().activeWorktable).toBe('quilt');
    });

    it('reset restores initial state', () => {
      useCanvasStore.getState().setActiveTool('rectangle');
      useCanvasStore.getState().setZoom(0.18);
      useCanvasStore.getState().setFillColor('#FF0000');
      useCanvasStore.getState().pushUndoState('test');

      useCanvasStore.getState().reset();

      const state = useCanvasStore.getState();
      expect(state.activeTool).toBe('select');
      expect(state.zoom).toBe(ZOOM_DEFAULT);
      expect(state.fillColor).toBe(DEFAULT_CANVAS.fill);
      expect(state.undoStack).toEqual([]);
    });
  });
});
