import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDesignerStore } from '@/stores/designerStore';

describe('Designer Store - isDirty tracking', () => {
  beforeEach(() => {
    useDesignerStore.getState().reset();
  });

  it('starts with isDirty = false', () => {
    expect(useDesignerStore.getState().isDirty).toBe(false);
  });

  it('sets isDirty = true when rows change', () => {
    useDesignerStore.getState().setRows(4);
    expect(useDesignerStore.getState().isDirty).toBe(true);
  });

  it('sets isDirty = true when cols change', () => {
    useDesignerStore.getState().setCols(5);
    expect(useDesignerStore.getState().isDirty).toBe(true);
  });

  it('sets isDirty = true when blockSize changes', () => {
    useDesignerStore.getState().setBlockSize(10);
    expect(useDesignerStore.getState().isDirty).toBe(true);
  });

  it('sets isDirty = true when sashing changes', () => {
    useDesignerStore.getState().setSashing(2);
    expect(useDesignerStore.getState().isDirty).toBe(true);
  });

  it('sets isDirty = true when borders change', () => {
    useDesignerStore.getState().setBorders([{ width: 2, fabricId: null, fabricUrl: null }]);
    expect(useDesignerStore.getState().isDirty).toBe(true);
  });

  it('sets isDirty = true when a border is added', () => {
    useDesignerStore.getState().addBorder({ width: 1, fabricId: null, fabricUrl: null });
    expect(useDesignerStore.getState().isDirty).toBe(true);
  });

  it('sets isDirty = true when a border is removed', () => {
    useDesignerStore.getState().addBorder({ width: 1, fabricId: null, fabricUrl: null });
    useDesignerStore.getState().removeBorder(0);
    expect(useDesignerStore.getState().isDirty).toBe(true);
  });

  it('sets isDirty = true when userBlocks change', () => {
    useDesignerStore.getState().setUserBlocks([{ id: 'b1', imageUrl: 'url', thumbnailUrl: 'thumb', name: 'Block' }]);
    expect(useDesignerStore.getState().isDirty).toBe(true);
  });

  it('sets isDirty = true when realisticMode changes', () => {
    useDesignerStore.getState().setRealisticMode(true);
    expect(useDesignerStore.getState().isDirty).toBe(true);
  });

  it('can set dirty manually', () => {
    useDesignerStore.getState().setDirty(false);
    expect(useDesignerStore.getState().isDirty).toBe(false);
    useDesignerStore.getState().setDirty(true);
    expect(useDesignerStore.getState().isDirty).toBe(true);
  });

  it('tracks lastSavedAt', () => {
    const date = new Date('2026-04-13');
    useDesignerStore.getState().setLastSavedAt(date);
    expect(useDesignerStore.getState().lastSavedAt).toBe(date);
  });

  it('reset clears isDirty and lastSavedAt', () => {
    useDesignerStore.getState().setRows(4);
    useDesignerStore.getState().setLastSavedAt(new Date());
    useDesignerStore.getState().reset();
    expect(useDesignerStore.getState().isDirty).toBe(false);
    expect(useDesignerStore.getState().lastSavedAt).toBeNull();
  });
});
