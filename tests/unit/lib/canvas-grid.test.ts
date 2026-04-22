import { renderGrid } from '@/lib/canvas-grid';

describe('renderGrid', () => {
  it('returns early when context is null', () => {
    const mockCanvas = {
      getContext: () => null,
      width: 100,
      height: 100,
    } as unknown as HTMLCanvasElement;
    const mockFabricCanvas = { getZoom: () => 1, viewportTransform: [1, 0, 0, 1, 0, 0] };
    expect(() => renderGrid(mockCanvas, mockFabricCanvas, {
      gridSettings: { enabled: true, size: 1 },
      mode: 'free-form',
      unitSystem: 'imperial',
      quiltWidth: 10,
      quiltHeight: 10,
    })).not.toThrow();
  });

  it('renders grid when size > 0', () => {
    let beginPathCalled = false;
    const mockCtx = {
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => { beginPathCalled = true; },
      stroke: () => {},
      fillText: () => {},
      save: () => {},
      restore: () => {},
      transform: () => {},
      translate: () => {},
      rotate: () => {},
      moveTo: () => {},
      lineTo: () => {},
    } as unknown as CanvasRenderingContext2D;
    const mockCanvas = {
      getContext: () => mockCtx,
      width: 100,
      height: 100,
    } as unknown as HTMLCanvasElement;
    const mockFabricCanvas = { getZoom: () => 1, viewportTransform: [1, 0, 0, 1, 0, 0] };
    renderGrid(mockCanvas, mockFabricCanvas, {
      gridSettings: { enabled: true, size: 1 },
      mode: 'free-form',
      unitSystem: 'imperial',
      quiltWidth: 10,
      quiltHeight: 10,
    });
    expect(beginPathCalled).toBe(true);
  });
});
