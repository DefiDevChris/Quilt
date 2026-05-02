import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { useCanvasStore } from '@/stores/canvasStore';

// Mock the required dependencies
vi.mock('@/stores/canvasStore', () => ({
  useCanvasStore: vi.fn((selector) =>
    selector({
      pushUndoState: vi.fn(() => true),
      setActiveTool: vi.fn(),
      fabricCanvas: {},
    } as any)
  ),
}));

vi.mock('@/stores/projectStore', () => {
  const useProjectStoreMock = vi.fn();
  (useProjectStoreMock as any).getState = vi.fn(() => ({
    mode: 'free-form',
    canvasWidth: 48,
    canvasHeight: 48,
  }));
  (useProjectStoreMock as any).setHasContent = vi.fn();
  return { useProjectStore: useProjectStoreMock };
});

vi.mock('@/stores/layoutStore', () => ({
  useLayoutStore: vi.fn(() => ({
    getState: vi.fn(() => ({
      blockSize: 12,
    })),
  })),
}));

vi.mock('@/lib/block-drop-scale', () => ({
  computeBlockDropScale: vi.fn(() => 1),
}));

vi.mock('@/lib/canvas-utils', () => ({
  getPixelsPerUnit: vi.fn(() => 96),
}));

vi.mock('@/lib/fence-engine', () => ({
  findFenceAreaAtPoint: vi.fn(() => null),
  getComputedLayoutAreas: vi.fn(() => []),
  layoutSourceToTemplate: vi.fn(() => null),
}));

vi.mock('@/lib/drop-highlight', () => ({
  showDropHighlight: vi.fn(() => ({})),
  clearDropHighlight: vi.fn(),
}));

describe('useBlockDrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mode-based branch selection', () => {
    it('should handle free-form mode block drops', async () => {
      const mockCanvas = {
        getScenePoint: vi.fn(() => ({ x: 100, y: 100 })),
        getObjects: vi.fn(() => []),
        add: vi.fn(),
        setActiveObject: vi.fn(),
        toJSON: vi.fn(() => ({})),
      };

      vi.mocked(useCanvasStore).mockImplementation((selector) =>
        selector({
          pushUndoState: vi.fn(() => true),
          setActiveTool: vi.fn(),
          fabricCanvas: mockCanvas,
        } as any)
      );

      // Mock fetch for block data
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { fabricJsData: { objects: [] } } }),
        })
      ) as any;

      // Mock import('fabric')
      vi.doMock('fabric', () => ({
        Group: vi.fn(() => ({
          set: vi.fn(),
          left: 0,
          top: 0,
        })),
        default: {},
      }));

      const { result } = renderHook(() => useBlockDrop());

      // Simulate drag over
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: '',
        },
        currentTarget: { closest: vi.fn(() => null) },
      };

      await result.current.handleDragOver(mockEvent as any);
      expect(mockEvent.dataTransfer.dropEffect).toBe('copy');
    });
  });
});
