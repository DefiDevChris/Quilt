/**
 * useBendTool Hook Tests
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBendTool, makeSegmentStraight } from '@/hooks/useBendTool';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import type { BentSegment } from '@/lib/easydraw-engine';

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

const mockGetCanvas = vi.fn(() => mockCanvas);

vi.mock('@/contexts/CanvasContext', () => ({
  useCanvasContext: () => ({
    getCanvas: mockGetCanvas,
  }),
}));

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

describe('useBendTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCanvasStore.setState({
      activeTool: 'bend',
      gridSettings: { enabled: true, size: 1, snapToGrid: true, granularity: 'inch' },
      zoom: 1,
      strokeColor: '#000',
      strokeWidth: 2,
    });
    useProjectStore.setState({
      mode: 'free-form',
    });
  });

  it('should not initialize when tool is not bend', () => {
    useCanvasStore.setState({ activeTool: 'select' });

    renderHook(() => useBendTool());

    expect(mockCanvas.on).not.toHaveBeenCalled();
  });

  it('should not initialize in layout mode', () => {
    useProjectStore.setState({ mode: 'layout' });

    renderHook(() => useBendTool());

    expect(mockCanvas.on).not.toHaveBeenCalled();
  });

  it('should set up canvas event handlers when bend is active in free-form mode', () => {
    renderHook(() => useBendTool());

    expect(mockCanvas.selection).toBe(false);
    expect(mockCanvas.on).toHaveBeenCalledWith('mouse:down', expect.any(Function));
    expect(mockCanvas.on).toHaveBeenCalledWith('mouse:move', expect.any(Function));
    expect(mockCanvas.on).toHaveBeenCalledWith('mouse:up', expect.any(Function));
  });

  it('should cleanup event handlers on unmount', () => {
    const { unmount } = renderHook(() => useBendTool());

    unmount();

    expect(mockCanvas.off).toHaveBeenCalledWith('mouse:down', expect.any(Function));
    expect(mockCanvas.off).toHaveBeenCalledWith('mouse:move', expect.any(Function));
    expect(mockCanvas.off).toHaveBeenCalledWith('mouse:up', expect.any(Function));
  });
});

describe('makeSegmentStraight', () => {
  it('should convert bent segment to straight', () => {
    const bentSegment: BentSegment = {
      type: 'bent',
      a: { x: 0, y: 0 },
      b: { x: 100, y: 0 },
      t: 0.5,
      p2: { x: 50, y: 50 },
      controlPoint: { x: 50, y: 100 },
    };

    const mockPath = {
      set: vi.fn(),
      setCoords: vi.fn(),
      canvas: { renderAll: vi.fn() },
    };

    const mockCanvas = {};

    makeSegmentStraight(mockPath, mockCanvas, bentSegment);

    expect(mockPath.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining('M 0 0 L 100 0'),
      })
    );
    expect(mockPath.setCoords).toHaveBeenCalled();
    expect(mockPath.canvas?.renderAll).toHaveBeenCalled();
  });

  it('should do nothing if segment is not bent', () => {
    const straightSegment = {
      type: 'straight' as const,
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
    };

    const mockPath = {
      set: vi.fn(),
    };

    makeSegmentStraight(mockPath, {}, straightSegment as never);

    expect(mockPath.set).not.toHaveBeenCalled();
  });
});
