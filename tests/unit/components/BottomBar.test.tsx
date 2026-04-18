import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BottomBar } from '@/components/studio/BottomBar';

vi.mock('@/stores/canvasStore', () => ({
  useCanvasStore: vi.fn((selector) => {
    if (selector.name === 'zoom') return 1;
    if (selector.name === 'setZoom') return vi.fn();
    if (selector.name === 'undoStack') return [];
    if (selector.name === 'redoStack') return [];
    if (selector.name === 'pushUndoState') return vi.fn();
    if (selector.name === 'redo') return vi.fn();
    if (selector.name === 'gridSettings') return { enabled: true, size: 1, snapToGrid: true, granularity: 'inch' };
    if (selector.name === 'setGridSettings') return vi.fn();
    if (selector.name === 'shadeViewActive') return false;
    if (selector.name === 'isViewportLocked') return false;
    if (selector.name === 'setViewportLocked') return vi.fn();
    return undefined;
  }),
}));

vi.mock('@/stores/layoutStore', () => ({
  useLayoutStore: vi.fn((selector) => {
    if (selector.name === 'hasAppliedLayout') return false;
    if (selector.name === 'layoutType') return 'none';
    if (selector.name === 'rows') return 4;
    if (selector.name === 'cols') return 4;
    if (selector.name === 'blockSize') return 12;
    return undefined;
  }),
}));

vi.mock('@/stores/projectStore', () => ({
  useProjectStore: vi.fn((selector) => {
    if (selector.name === 'mode') return 'free-form';
    if (selector.name === 'canvasWidth') return 60;
    if (selector.name === 'canvasHeight') return 60;
    return undefined;
  }),
}));

vi.mock('@/hooks/useShadeAssignment', () => ({
  useShadeAssignment: () => ({
    activateShadeView: vi.fn(),
    deactivateShadeView: vi.fn(),
  }),
}));

describe('BottomBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    expect(() => render(<BottomBar />)).not.toThrow();
  });

  it('renders zoom percentage display', () => {
    render(<BottomBar />);
    const zoomDisplay = screen.getAllByText((content) => content.includes('%'))[0];
    expect(zoomDisplay).toBeTruthy();
  });

  it('renders Fit button', () => {
    render(<BottomBar />);
    expect(screen.getByText('Fit')).toBeTruthy();
  });

  it('renders 100 button', () => {
    render(<BottomBar />);
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('renders grid toggle button', () => {
    render(<BottomBar />);
    const gridButton = screen.getByRole('button', { name: /toggle grid/i });
    expect(gridButton).toBeTruthy();
  });

  it('renders viewport lock button', () => {
    render(<BottomBar />);
    const lockButton = screen.getByRole('button', { name: /lock viewport/i });
    expect(lockButton).toBeTruthy();
  });

  it('renders undo button', () => {
    render(<BottomBar />);
    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toBeTruthy();
  });

  it('renders redo button', () => {
    render(<BottomBar />);
    const redoButton = screen.getByRole('button', { name: /redo/i });
    expect(redoButton).toBeTruthy();
  });
});