import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '@/stores/layoutStore';

function resetStore() {
  useLayoutStore.setState({
    layoutType: 'free-form',
    rows: 3,
    cols: 3,
    blockSize: 6,
    sashing: { width: 1, color: '#F5F0E8', fabricId: null },
    borders: [],
  });
}

describe('layoutStore', () => {
  beforeEach(resetStore);

  describe('layoutType', () => {
    it('defaults to free-form', () => {
      expect(useLayoutStore.getState().layoutType).toBe('free-form');
    });

    it('sets layout type', () => {
      useLayoutStore.getState().setLayoutType('grid');
      expect(useLayoutStore.getState().layoutType).toBe('grid');
    });

    it('supports all layout types', () => {
      const types = ['free-form', 'grid', 'sashing', 'on-point'] as const;
      types.forEach((type) => {
        useLayoutStore.getState().setLayoutType(type);
        expect(useLayoutStore.getState().layoutType).toBe(type);
      });
    });
  });

  describe('rows and cols', () => {
    it('sets rows within bounds', () => {
      useLayoutStore.getState().setRows(5);
      expect(useLayoutStore.getState().rows).toBe(5);
    });

    it('clamps rows to min 1', () => {
      useLayoutStore.getState().setRows(0);
      expect(useLayoutStore.getState().rows).toBe(1);
    });

    it('clamps rows to max 20', () => {
      useLayoutStore.getState().setRows(25);
      expect(useLayoutStore.getState().rows).toBe(20);
    });

    it('sets cols within bounds', () => {
      useLayoutStore.getState().setCols(8);
      expect(useLayoutStore.getState().cols).toBe(8);
    });

    it('clamps cols to min 1', () => {
      useLayoutStore.getState().setCols(-1);
      expect(useLayoutStore.getState().cols).toBe(1);
    });

    it('clamps cols to max 20', () => {
      useLayoutStore.getState().setCols(30);
      expect(useLayoutStore.getState().cols).toBe(20);
    });
  });

  describe('blockSize', () => {
    it('sets block size', () => {
      useLayoutStore.getState().setBlockSize(12);
      expect(useLayoutStore.getState().blockSize).toBe(12);
    });

    it('clamps to min 1', () => {
      useLayoutStore.getState().setBlockSize(0);
      expect(useLayoutStore.getState().blockSize).toBe(1);
    });

    it('clamps to max 24', () => {
      useLayoutStore.getState().setBlockSize(30);
      expect(useLayoutStore.getState().blockSize).toBe(24);
    });
  });

  describe('sashing', () => {
    it('partially updates sashing config', () => {
      useLayoutStore.getState().setSashing({ width: 2 });
      const s = useLayoutStore.getState().sashing;
      expect(s.width).toBe(2);
      expect(s.color).toBe('#F5F0E8'); // unchanged
      expect(s.fabricId).toBeNull();
    });

    it('updates sashing color', () => {
      useLayoutStore.getState().setSashing({ color: '#FF0000' });
      expect(useLayoutStore.getState().sashing.color).toBe('#FF0000');
    });

    it('updates sashing fabricId', () => {
      useLayoutStore.getState().setSashing({ fabricId: 'fab-1' });
      expect(useLayoutStore.getState().sashing.fabricId).toBe('fab-1');
    });
  });

  describe('borders', () => {
    it('starts with no borders', () => {
      expect(useLayoutStore.getState().borders).toEqual([]);
    });

    it('adds a border with defaults', () => {
      useLayoutStore.getState().addBorder();
      const borders = useLayoutStore.getState().borders;
      expect(borders.length).toBe(1);
      expect(borders[0].width).toBe(2);
      expect(borders[0].color).toBe('#2D2D2D');
      expect(borders[0].fabricId).toBeNull();
    });

    it('limits to 5 borders max', () => {
      for (let i = 0; i < 7; i++) {
        useLayoutStore.getState().addBorder();
      }
      expect(useLayoutStore.getState().borders.length).toBe(5);
    });

    it('updates a specific border', () => {
      useLayoutStore.getState().addBorder();
      useLayoutStore.getState().addBorder();
      useLayoutStore.getState().updateBorder(1, { color: '#00FF00', width: 3 });
      const borders = useLayoutStore.getState().borders;
      expect(borders[0].color).toBe('#2D2D2D');
      expect(borders[1].color).toBe('#00FF00');
      expect(borders[1].width).toBe(3);
    });

    it('removes a border by index', () => {
      useLayoutStore.getState().addBorder();
      useLayoutStore.getState().addBorder();
      useLayoutStore.getState().updateBorder(0, { color: '#AAA' });
      useLayoutStore.getState().updateBorder(1, { color: '#BBB' });
      useLayoutStore.getState().removeBorder(0);
      const borders = useLayoutStore.getState().borders;
      expect(borders.length).toBe(1);
      expect(borders[0].color).toBe('#BBB');
    });
  });

  describe('reset', () => {
    it('resets all state to defaults', () => {
      useLayoutStore.getState().setLayoutType('sashing');
      useLayoutStore.getState().setRows(10);
      useLayoutStore.getState().setCols(8);
      useLayoutStore.getState().setBlockSize(12);
      useLayoutStore.getState().setSashing({ width: 3, color: '#000' });
      useLayoutStore.getState().addBorder();

      useLayoutStore.getState().reset();

      const state = useLayoutStore.getState();
      expect(state.layoutType).toBe('free-form');
      expect(state.rows).toBe(3);
      expect(state.cols).toBe(3);
      expect(state.blockSize).toBe(6);
      expect(state.sashing.width).toBe(1);
      expect(state.borders).toEqual([]);
    });
  });
});
