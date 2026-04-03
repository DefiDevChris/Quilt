import { describe, it, expect, beforeEach } from 'vitest';
import { useYardageStore } from '@/stores/yardageStore';

function resetStore() {
  useYardageStore.setState({
    isPanelOpen: false,
    wof: 44,
    wasteMargin: 0.1,
    results: [],
  });
}

describe('yardageStore', () => {
  beforeEach(resetStore);

  it('initializes with correct defaults', () => {
    const state = useYardageStore.getState();
    expect(state.isPanelOpen).toBe(false);
    expect(state.wof).toBe(44);
    expect(state.wasteMargin).toBe(0.1);
    expect(state.results).toEqual([]);
  });

  it('toggles panel open/close', () => {
    useYardageStore.getState().togglePanel();
    expect(useYardageStore.getState().isPanelOpen).toBe(true);
    useYardageStore.getState().togglePanel();
    expect(useYardageStore.getState().isPanelOpen).toBe(false);
  });

  it('sets panel open directly', () => {
    useYardageStore.getState().setPanelOpen(true);
    expect(useYardageStore.getState().isPanelOpen).toBe(true);
  });

  it('sets WOF', () => {
    useYardageStore.getState().setWof(54);
    expect(useYardageStore.getState().wof).toBe(54);
  });

  it('sets waste margin within bounds', () => {
    useYardageStore.getState().setWasteMargin(0.2);
    expect(useYardageStore.getState().wasteMargin).toBe(0.2);
  });

  it('clamps waste margin to minimum 5%', () => {
    useYardageStore.getState().setWasteMargin(0.01);
    expect(useYardageStore.getState().wasteMargin).toBe(0.05);
  });

  it('clamps waste margin to maximum 25%', () => {
    useYardageStore.getState().setWasteMargin(0.5);
    expect(useYardageStore.getState().wasteMargin).toBe(0.25);
  });

  it('sets results', () => {
    const results = [
      {
        groupKey: 'color:#FF0000',
        displayName: '#FF0000',
        fabricId: null,
        fillColor: '#FF0000',
        shapeCount: 2,
        totalAreaSqIn: 72,
        yardsRequired: 0.125,
        fatQuartersRequired: 1,
      },
    ];
    useYardageStore.getState().setResults(results);
    expect(useYardageStore.getState().results).toEqual(results);
  });
});
