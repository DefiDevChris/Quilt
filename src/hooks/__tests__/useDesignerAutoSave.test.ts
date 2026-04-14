import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock dependencies
vi.mock('@/stores/designerStore', () => ({
  useDesignerStore: {
    getState: vi.fn(() => ({
      isDirty: false,
      rows: 3,
      cols: 3,
      blockSize: 12,
      sashingWidth: 0,
      sashingFabricId: null,
      sashingFabricUrl: null,
      borders: [],
      realisticMode: false,
      userBlocks: [],
      lastSavedAt: null,
    })),
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      isPro: true,
      user: {
        id: 'user-1',
        email: 'test@test.com',
        role: 'pro',
        name: '',
        image: null,
        privacyMode: 'public' as const,
      },
      isLoading: false,
      isAdmin: false,
      isPrivate: false,
      setUser: vi.fn(),
      reset: vi.fn(),
    })),
  },
}));

vi.mock('@/lib/constants', () => ({
  AUTO_SAVE_INTERVAL_MS: 100,
  PIXELS_PER_INCH: 96,
  DEFAULT_CANVAS_WIDTH: 48,
  DEFAULT_CANVAS_HEIGHT: 48,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { useDesignerStore } from '@/stores/designerStore';
import { useAuthStore } from '@/stores/authStore';
import { AUTO_SAVE_INTERVAL_MS } from '@/lib/constants';

const { useDesignerAutoSave } = await import('@/hooks/useDesignerAutoSave');

describe('useDesignerAutoSave', () => {
  const mockFabricCanvas = {
    toJSON: vi.fn(() => ({ version: '1.0', objects: [] })),
    toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockdata'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not save when projectId is null', () => {
    renderHook(() => useDesignerAutoSave({ fabricCanvas: mockFabricCanvas, projectId: null }));
    vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS + 10);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not save when fabricCanvas is null', () => {
    renderHook(() => useDesignerAutoSave({ fabricCanvas: null, projectId: 'designer-1' }));
    vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS + 10);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not save when user is not pro', () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      isPro: false,
      user: {
        id: 'user-1',
        email: 'test@test.com',
        role: 'free',
        name: '',
        image: null,
        privacyMode: 'public' as const,
      },
      isLoading: false,
      isAdmin: false,
      isPrivate: false,
      setUser: vi.fn(),
      reset: vi.fn(),
    });

    renderHook(() =>
      useDesignerAutoSave({ fabricCanvas: mockFabricCanvas, projectId: 'designer-1' })
    );
    vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS + 10);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not save when not dirty', () => {
    const mockState = {
      isDirty: false,
      rows: 3,
      cols: 3,
      blockSize: 12,
      sashingWidth: 0,
      sashingFabricId: null,
      sashingFabricUrl: null,
      borders: [],
      realisticMode: false,
      userBlocks: [],
      lastSavedAt: null,
      setRows: vi.fn(),
      setCols: vi.fn(),
      setBlockSize: vi.fn(),
      setSashing: vi.fn(),
      setBorders: vi.fn(),
      addBorder: vi.fn(),
      removeBorder: vi.fn(),
      setUserBlocks: vi.fn(),
      setRealisticMode: vi.fn(),
      setDirty: vi.fn(),
      setLastSavedAt: vi.fn(),
      reset: vi.fn(),
    };
    vi.mocked(useDesignerStore.getState).mockReturnValue(mockState);

    renderHook(() =>
      useDesignerAutoSave({ fabricCanvas: mockFabricCanvas, projectId: 'designer-1' })
    );
    vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS + 10);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not throw during render and unmount', () => {
    const mockState = {
      isDirty: true,
      rows: 3,
      cols: 3,
      blockSize: 12,
      sashingWidth: 0,
      sashingFabricId: null,
      sashingFabricUrl: null,
      borders: [],
      realisticMode: false,
      userBlocks: [],
      lastSavedAt: null,
      setRows: vi.fn(),
      setCols: vi.fn(),
      setBlockSize: vi.fn(),
      setSashing: vi.fn(),
      setBorders: vi.fn(),
      addBorder: vi.fn(),
      removeBorder: vi.fn(),
      setUserBlocks: vi.fn(),
      setRealisticMode: vi.fn(),
      setDirty: vi.fn(),
      setLastSavedAt: vi.fn(),
      reset: vi.fn(),
    };
    vi.mocked(useDesignerStore.getState).mockReturnValue(mockState);

    expect(() => {
      const { unmount } = renderHook(() =>
        useDesignerAutoSave({ fabricCanvas: mockFabricCanvas, projectId: 'designer-1' })
      );
      unmount();
    }).not.toThrow();
  });

  it('preserves store state on hook lifecycle', () => {
    const mockState = {
      isDirty: true,
      rows: 4,
      cols: 5,
      blockSize: 12,
      sashingWidth: 0,
      sashingFabricId: null,
      sashingFabricUrl: null,
      borders: [],
      realisticMode: false,
      userBlocks: [],
      lastSavedAt: null,
      setRows: vi.fn(),
      setCols: vi.fn(),
      setBlockSize: vi.fn(),
      setSashing: vi.fn(),
      setBorders: vi.fn(),
      addBorder: vi.fn(),
      removeBorder: vi.fn(),
      setUserBlocks: vi.fn(),
      setRealisticMode: vi.fn(),
      setDirty: vi.fn(),
      setLastSavedAt: vi.fn(),
      reset: vi.fn(),
    };
    vi.mocked(useDesignerStore.getState).mockReturnValue(mockState);

    const { unmount } = renderHook(() =>
      useDesignerAutoSave({ fabricCanvas: mockFabricCanvas, projectId: 'designer-1' })
    );

    const stateAfter = useDesignerStore.getState();
    expect(stateAfter.rows).toBe(4);
    expect(stateAfter.cols).toBe(5);

    unmount();
  });
});
