import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBlockBuilderStore } from '@/stores/blockBuilderStore';

describe('blockBuilderStore', () => {
  beforeEach(() => {
    useBlockBuilderStore.getState().reset();
  });

  it('tracks segment and patch counts', () => {
    useBlockBuilderStore.getState().setCounts(5, 3);
    
    expect(useBlockBuilderStore.getState().segmentCount).toBe(5);
    expect(useBlockBuilderStore.getState().patchCount).toBe(3);
  });

  it('resets counts', () => {
    useBlockBuilderStore.getState().setCounts(5, 3);
    useBlockBuilderStore.getState().reset();
    
    expect(useBlockBuilderStore.getState().segmentCount).toBe(0);
    expect(useBlockBuilderStore.getState().patchCount).toBe(0);
  });
});