/**
 * useQuiltBendTool Hook Tests
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuiltBendTool } from '@/hooks/useQuiltBendTool';
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
  toJSON: vi.fn(() => ({})),
  selection: true,
  defaultCursor: 'default',
  wrapperEl: document.createElement('div'),
};


vi.mock('fabric', () => ({
  Path: vi.fn(function (pathData: string, options: object) {
    return {
      pathData,
      path: pathData.split(' ').map((part, i) => {
        if (i === 0) return ['M', 0, 0];
        if (part === 'Q') return ['Q', 50, 50, 100, 0];
        return part;
      }),
      ...options,
      set: vi.fn(),
      setCoords: vi.fn(),
    };
  }),
  util: {
    invertTransform: vi.fn(() => [1, 0, 0, 1, 0, 0]),
  },
}));

describe('useQuiltBendTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCanvasStore.setState({
      activeTool: 'bend',
      gridSettings: { enabled: true, size: 1, snapToGrid: true, granularity: 'inch' },
      zoom: 1,
      strokeColor: '#000',
      strokeWidth: 2,
      fabricCanvas: mockCanvas,
    });
    useProjectStore.setState({
      mode: 'free-form',
    });
  });

  it('should not initialize when tool is not bend', () => {
    useCanvasStore.setState({ activeTool: 'select' });

    renderHook(() => useQuiltBendTool());

    expect(mockCanvas.on).not.toHaveBeenCalled();
  });

  it('should not initialize in layout mode', () => {
    useProjectStore.setState({ mode: 'layout' });

    renderHook(() => useQuiltBendTool());

    expect(mockCanvas.on).not.toHaveBeenCalled();
  });

  it('should set up canvas event handlers when bend is active in free-form mode', async () => {
    renderHook(() => useQuiltBendTool());

    await waitFor(() => {
      expect(mockCanvas.selection).toBe(false);
      expect(mockCanvas.on).toHaveBeenCalledWith('mouse:down', expect.any(Function));
      expect(mockCanvas.on).toHaveBeenCalledWith('mouse:move', expect.any(Function));
      expect(mockCanvas.on).toHaveBeenCalledWith('mouse:up', expect.any(Function));
    });
  });

  it('should cleanup event handlers on unmount', async () => {
    const { unmount } = renderHook(() => useQuiltBendTool());

    await waitFor(() => {
      expect(mockCanvas.selection).toBe(false);
    });

    unmount();

    expect(mockCanvas.off).toHaveBeenCalledWith('mouse:down', expect.any(Function));
    expect(mockCanvas.off).toHaveBeenCalledWith('mouse:move', expect.any(Function));
    expect(mockCanvas.off).toHaveBeenCalledWith('mouse:up', expect.any(Function));
  });
});
