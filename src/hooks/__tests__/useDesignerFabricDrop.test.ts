// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDesignerFabricDrop } from '@/hooks/useDesignerFabricDrop';
import { useDesignerStore } from '@/stores/designerStore';
import * as dropHighlight from '@/lib/drop-highlight';
import { useCanvasContext } from '@/contexts/CanvasContext';

// Mock drop-highlight
vi.mock('@/lib/drop-highlight', () => ({
  showDropHighlight: vi.fn(async () => ({ id: 'highlight-rect' })),
  clearDropHighlight: vi.fn(),
}));

// Mock design-system
vi.mock('@/lib/design-system', () => ({
  CANVAS: {
    fabricHighlight: '#f9a06b',
  },
}));

// Mock fabric dynamic import
vi.mock('fabric', () => ({
  default: {
    Pattern: class Pattern {
      source: unknown;
      repeat: string;
      constructor(options: { source: unknown; repeat: string }) {
        this.source = options.source;
        this.repeat = options.repeat;
      }
    },
  },
}));

// Mock Image for pattern loading - auto-resolves
const createAutoMockImage = () => {
  return class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    _src = '';
    set src(val: string) {
      this._src = val;
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      queueMicrotask(() => self.onload?.());
    }
    get src() {
      return this._src;
    }
  };
};

vi.mock('@/contexts/CanvasContext', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let canvasInstance: any = null;
  return {
    useCanvasContext: () => ({
      getCanvas: () => {
        if (!canvasInstance) {
          canvasInstance = {
            findTarget: vi.fn(),
            set: vi.fn(),
            renderAll: vi.fn(),
            add: vi.fn(),
            remove: vi.fn(),
            requestRenderAll: vi.fn(),
          };
        }
        return canvasInstance;
      },
    }),
  };
});

// Helper to get the mock canvas from the context (must start with 'use' for eslint)
function useMockCanvas(): Record<string, ReturnType<typeof vi.fn>> {
  const canvas = useCanvasContext().getCanvas();
  return canvas as unknown as Record<string, ReturnType<typeof vi.fn>>;
}

describe('useDesignerFabricDrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDesignerStore.getState().reset();
    // Mock global Image with auto-resolve
    const MockImageClass = createAutoMockImage();
    (global as unknown as Record<string, unknown>).Image =
      MockImageClass as unknown as typeof Image;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hook return values', () => {
    it('returns handleFabricDragStart', () => {
      const { result } = renderHook(() => useDesignerFabricDrop());
      expect(result.current.handleFabricDragStart).toBeDefined();
      expect(typeof result.current.handleFabricDragStart).toBe('function');
    });

    it('returns handleFabricDragOver', () => {
      const { result } = renderHook(() => useDesignerFabricDrop());
      expect(result.current.handleFabricDragOver).toBeDefined();
      expect(typeof result.current.handleFabricDragOver).toBe('function');
    });

    it('returns handleFabricDrop', () => {
      const { result } = renderHook(() => useDesignerFabricDrop());
      expect(result.current.handleFabricDrop).toBeDefined();
      expect(typeof result.current.handleFabricDrop).toBe('function');
    });

    it('returns handleFabricDragLeave', () => {
      const { result } = renderHook(() => useDesignerFabricDrop());
      expect(result.current.handleFabricDragLeave).toBeDefined();
      expect(typeof result.current.handleFabricDragLeave).toBe('function');
    });
  });

  describe('handleFabricDragStart', () => {
    it('sets fabric id data transfer', () => {
      const { result } = renderHook(() => useDesignerFabricDrop());
      const mockEvent = {
        dataTransfer: { setData: vi.fn(), effectAllowed: '' },
      } as unknown as React.DragEvent;
      act(() => {
        result.current.handleFabricDragStart(mockEvent, 'test-fabric-id');
      });
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith(
        'application/quiltcorgi-fabric-id',
        'test-fabric-id'
      );
      expect(mockEvent.dataTransfer.effectAllowed).toBe('copy');
    });
  });

  describe('handleFabricDragOver', () => {
    const createDragOverEvent = (types: string[]) =>
      ({
        dataTransfer: {
          types,
          dropEffect: 'none',
        },
        nativeEvent: {},
        preventDefault: vi.fn(),
      }) as unknown as React.DragEvent;

    it('does nothing when no fabric data present', async () => {
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDragOverEvent(['text/plain']);
      await act(async () => {
        await result.current.handleFabricDragOver(event);
      });
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('accepts drag over when fabric-id data is present and target is sashing', async () => {
      const canvas = useMockCanvas();
      canvas.findTarget.mockReturnValue({
        _fenceElement: true,
        _fenceRole: 'sashing',
      });
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDragOverEvent(['application/quiltcorgi-fabric-id']);
      await act(async () => {
        await result.current.handleFabricDragOver(event);
      });
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.dataTransfer.dropEffect).toBe('copy');
    });

    it('accepts drag over when fabric-id data is present and target is border', async () => {
      const canvas = useMockCanvas();
      canvas.findTarget.mockReturnValue({
        _fenceElement: true,
        _fenceRole: 'border',
      });
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDragOverEvent(['application/quiltcorgi-fabric-id']);
      await act(async () => {
        await result.current.handleFabricDragOver(event);
      });
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.dataTransfer.dropEffect).toBe('copy');
    });

    it('rejects drag over when target is block-cell', async () => {
      const canvas = useMockCanvas();
      canvas.findTarget.mockReturnValue({
        _fenceElement: true,
        _fenceRole: 'block-cell',
      });
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDragOverEvent(['application/quiltcorgi-fabric-id']);
      await act(async () => {
        await result.current.handleFabricDragOver(event);
      });
      expect(event.dataTransfer.dropEffect).toBe('none');
    });

    it('accepts drag over for quick-apply hex colors', async () => {
      const canvas = useMockCanvas();
      canvas.findTarget.mockReturnValue({
        _fenceElement: true,
        _fenceRole: 'sashing',
      });
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDragOverEvent(['application/quiltcorgi-fabric-hex']);
      await act(async () => {
        await result.current.handleFabricDragOver(event);
      });
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.dataTransfer.dropEffect).toBe('copy');
    });

    it('rejects drag over when no target found', async () => {
      const canvas = useMockCanvas();
      canvas.findTarget.mockReturnValue(null);
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDragOverEvent(['application/quiltcorgi-fabric-id']);
      await act(async () => {
        await result.current.handleFabricDragOver(event);
      });
      expect(event.dataTransfer.dropEffect).toBe('none');
    });
  });

  describe('handleFabricDragLeave', () => {
    it('clears highlight on drag leave', () => {
      const { result } = renderHook(() => useDesignerFabricDrop());
      act(() => {
        result.current.handleFabricDragLeave();
      });
      expect(dropHighlight.clearDropHighlight).toHaveBeenCalled();
    });
  });

  describe('handleFabricDrop', () => {
    const createDropEvent = (data: Record<string, string>) => {
      const map = new Map(Object.entries(data));
      return {
        dataTransfer: {
          getData: vi.fn((key: string) => map.get(key) ?? ''),
          types: Array.from(map.keys()),
        },
        nativeEvent: {},
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent;
    };

    it('clears highlight when no fabric data', async () => {
      const canvas = useMockCanvas();
      canvas.findTarget.mockReturnValue(null);
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDropEvent({});
      await act(async () => {
        await result.current.handleFabricDrop(event);
      });
    });

    it('clears highlight when no target found', async () => {
      const canvas = useMockCanvas();
      canvas.findTarget.mockReturnValue(null);
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDropEvent({
        'application/quiltcorgi-fabric-id': 'f1',
        'application/quiltcorgi-fabric-url': 'https://example.com/fabric.jpg',
      });
      await act(async () => {
        await result.current.handleFabricDrop(event);
      });
    });

    it('rejects drop on non-allowed roles', async () => {
      const canvas = useMockCanvas();
      canvas.findTarget.mockReturnValue({
        _fenceElement: true,
        _fenceRole: 'block-cell',
      });
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDropEvent({
        'application/quiltcorgi-fabric-id': 'f1',
        'application/quiltcorgi-fabric-url': 'https://example.com/fabric.jpg',
      });
      await act(async () => {
        await result.current.handleFabricDrop(event);
      });
      expect(dropHighlight.clearDropHighlight).toHaveBeenCalled();
    });

    it('handles quick-apply hex drop on sashing', async () => {
      useDesignerStore.getState().setSashing(2);
      const canvas = useMockCanvas();
      const mockSet = vi.fn();
      canvas.findTarget.mockReturnValue({
        _fenceElement: true,
        _fenceRole: 'sashing',
        set: mockSet,
      });
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDropEvent({
        'application/quiltcorgi-fabric-hex': '#F5F0E8',
        'application/quiltcorgi-fabric-name': 'Cream',
      });
      await act(async () => {
        await result.current.handleFabricDrop(event);
      });
      expect(mockSet).toHaveBeenCalledWith('fill', '#F5F0E8');
      expect(useDesignerStore.getState().sashingFabricId).toBe('Cream');
    });

    it('handles quick-apply hex drop on border', async () => {
      useDesignerStore.getState().setBorders([{ width: 2, fabricId: null, fabricUrl: null }]);
      const canvas = useMockCanvas();
      const mockSet = vi.fn();
      canvas.findTarget.mockReturnValue({
        _fenceElement: true,
        _fenceRole: 'border',
        _fenceBorderIndex: 0,
        set: mockSet,
      });
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDropEvent({
        'application/quiltcorgi-fabric-hex': '#333333',
        'application/quiltcorgi-fabric-name': 'Black',
      });
      await act(async () => {
        await result.current.handleFabricDrop(event);
      });
      expect(mockSet).toHaveBeenCalledWith('fill', '#333333');
      expect(useDesignerStore.getState().borders[0].fabricId).toBe('Black');
    });

    it('handles library fabric drop on sashing', async () => {
      useDesignerStore.getState().setSashing(2);
      const canvas = useMockCanvas();
      canvas.findTarget.mockReturnValue({
        _fenceElement: true,
        _fenceRole: 'sashing',
        set: vi.fn(),
      });
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDropEvent({
        'application/quiltcorgi-fabric-id': 'lib-fabric-1',
        'application/quiltcorgi-fabric-url': 'https://example.com/fabric.jpg',
        'application/quiltcorgi-fabric-name': 'Library Fabric',
      });
      await act(async () => {
        await result.current.handleFabricDrop(event);
      });
      // Verify store was updated (the Pattern application is Fabric.js internals)
      expect(useDesignerStore.getState().sashingFabricId).toBe('lib-fabric-1');
      expect(useDesignerStore.getState().sashingFabricUrl).toBe('https://example.com/fabric.jpg');
    });

    it('handles library fabric drop on border', async () => {
      useDesignerStore.getState().setBorders([{ width: 2, fabricId: null, fabricUrl: null }]);
      const canvas = useMockCanvas();
      canvas.findTarget.mockReturnValue({
        _fenceElement: true,
        _fenceRole: 'border',
        _fenceBorderIndex: 0,
        set: vi.fn(),
      });
      const { result } = renderHook(() => useDesignerFabricDrop());
      const event = createDropEvent({
        'application/quiltcorgi-fabric-id': 'lib-border-fabric',
        'application/quiltcorgi-fabric-url': 'https://example.com/border.jpg',
      });
      await act(async () => {
        await result.current.handleFabricDrop(event);
      });
      expect(useDesignerStore.getState().borders[0].fabricId).toBe('lib-border-fabric');
      expect(useDesignerStore.getState().borders[0].fabricUrl).toBe(
        'https://example.com/border.jpg'
      );
    });
  });
});
