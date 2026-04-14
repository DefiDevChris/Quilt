/**
 * Designer Store Tests
 *
 * Tests all state transitions in the Zustand designerStore.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignerStore } from '@/stores/designerStore';

describe('designerStore', () => {
  beforeEach(() => {
    useDesignerStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useDesignerStore.getState();
      expect(state.rows).toBe(3);
      expect(state.cols).toBe(3);
      expect(state.blockSize).toBe(12);
      expect(state.sashingWidth).toBe(0);
      expect(state.sashingFabricId).toBeNull();
      expect(state.sashingFabricUrl).toBeNull();
      expect(state.borders).toEqual([]);
      expect(state.userBlocks).toEqual([]);
      expect(state.realisticMode).toBe(false);
    });
  });

  describe('setRows', () => {
    it('should update rows', () => {
      useDesignerStore.getState().setRows(5);
      expect(useDesignerStore.getState().rows).toBe(5);
    });

    it('should not affect other state', () => {
      const before = useDesignerStore.getState();
      useDesignerStore.getState().setRows(4);
      const after = useDesignerStore.getState();
      expect(after.cols).toBe(before.cols);
      expect(after.blockSize).toBe(before.blockSize);
    });
  });

  describe('setCols', () => {
    it('should update cols', () => {
      useDesignerStore.getState().setCols(6);
      expect(useDesignerStore.getState().cols).toBe(6);
    });
  });

  describe('setBlockSize', () => {
    it('should update blockSize', () => {
      useDesignerStore.getState().setBlockSize(16);
      expect(useDesignerStore.getState().blockSize).toBe(16);
    });
  });

  describe('setSashing', () => {
    it('should update sashingWidth only', () => {
      useDesignerStore.getState().setSashing(3);
      const state = useDesignerStore.getState();
      expect(state.sashingWidth).toBe(3);
      expect(state.sashingFabricId).toBeNull();
      expect(state.sashingFabricUrl).toBeNull();
    });

    it('should update sashingWidth and fabricId', () => {
      useDesignerStore.getState().setSashing(2, 'fabric-1');
      const state = useDesignerStore.getState();
      expect(state.sashingWidth).toBe(2);
      expect(state.sashingFabricId).toBe('fabric-1');
      expect(state.sashingFabricUrl).toBeNull();
    });

    it('should update all sashing properties', () => {
      useDesignerStore.getState().setSashing(4, 'fabric-2', 'http://example.com/fabric.png');
      const state = useDesignerStore.getState();
      expect(state.sashingWidth).toBe(4);
      expect(state.sashingFabricId).toBe('fabric-2');
      expect(state.sashingFabricUrl).toBe('http://example.com/fabric.png');
    });

    it('should allow clearing fabricId and fabricUrl', () => {
      useDesignerStore.getState().setSashing(2, 'fabric-1', 'http://example.com/fabric.png');
      useDesignerStore.getState().setSashing(2, null, null);
      const state = useDesignerStore.getState();
      expect(state.sashingWidth).toBe(2);
      expect(state.sashingFabricId).toBeNull();
      expect(state.sashingFabricUrl).toBeNull();
    });
  });

  describe('setBorders', () => {
    it('should replace all borders', () => {
      const borders = [
        { width: 2, fabricId: 'f1', fabricUrl: null },
        { width: 3, fabricId: 'f2', fabricUrl: 'http://example.com/border.png' },
      ];
      useDesignerStore.getState().setBorders(borders);
      expect(useDesignerStore.getState().borders).toEqual(borders);
    });

    it('should set empty borders array', () => {
      useDesignerStore.getState().setBorders([{ width: 1, fabricId: null, fabricUrl: null }]);
      useDesignerStore.getState().setBorders([]);
      expect(useDesignerStore.getState().borders).toEqual([]);
    });
  });

  describe('addBorder', () => {
    it('should append a border to the end', () => {
      useDesignerStore.getState().addBorder({ width: 2, fabricId: 'f1', fabricUrl: null });
      useDesignerStore.getState().addBorder({ width: 3, fabricId: 'f2', fabricUrl: null });
      const borders = useDesignerStore.getState().borders;
      expect(borders).toHaveLength(2);
      expect(borders[0].width).toBe(2);
      expect(borders[1].width).toBe(3);
    });

    it('should start from empty array', () => {
      useDesignerStore.getState().reset();
      useDesignerStore.getState().addBorder({ width: 1, fabricId: null, fabricUrl: null });
      expect(useDesignerStore.getState().borders).toHaveLength(1);
    });
  });

  describe('removeBorder', () => {
    it('should remove border at given index', () => {
      useDesignerStore.getState().setBorders([
        { width: 1, fabricId: null, fabricUrl: null },
        { width: 2, fabricId: null, fabricUrl: null },
        { width: 3, fabricId: null, fabricUrl: null },
      ]);
      useDesignerStore.getState().removeBorder(1);
      const borders = useDesignerStore.getState().borders;
      expect(borders).toHaveLength(2);
      expect(borders[0].width).toBe(1);
      expect(borders[1].width).toBe(3);
    });

    it('should do nothing if index is out of bounds', () => {
      useDesignerStore.getState().setBorders([{ width: 1, fabricId: null, fabricUrl: null }]);
      useDesignerStore.getState().removeBorder(5);
      expect(useDesignerStore.getState().borders).toHaveLength(1);
    });

    it('should remove all borders one by one', () => {
      useDesignerStore.getState().setBorders([
        { width: 1, fabricId: null, fabricUrl: null },
        { width: 2, fabricId: null, fabricUrl: null },
      ]);
      useDesignerStore.getState().removeBorder(0);
      useDesignerStore.getState().removeBorder(0);
      expect(useDesignerStore.getState().borders).toHaveLength(0);
    });
  });

  describe('setUserBlocks', () => {
    it('should replace user blocks', () => {
      const blocks = [
        { id: 'b1', imageUrl: 'url1', thumbnailUrl: 'thumb1', name: 'Block 1' },
        { id: 'b2', imageUrl: 'url2', thumbnailUrl: 'thumb2', name: 'Block 2' },
      ];
      useDesignerStore.getState().setUserBlocks(blocks);
      expect(useDesignerStore.getState().userBlocks).toEqual(blocks);
    });

    it('should set empty blocks', () => {
      useDesignerStore
        .getState()
        .setUserBlocks([{ id: 'b1', imageUrl: 'url1', thumbnailUrl: 'thumb1', name: 'Block 1' }]);
      useDesignerStore.getState().setUserBlocks([]);
      expect(useDesignerStore.getState().userBlocks).toEqual([]);
    });
  });

  describe('setRealisticMode', () => {
    it('should toggle realistic mode on', () => {
      useDesignerStore.getState().setRealisticMode(true);
      expect(useDesignerStore.getState().realisticMode).toBe(true);
    });

    it('should toggle realistic mode off', () => {
      useDesignerStore.getState().setRealisticMode(true);
      useDesignerStore.getState().setRealisticMode(false);
      expect(useDesignerStore.getState().realisticMode).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state to defaults', () => {
      useDesignerStore.getState().setRows(5);
      useDesignerStore.getState().setCols(7);
      useDesignerStore.getState().setBlockSize(20);
      useDesignerStore.getState().setSashing(3, 'f1', 'url');
      useDesignerStore.getState().setBorders([{ width: 2, fabricId: 'f2', fabricUrl: null }]);
      useDesignerStore
        .getState()
        .setUserBlocks([{ id: 'b1', imageUrl: 'url', thumbnailUrl: 'thumb', name: 'Block' }]);
      useDesignerStore.getState().setRealisticMode(true);

      useDesignerStore.getState().reset();

      const state = useDesignerStore.getState();
      expect(state.rows).toBe(3);
      expect(state.cols).toBe(3);
      expect(state.blockSize).toBe(12);
      expect(state.sashingWidth).toBe(0);
      expect(state.sashingFabricId).toBeNull();
      expect(state.sashingFabricUrl).toBeNull();
      expect(state.borders).toEqual([]);
      expect(state.userBlocks).toEqual([]);
      expect(state.realisticMode).toBe(false);
    });
  });
});
