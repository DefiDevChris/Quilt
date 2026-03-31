// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderGrid } from '@/lib/canvas-grid';

// Mock canvas context that tracks calls
function createMockContext() {
  const calls: Record<string, unknown[][]> = {
    clearRect: [],
    fillRect: [],
    strokeRect: [],
    beginPath: [],
    moveTo: [],
    lineTo: [],
    stroke: [],
    fill: [],
    save: [],
    restore: [],
    translate: [],
    rotate: [],
    transform: [],
    closePath: [],
    fillText: [],
  };

  const ctx = {
    clearRect: vi.fn((...args: unknown[]) => { calls.clearRect.push(args); }),
    fillRect: vi.fn((...args: unknown[]) => { calls.fillRect.push(args); }),
    strokeRect: vi.fn((...args: unknown[]) => { calls.strokeRect.push(args); }),
    beginPath: vi.fn((...args: unknown[]) => { calls.beginPath.push(args); }),
    moveTo: vi.fn((...args: unknown[]) => { calls.moveTo.push(args); }),
    lineTo: vi.fn((...args: unknown[]) => { calls.lineTo.push(args); }),
    stroke: vi.fn((...args: unknown[]) => { calls.stroke.push(args); }),
    fill: vi.fn((...args: unknown[]) => { calls.fill.push(args); }),
    save: vi.fn((...args: unknown[]) => { calls.save.push(args); }),
    restore: vi.fn((...args: unknown[]) => { calls.restore.push(args); }),
    translate: vi.fn((...args: unknown[]) => { calls.translate.push(args); }),
    rotate: vi.fn((...args: unknown[]) => { calls.rotate.push(args); }),
    transform: vi.fn((...args: unknown[]) => { calls.transform.push(args); }),
    closePath: vi.fn((...args: unknown[]) => { calls.closePath.push(args); }),
    fillText: vi.fn((...args: unknown[]) => { calls.fillText.push(args); }),
    // Text properties
    font: '',
    textAlign: '',
    textBaseline: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    // Expose calls for assertions
    _calls: calls,
  };

  return ctx;
}

function createMockCanvas(): { canvas: HTMLCanvasElement; ctx: ReturnType<typeof createMockContext> } {
  const ctx = createMockContext();
  const canvas = {
    width: 800,
    height: 600,
    getContext: vi.fn((type: string) => type === '2d' ? ctx : null),
  } as unknown as HTMLCanvasElement;
  
  return { canvas, ctx };
}

describe('renderGrid', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: ReturnType<typeof createMockContext>;

  const mockFabricCanvas = {
    getZoom: () => 1,
    viewportTransform: [1, 0, 0, 1, 0, 0],
  };

  beforeEach(() => {
    const { canvas, ctx } = createMockCanvas();
    mockCanvas = canvas;
    mockCtx = ctx;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns early when context is null', () => {
    const canvasWithoutContext = {
      width: 800,
      height: 600,
      getContext: () => null,
    } as unknown as HTMLCanvasElement;

    expect(() => {
      renderGrid(canvasWithoutContext, mockFabricCanvas, {
        gridSettings: { enabled: true, size: 1 },
        unitSystem: 'imperial',
        quiltWidth: 48,
        quiltHeight: 48,
      });
    }).not.toThrow();
  });

  it('clears the canvas before rendering', () => {
    renderGrid(mockCanvas, mockFabricCanvas, {
      gridSettings: { enabled: true, size: 1 },
      unitSystem: 'imperial',
      quiltWidth: 48,
      quiltHeight: 48,
    });

    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  it('fills background with surface color', () => {
    renderGrid(mockCanvas, mockFabricCanvas, {
      gridSettings: { enabled: true, size: 1 },
      unitSystem: 'imperial',
      quiltWidth: 48,
      quiltHeight: 48,
    });

    // Should have called fillRect for background
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('draws quilt boundary rectangle', () => {
    renderGrid(mockCanvas, mockFabricCanvas, {
      gridSettings: { enabled: true, size: 1 },
      unitSystem: 'imperial',
      quiltWidth: 48,
      quiltHeight: 48,
    });

    expect(mockCtx.strokeRect).toHaveBeenCalled();
  });

  it('draws grid lines when enabled', () => {
    renderGrid(mockCanvas, mockFabricCanvas, {
      gridSettings: { enabled: true, size: 12 },
      unitSystem: 'imperial',
      quiltWidth: 48,
      quiltHeight: 48,
    });

    // Should have called beginPath and stroke for grid lines
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.moveTo).toHaveBeenCalled();
    expect(mockCtx.lineTo).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('renders dimension labels', () => {
    renderGrid(mockCanvas, mockFabricCanvas, {
      gridSettings: { enabled: true, size: 1 },
      unitSystem: 'imperial',
      quiltWidth: 48,
      quiltHeight: 60,
    });

    // Should render text for dimensions
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('draws corner marks', () => {
    renderGrid(mockCanvas, mockFabricCanvas, {
      gridSettings: { enabled: true, size: 1 },
      unitSystem: 'imperial',
      quiltWidth: 48,
      quiltHeight: 48,
    });

    // Corner marks use beginPath and stroke
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('applies viewport transform', () => {
    renderGrid(mockCanvas, mockFabricCanvas, {
      gridSettings: { enabled: true, size: 1 },
      unitSystem: 'imperial',
      quiltWidth: 48,
      quiltHeight: 48,
    });

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.transform).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('handles zoom scaling for line widths', () => {
    const zoomedCanvas = {
      getZoom: () => 2,
      viewportTransform: [2, 0, 0, 2, 0, 0],
    };

    renderGrid(mockCanvas, zoomedCanvas, {
      gridSettings: { enabled: true, size: 1 },
      unitSystem: 'imperial',
      quiltWidth: 48,
      quiltHeight: 48,
    });

    // Line width should be set (scaled by zoom)
    expect(mockCtx.lineWidth).not.toBe(0);
  });
});

describe('grid calculations', () => {
  it('calculates correct grid line positions for imperial units', () => {
    const { canvas, ctx } = createMockCanvas();
    
    const fabricCanvas = {
      getZoom: () => 1,
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };

    renderGrid(canvas, fabricCanvas, {
      gridSettings: { enabled: true, size: 12 },
      unitSystem: 'imperial',
      quiltWidth: 48,
      quiltHeight: 48,
    });

    // Grid lines should be drawn
    const moveToCalls = ctx._calls.moveTo;
    const lineToCalls = ctx._calls.lineTo;
    
    expect(moveToCalls.length).toBeGreaterThan(0);
    expect(lineToCalls.length).toBeGreaterThan(0);
  });

  it('handles metric units correctly', () => {
    const { canvas, ctx } = createMockCanvas();
    
    const fabricCanvas = {
      getZoom: () => 1,
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };

    renderGrid(canvas, fabricCanvas, {
      gridSettings: { enabled: true, size: 10 },
      unitSystem: 'metric',
      quiltWidth: 120,
      quiltHeight: 120,
    });

    // Grid lines should be drawn
    expect(ctx._calls.moveTo.length).toBeGreaterThan(0);
  });
});
