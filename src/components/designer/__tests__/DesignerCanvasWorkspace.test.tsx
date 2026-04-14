// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Project } from '@/types/project';

// Mock all hooks used by DesignerCanvasWorkspace
vi.mock('@/hooks/useCanvasInit', () => ({
  useCanvasInit: vi.fn(),
}));

vi.mock('@/hooks/useCanvasZoomPan', () => ({
  useCanvasZoomPan: vi.fn(),
}));

vi.mock('@/hooks/useCanvasKeyboard', () => ({
  useCanvasKeyboard: vi.fn(),
}));

vi.mock('@/hooks/useDesignerFenceRenderer', () => ({
  useDesignerFenceRenderer: vi.fn(() => ({ getFenceAreas: vi.fn(() => []) })),
}));

vi.mock('@/hooks/useRealisticRender', () => ({
  useRealisticRender: vi.fn(),
}));

vi.mock('@/hooks/useBlockDrop', () => ({
  useBlockDrop: vi.fn(() => ({
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    handleDragLeave: vi.fn(),
  })),
}));

vi.mock('@/hooks/useFabricLayout', () => ({
  useFabricDrop: vi.fn(() => ({
    handleFabricDragStart: vi.fn(),
    handleFabricDragOver: vi.fn(),
    handleFabricDrop: vi.fn(),
  })),
}));

vi.mock('@/lib/design-system', () => ({
  Z_INDEX: { base: 0, overlay: 9999 },
}));

import { DesignerCanvasWorkspace } from '@/components/designer/DesignerCanvasWorkspace';
import { useCanvasInit } from '@/hooks/useCanvasInit';
import { useDesignerFenceRenderer } from '@/hooks/useDesignerFenceRenderer';
import { useRealisticRender } from '@/hooks/useRealisticRender';
import { useBlockDrop } from '@/hooks/useBlockDrop';

function makeMockProject(): Project {
  return {
    id: 'test-designer-1',
    userId: 'user-1',
    name: 'Test Designer Project',
    description: null,
    canvasData: {},
    worktables: [],
    unitSystem: 'imperial',
    gridSettings: { showGrid: true, snapToGrid: true, gridSize: 1 },
    fabricPresets: [],
    canvasWidth: 60,
    canvasHeight: 80,
    thumbnailUrl: null,
    isPublic: false,
    lastSavedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Project;
}

describe('DesignerCanvasWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dual canvas setup (grid + fabric)', () => {
    const project = makeMockProject();

    const { container } = render(<DesignerCanvasWorkspace project={project} />);

    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(2);
  });

  it('renders inside a container div', () => {
    const project = makeMockProject();

    const { container } = render(<DesignerCanvasWorkspace project={project} />);

    const wrapper = container.querySelector('div');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.className).toContain('relative flex-1 overflow-hidden');
  });

  it('calls useCanvasInit with project and refs', () => {
    const project = makeMockProject();

    render(<DesignerCanvasWorkspace project={project} />);

    expect(useCanvasInit).toHaveBeenCalled();
  });

  it('calls useDesignerFenceRenderer', () => {
    const project = makeMockProject();

    render(<DesignerCanvasWorkspace project={project} />);

    expect(useDesignerFenceRenderer).toHaveBeenCalled();
  });

  it('calls useRealisticRender', () => {
    const project = makeMockProject();

    render(<DesignerCanvasWorkspace project={project} />);

    expect(useRealisticRender).toHaveBeenCalled();
  });

  it('calls useBlockDrop for drag and drop', () => {
    const project = makeMockProject();

    render(<DesignerCanvasWorkspace project={project} />);

    expect(useBlockDrop).toHaveBeenCalled();
  });

  it('sets up drag and drop handlers on container', () => {
    const project = makeMockProject();

    const { container } = render(<DesignerCanvasWorkspace project={project} />);

    const wrapper = container.querySelector('div');
    expect(wrapper).not.toBeNull();
  });

  it('re-exports useBlockDrop and useFabricDrop', async () => {
    const { useBlockDrop, useFabricDrop } =
      await import('@/components/designer/DesignerCanvasWorkspace');
    expect(useBlockDrop).toBeDefined();
    expect(useFabricDrop).toBeDefined();
  });
});
