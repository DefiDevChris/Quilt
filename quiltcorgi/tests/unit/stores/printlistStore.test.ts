import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrintlistStore } from '@/stores/printlistStore';
import { DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';

describe('printlistStore', () => {
  beforeEach(() => {
    usePrintlistStore.getState().reset();
  });

  it('initializes with empty items', () => {
    expect(usePrintlistStore.getState().items).toEqual([]);
  });

  it('adds an item with default seam allowance', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'Triangle A',
      svgData: '<polygon/>',
      quantity: 4,
      unitSystem: 'imperial',
    });
    const items = usePrintlistStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].shapeId).toBe('shape-1');
    expect(items[0].quantity).toBe(4);
    expect(items[0].seamAllowance).toBe(DEFAULT_SEAM_ALLOWANCE_INCHES);
  });

  it('adds quantity to existing item instead of duplicating', () => {
    const store = usePrintlistStore.getState();
    store.addItem({
      shapeId: 'shape-1',
      shapeName: 'Triangle A',
      svgData: '<polygon/>',
      quantity: 2,
      unitSystem: 'imperial',
    });
    store.addItem({
      shapeId: 'shape-1',
      shapeName: 'Triangle A',
      svgData: '<polygon/>',
      quantity: 3,
      unitSystem: 'imperial',
    });
    const items = usePrintlistStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  it('removes an item by shapeId', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'Rect',
      svgData: '<rect/>',
      quantity: 1,
      unitSystem: 'imperial',
    });
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-2',
      shapeName: 'Circle',
      svgData: '<circle/>',
      quantity: 1,
      unitSystem: 'metric',
    });
    usePrintlistStore.getState().removeItem('shape-1');
    const items = usePrintlistStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].shapeId).toBe('shape-2');
  });

  it('updates quantity with minimum of 1', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'Rect',
      svgData: '<rect/>',
      quantity: 5,
      unitSystem: 'imperial',
    });
    usePrintlistStore.getState().updateQuantity('shape-1', 0);
    expect(usePrintlistStore.getState().items[0].quantity).toBe(1);

    usePrintlistStore.getState().updateQuantity('shape-1', 10);
    expect(usePrintlistStore.getState().items[0].quantity).toBe(10);
  });

  it('clears all items', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'Rect',
      svgData: '<rect/>',
      quantity: 1,
      unitSystem: 'imperial',
    });
    usePrintlistStore.getState().clear();
    expect(usePrintlistStore.getState().items).toEqual([]);
  });

  it('adds item with custom seam allowance', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'Square',
      svgData: '<path/>',
      quantity: 1,
      unitSystem: 'imperial',
      seamAllowance: 0.5,
    });
    expect(usePrintlistStore.getState().items[0].seamAllowance).toBe(0.5);
  });

  it('updates seam allowance (clamped 0-1)', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'A',
      svgData: '<path/>',
      quantity: 1,
      unitSystem: 'imperial',
    });
    usePrintlistStore.getState().updateSeamAllowance('shape-1', 0.5);
    expect(usePrintlistStore.getState().items[0].seamAllowance).toBe(0.5);

    usePrintlistStore.getState().updateSeamAllowance('shape-1', 2);
    expect(usePrintlistStore.getState().items[0].seamAllowance).toBe(1);

    usePrintlistStore.getState().updateSeamAllowance('shape-1', -0.5);
    expect(usePrintlistStore.getState().items[0].seamAllowance).toBe(0);
  });

  it('sets paper size', () => {
    usePrintlistStore.getState().setPaperSize('a4');
    expect(usePrintlistStore.getState().paperSize).toBe('a4');
  });

  it('toggles panel', () => {
    expect(usePrintlistStore.getState().isPanelOpen).toBe(false);
    usePrintlistStore.getState().togglePanel();
    expect(usePrintlistStore.getState().isPanelOpen).toBe(true);
    usePrintlistStore.getState().togglePanel();
    expect(usePrintlistStore.getState().isPanelOpen).toBe(false);
  });

  it('sets project id', () => {
    usePrintlistStore.getState().setProjectId('proj-123');
    expect(usePrintlistStore.getState().projectId).toBe('proj-123');
  });

  it('enforces minimum quantity of 1 for negative values', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'A',
      svgData: '<path/>',
      quantity: 5,
      unitSystem: 'imperial',
    });
    usePrintlistStore.getState().updateQuantity('shape-1', -5);
    expect(usePrintlistStore.getState().items[0].quantity).toBe(1);
  });

  describe('quantity clamping', () => {
    it('clamps quantity to max 9999', () => {
      usePrintlistStore.getState().addItem({
        shapeId: 'shape-1',
        shapeName: 'A',
        svgData: '<path/>',
        quantity: 10000,
        unitSystem: 'imperial',
      });
      expect(usePrintlistStore.getState().items[0].quantity).toBe(9999);
    });

    it('clamps quantity to min 1', () => {
      usePrintlistStore.getState().addItem({
        shapeId: 'shape-1',
        shapeName: 'A',
        svgData: '<path/>',
        quantity: 0,
        unitSystem: 'imperial',
      });
      expect(usePrintlistStore.getState().items[0].quantity).toBe(1);
    });

    it('accumulated quantity clamped to max', () => {
      const store = usePrintlistStore.getState();
      store.addItem({
        shapeId: 'shape-1',
        shapeName: 'A',
        svgData: '<path/>',
        quantity: 9000,
        unitSystem: 'imperial',
      });
      store.addItem({
        shapeId: 'shape-1',
        shapeName: 'A',
        svgData: '<path/>',
        quantity: 2000,
        unitSystem: 'imperial',
      });
      expect(usePrintlistStore.getState().items[0].quantity).toBe(9999);
    });
  });

  describe('toggleSeamAllowance', () => {
    it('toggles seam allowance enabled', () => {
      usePrintlistStore.getState().addItem({
        shapeId: 'shape-1',
        shapeName: 'A',
        svgData: '<path/>',
        quantity: 1,
        unitSystem: 'imperial',
      });
      expect(usePrintlistStore.getState().items[0].seamAllowanceEnabled).toBe(true);
      usePrintlistStore.getState().toggleSeamAllowance('shape-1');
      expect(usePrintlistStore.getState().items[0].seamAllowanceEnabled).toBe(false);
    });
  });

  describe('syncItemSvg', () => {
    it('updates SVG data for item', () => {
      usePrintlistStore.getState().addItem({
        shapeId: 'shape-1',
        shapeName: 'A',
        svgData: '<path/>',
        quantity: 1,
        unitSystem: 'imperial',
      });
      usePrintlistStore.getState().syncItemSvg('shape-1', '<rect/>');
      expect(usePrintlistStore.getState().items[0].svgData).toBe('<rect/>');
    });
  });

  describe('loadFromServer', () => {
    it('loads items from server', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { items: [{ shapeId: 's1', shapeName: 'X', svgData: '', quantity: 1, unitSystem: 'imperial', seamAllowance: 0.25, seamAllowanceEnabled: true }], paperSize: 'letter' } }),
      });
      globalThis.fetch = mockFetch;

      await usePrintlistStore.getState().loadFromServer('proj-1');
      expect(usePrintlistStore.getState().items).toHaveLength(1);
      expect(usePrintlistStore.getState().projectId).toBe('proj-1');
      expect(usePrintlistStore.getState().isLoading).toBe(false);
    });

    it('handles 404 as empty list', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      globalThis.fetch = mockFetch;

      await usePrintlistStore.getState().loadFromServer('proj-1');
      expect(usePrintlistStore.getState().items).toHaveLength(0);
      expect(usePrintlistStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading during fetch', async () => {
      let fetchPromise: Promise<Response> | null = null;
      const mockFetch = vi.fn().mockImplementation(() => {
        if (!fetchPromise) {
          fetchPromise = Promise.resolve({
            ok: true,
            json: async () => ({ data: { items: [], paperSize: 'letter' } }),
          });
        }
        return fetchPromise;
      });
      globalThis.fetch = mockFetch;

      const loadPromise = usePrintlistStore.getState().loadFromServer('proj-1');
      expect(usePrintlistStore.getState().isLoading).toBe(true);
      await loadPromise;
      expect(usePrintlistStore.getState().isLoading).toBe(false);
    });
  });

  describe('saveToServer', () => {
    it('sends items and paperSize to server', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
      });
      globalThis.fetch = mockFetch;

      usePrintlistStore.getState().addItem({
        shapeId: 'shape-1',
        shapeName: 'A',
        svgData: '<path/>',
        quantity: 2,
        unitSystem: 'imperial',
      });
      usePrintlistStore.getState().setPaperSize('a4');

      await usePrintlistStore.getState().saveToServer('proj-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/printlist', expect.objectContaining({
        method: 'PUT',
      }));
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.items).toHaveLength(1);
      expect(body.items[0].shapeId).toBe('shape-1');
      expect(body.paperSize).toBe('a4');
    });

    it('sets lastSaveError on failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      globalThis.fetch = mockFetch;

      await usePrintlistStore.getState().saveToServer('proj-1');
      expect(usePrintlistStore.getState().lastSaveError).toBeTruthy();
    });

    it('sets isSaving during save', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = mockFetch;

      const savePromise = usePrintlistStore.getState().saveToServer('proj-1');
      expect(usePrintlistStore.getState().isSaving).toBe(true);
      await savePromise;
      expect(usePrintlistStore.getState().isSaving).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      usePrintlistStore.getState().addItem({
        shapeId: 'shape-1',
        shapeName: 'A',
        svgData: '<path/>',
        quantity: 5,
        unitSystem: 'imperial',
      });
      usePrintlistStore.getState().setPaperSize('a4');
      usePrintlistStore.getState().setProjectId('proj-1');

      usePrintlistStore.getState().reset();

      expect(usePrintlistStore.getState().items).toEqual([]);
      expect(usePrintlistStore.getState().paperSize).toBe('letter');
      expect(usePrintlistStore.getState().projectId).toBeNull();
      expect(usePrintlistStore.getState().isPanelOpen).toBe(false);
      expect(usePrintlistStore.getState().lastSaveError).toBeNull();
    });
  });
});
