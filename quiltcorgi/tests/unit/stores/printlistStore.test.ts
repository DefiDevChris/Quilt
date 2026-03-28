import { describe, it, expect, beforeEach } from 'vitest';
import { usePrintlistStore } from '@/stores/printlistStore';
import { DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';

function resetStore() {
  usePrintlistStore.setState({ items: [] });
}

describe('printlistStore', () => {
  beforeEach(resetStore);

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
});
