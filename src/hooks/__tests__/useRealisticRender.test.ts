// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock fabric module
vi.mock('fabric', async () => {
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class MockShadow {
    opts: Record<string, unknown>;
    constructor(opts: Record<string, unknown>) {
      this.opts = opts;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class MockLine {
    coords: number[];
    opts: Record<string, unknown>;
    constructor(coords: number[], opts: Record<string, unknown>) {
      this.coords = coords;
      this.opts = opts;
    }
  }
  return {
    Shadow: MockShadow,
    Line: MockLine,
  };
});

// Mock designerStore
vi.mock('@/stores/designerStore', () => {
  const mockState = { realisticMode: false };
  const subscribers: Array<() => void> = [];

  const mockFn = vi.fn((selector?: (s: typeof mockState) => unknown) => {
    if (selector) return selector(mockState);
    return mockState;
  });
  Object.assign(mockFn, {
    getState: vi.fn(() => mockState),
    subscribe: vi.fn((fn: () => void) => {
      subscribers.push(fn);
      return () => {
        const idx = subscribers.indexOf(fn);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    }),
  });
  return { useDesignerStore: mockFn };
});

// Mock CanvasContext with a shared mock canvas
const mockCanvas = {
  getObjects: vi.fn(() => [] as unknown[]),
  add: vi.fn(),
  remove: vi.fn(),
  requestRenderAll: vi.fn(),
  getZoom: vi.fn(() => 1),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('@/contexts/CanvasContext', () => ({
  useCanvasContext: vi.fn(() => ({
    canvasRef: { current: null },
    getCanvas: vi.fn(() => mockCanvas),
    setCanvas: vi.fn(),
  })),
}));

import { useRealisticRender } from '@/hooks/useRealisticRender';
import { useCanvasContext } from '@/contexts/CanvasContext';

describe('useRealisticRender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when canvas is not available', () => {
    vi.mocked(useCanvasContext).mockReturnValueOnce({
      canvasRef: { current: null },
      getCanvas: vi.fn(() => null),
      setCanvas: vi.fn(),
    });

    expect(() => {
      renderHook(() => useRealisticRender());
    }).not.toThrow();
  });

  it('runs without errors when realisticMode is false', () => {
    const { unmount } = renderHook(() => useRealisticRender());

    expect(mockCanvas.add).not.toHaveBeenCalled();
    unmount();
  });
});
