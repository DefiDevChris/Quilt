import { describe, it, expect, beforeEach } from 'vitest';
import { usePrintlistStore } from '@/stores/printlistStore';

describe('printlistStore (extended)', () => {
  beforeEach(() => {
    usePrintlistStore.setState({
      items: [],
      paperSize: 'letter',
      isPanelOpen: false,
      projectId: null,
      isSaving: false,
      isLoading: false,
    });
  });

  it('initializes with default state', () => {
    const state = usePrintlistStore.getState();
    expect(state.items).toEqual([]);
    expect(state.paperSize).toBe('letter');
    expect(state.isPanelOpen).toBe(false);
    expect(state.projectId).toBeNull();
  });

  it('adds item with default seam allowance', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'Triangle A',
      svgData: '<path d="M 0 0 L 100 0 L 50 100 Z"/>',
      quantity: 4,
      unitSystem: 'imperial',
    });
    const items = usePrintlistStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].seamAllowance).toBe(0.25);
    expect(items[0].quantity).toBe(4);
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

  it('sums quantities when adding duplicate shapeId', () => {
    const store = usePrintlistStore.getState();
    store.addItem({
      shapeId: 'shape-1',
      shapeName: 'Triangle',
      svgData: '<path/>',
      quantity: 2,
      unitSystem: 'imperial',
    });
    store.addItem({
      shapeId: 'shape-1',
      shapeName: 'Triangle',
      svgData: '<path/>',
      quantity: 3,
      unitSystem: 'imperial',
    });
    expect(usePrintlistStore.getState().items.length).toBe(1);
    expect(usePrintlistStore.getState().items[0].quantity).toBe(5);
  });

  it('removes item by shapeId', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'A',
      svgData: '<path/>',
      quantity: 1,
      unitSystem: 'imperial',
    });
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-2',
      shapeName: 'B',
      svgData: '<path/>',
      quantity: 1,
      unitSystem: 'imperial',
    });
    usePrintlistStore.getState().removeItem('shape-1');
    const items = usePrintlistStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].shapeId).toBe('shape-2');
  });

  it('updates quantity (minimum 1)', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'A',
      svgData: '<path/>',
      quantity: 5,
      unitSystem: 'imperial',
    });
    usePrintlistStore.getState().updateQuantity('shape-1', 10);
    expect(usePrintlistStore.getState().items[0].quantity).toBe(10);

    usePrintlistStore.getState().updateQuantity('shape-1', 0);
    expect(usePrintlistStore.getState().items[0].quantity).toBe(1);

    usePrintlistStore.getState().updateQuantity('shape-1', -5);
    expect(usePrintlistStore.getState().items[0].quantity).toBe(1);
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

  it('clears all items', () => {
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-1',
      shapeName: 'A',
      svgData: '<path/>',
      quantity: 1,
      unitSystem: 'imperial',
    });
    usePrintlistStore.getState().addItem({
      shapeId: 'shape-2',
      shapeName: 'B',
      svgData: '<path/>',
      quantity: 1,
      unitSystem: 'imperial',
    });
    usePrintlistStore.getState().clear();
    expect(usePrintlistStore.getState().items.length).toBe(0);
  });
});
