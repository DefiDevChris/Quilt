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
});
