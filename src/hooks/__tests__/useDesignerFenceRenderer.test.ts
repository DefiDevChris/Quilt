// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { FenceArea } from '@/types/fence';

// Mock fabric module
vi.mock('fabric', async () => {
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class MockRect {
    opts: Record<string, unknown>;
    constructor(opts: Record<string, unknown>) {
      this.opts = opts;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class MockText {
    opts: Record<string, unknown>;
    constructor(_text: string, opts: Record<string, unknown>) {
      this.opts = opts;
    }
  }
  return {
    Rect: MockRect,
    FabricText: MockText,
  };
});

// Mock canvasStore
vi.mock('@/stores/canvasStore', () => ({
  useCanvasStore: {
    getState: vi.fn(() => ({
      canvasWidth: 60,
      canvasHeight: 80,
      unitSystem: 'imperial' as const,
    })),
  },
}));

// Mock designerStore
vi.mock('@/stores/designerStore', () => {
  const mockState = {
    rows: 3,
    cols: 3,
    blockSize: 12,
    sashingWidth: 2,
    borders: [],
  };
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
  sendObjectToBack: vi.fn(),
  requestRenderAll: vi.fn(),
  bringObjectToFront: vi.fn(),
};

vi.mock('@/contexts/CanvasContext', () => ({
  useCanvasContext: vi.fn(() => ({
    canvasRef: { current: null },
    getCanvas: vi.fn(() => mockCanvas),
    setCanvas: vi.fn(),
  })),
}));

// Mock canvas-utils
vi.mock('@/lib/canvas-utils', () => ({
  getPixelsPerUnit: vi.fn(() => 96),
}));

// Mock designer-fence-engine
vi.mock('@/lib/designer-fence-engine', () => ({
  computeDesignerFenceAreas: vi.fn((): FenceArea[] => [
    { id: 'cell-0-0', role: 'block-cell', x: 0, y: 0, width: 100, height: 100, label: 'Block' },
  ]),
}));

// Mock design-system
vi.mock('@/lib/design-system', () => ({
  FENCE: {
    normal: {
      fills: { 'block-cell': '#e8e8e8', sashing: '#d0d0d0', border: '#b0b0b0' },
      strokes: { 'block-cell': '#999999', sashing: '#888888', border: '#777777' },
    },
  },
  CANVAS: { gridLine: '#E5E2DD', fenceLabelBg: '#666666' },
}));

import { useDesignerFenceRenderer } from '@/hooks/useDesignerFenceRenderer';
import { useCanvasContext } from '@/contexts/CanvasContext';

describe('useDesignerFenceRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns getFenceAreas function', () => {
    const { result } = renderHook(() => useDesignerFenceRenderer());
    expect(result.current.getFenceAreas).toBeDefined();
    expect(typeof result.current.getFenceAreas).toBe('function');
  });

  it('does nothing when canvas is not available', () => {
    vi.mocked(useCanvasContext).mockReturnValueOnce({
      canvasRef: { current: null },
      getCanvas: vi.fn(() => null),
      setCanvas: vi.fn(),
    });

    const { result } = renderHook(() => useDesignerFenceRenderer());
    expect(result.current.getFenceAreas).toBeDefined();
  });
});
