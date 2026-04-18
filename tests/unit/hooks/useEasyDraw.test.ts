/**
 * useEasyDraw Hook Tests
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEasyDraw } from '@/hooks/useEasyDraw';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

// Mock the canvas context
const mockCanvas = {
  on: vi.fn(),
  off: vi.fn(),
  getObjects: vi.fn(() => []),
  getScenePoint: vi.fn((e: MouseEvent) => ({ x: e.clientX, y: e.clientY })),
  add: vi.fn(),
  remove: vi.fn(),
  renderAll: vi.fn(),
  setActiveObject: vi.fn(),
  discardActiveObject: vi.fn(),
  toJSON: vi.fn(() => ({})),
  selection: true,
  defaultCursor: 'default',
  wrapperEl: document.createElement('div'),
};

const mockGetCanvas = vi.fn(() => mockCanvas);

vi.mock('@/contexts/CanvasContext', () => ({
  useCanvasContext: () => ({
    getCanvas: mockGetCanvas,
  }),
}));

vi.mock('fabric', () => ({
  Line: vi.fn(function (coords: number[], options: object) {
    return {
      coords,
      ...options,
      set: vi.fn(),
      setCoords: vi.fn(),
    };
  }),
  Circle: vi.fn(function (options: object) {
    return {
      ...options,
      set: vi.fn(),
      setCoords: vi.fn(),
    };
  }),
  Path: vi.fn(function (pathData: string, options: object) {
    return {
      pathData,
      ...options,
      set: vi.fn(),
      setCoords: vi.fn(),
    };
  }),
}));

describe('useEasyDraw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores
    useCanvasStore.setState({
      activeTool: 'easydraw',
      gridSettings: { enabled: true, size: 1, snapToGrid: true, granularity: 'inch' },
      zoom: 1,
      strokeColor: '#000',
      strokeWidth: 2,
    });
    useProjectStore.setState({
      mode: 'free-form',
    });
  });

  it('should not initialize when tool is not easydraw', () => {
    useCanvasStore.setState({ activeTool: 'select' });

    renderHook(() => useEasyDraw());

    expect(mockCanvas.on).not.toHaveBeenCalled();
  });

  it('should not initialize in layout mode', () => {
    useProjectStore.setState({ mode: 'layout' });

    renderHook(() => useEasyDraw());

    expect(mockCanvas.on).not.toHaveBeenCalled();
  });

  it('should set up canvas event handlers when easydraw is active', async () => {
    renderHook(() => useEasyDraw());

    await waitFor(() => {
      expect(mockCanvas.selection).toBe(false);
      expect(mockCanvas.on).toHaveBeenCalledWith('mouse:down', expect.any(Function));
      expect(mockCanvas.on).toHaveBeenCalledWith('mouse:move', expect.any(Function));
    });
  });

  it('should cleanup event handlers on unmount', async () => {
    const { unmount } = renderHook(() => useEasyDraw());

    await waitFor(() => {
      expect(mockCanvas.selection).toBe(false);
    });

    unmount();

    expect(mockCanvas.off).toHaveBeenCalledWith('mouse:down', expect.any(Function));
    expect(mockCanvas.off).toHaveBeenCalledWith('mouse:move', expect.any(Function));
    expect(mockCanvas.selection).toBe(true);
  });
});
