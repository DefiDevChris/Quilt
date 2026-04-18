import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type React from 'react';

// Mock the canvasStore
const mockStore = {
  selectedObjectIds: [] as string[],
  zoom: 1,
  swapMode: false,
  fabricPickerTarget: null as 'selection' | 'background' | null,
  setSwapMode: vi.fn(),
  clearSwapMode: vi.fn(),
  setFabricPickerTarget: vi.fn(),
  pushUndoState: vi.fn(),
};

vi.mock('@/stores/canvasStore', () => ({
  useCanvasStore: (selector: (s: typeof mockStore) => unknown) => selector(mockStore),
}));

// Mock CanvasContext
const mockGetCanvas = vi.fn();

vi.mock('@/contexts/CanvasContext', () => ({
  useCanvasContext: () => ({
    getCanvas: mockGetCanvas,
  }),
}));

// Mock the selection-utils module
vi.mock('@/lib/selection-utils', () => ({
  getSelectionType: vi.fn(),
  getSelectionBounds: vi.fn(),
  isMultiSelection: vi.fn(),
}));

// Mock useSelectionActions
const mockActions = {
  rotate: vi.fn(),
  delete: vi.fn(),
  initiateSwap: vi.fn(),
  completeSwap: vi.fn(),
  cancelSwap: vi.fn(),
  openFabricPicker: vi.fn(),
  applyFabric: vi.fn(),
  getRecentFabrics: vi.fn(() => []),
};

vi.mock('@/hooks/useSelectionActions', () => ({
  useSelectionActions: () => mockActions,
}));

// Import after mocks
import { CanvasSelectionToolbar } from '@/components/canvas/CanvasSelectionToolbar';
import { getSelectionType } from '@/lib/selection-utils';

describe('CanvasSelectionToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.selectedObjectIds = [];
    mockStore.zoom = 1;
    mockStore.swapMode = false;
    mockStore.fabricPickerTarget = null;
    mockGetCanvas.mockReturnValue(null);
  });

  it('renders nothing when there is no selection', () => {
    vi.mocked(getSelectionType).mockReturnValue(null);
    mockStore.selectedObjectIds = [];

    const { container } = render(<CanvasSelectionToolbar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 5 buttons for block selection', () => {
    const mockCanvas = {
      getActiveObject: vi.fn(() => ({ __isBlockGroup: true, id: 'block-1' })),
      getActiveObjects: vi.fn(() => [{ __isBlockGroup: true }]),
      wrapperEl: { clientWidth: 800, clientHeight: 600 },
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };
    mockGetCanvas.mockReturnValue(mockCanvas);
    vi.mocked(getSelectionType).mockReturnValue('block');
    mockStore.selectedObjectIds = ['block-1'];

    render(<CanvasSelectionToolbar />);

    // Check for all 5 block buttons
    expect(screen.getByLabelText('Rotate 90°')).toBeTruthy();
    expect(screen.getByLabelText('Swap position')).toBeTruthy();
    expect(screen.getByLabelText('Apply fabric')).toBeTruthy();
    expect(screen.getByLabelText('Recolor patches by shade')).toBeTruthy();
    expect(screen.getByLabelText('Delete')).toBeTruthy();
  });

  it('renders 5 buttons for border selection', () => {
    const mockCanvas = {
      getActiveObject: vi.fn(() => ({ _fenceRole: 'border', id: 'border-1' })),
      getActiveObjects: vi.fn(() => [{ _fenceRole: 'border' }]),
      wrapperEl: { clientWidth: 800, clientHeight: 600 },
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };
    mockGetCanvas.mockReturnValue(mockCanvas);
    vi.mocked(getSelectionType).mockReturnValue('border');
    mockStore.selectedObjectIds = ['border-1'];

    render(<CanvasSelectionToolbar />);

    // Check for all 5 border buttons
    expect(screen.getByLabelText('Apply fabric')).toBeTruthy();
    expect(screen.getByLabelText('Decrease width')).toBeTruthy();
    expect(screen.getByLabelText('Increase width')).toBeTruthy();
    expect(screen.getByLabelText('Insert border')).toBeTruthy();
    expect(screen.getByLabelText('Remove border')).toBeTruthy();
  });

  it('renders 4 buttons for sashing selection', () => {
    const mockCanvas = {
      getActiveObject: vi.fn(() => ({ _fenceRole: 'sashing', id: 'sashing-1' })),
      getActiveObjects: vi.fn(() => [{ _fenceRole: 'sashing' }]),
      wrapperEl: { clientWidth: 800, clientHeight: 600 },
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };
    mockGetCanvas.mockReturnValue(mockCanvas);
    vi.mocked(getSelectionType).mockReturnValue('sashing');
    mockStore.selectedObjectIds = ['sashing-1'];

    render(<CanvasSelectionToolbar />);

    // Check for all 4 sashing buttons
    expect(screen.getByLabelText('Apply fabric')).toBeTruthy();
    expect(screen.getByLabelText('Decrease width')).toBeTruthy();
    expect(screen.getByLabelText('Increase width')).toBeTruthy();
    expect(screen.getByLabelText('Change color')).toBeTruthy();
  });

  it('renders 2 buttons for patch selection', () => {
    const mockCanvas = {
      getActiveObject: vi.fn(() => ({ __pieceRole: 'patch', id: 'patch-1' })),
      getActiveObjects: vi.fn(() => [{ __pieceRole: 'patch' }]),
      wrapperEl: { clientWidth: 800, clientHeight: 600 },
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };
    mockGetCanvas.mockReturnValue(mockCanvas);
    vi.mocked(getSelectionType).mockReturnValue('patch');
    mockStore.selectedObjectIds = ['patch-1'];

    render(<CanvasSelectionToolbar />);

    // Check for 2 patch buttons
    expect(screen.getByLabelText('Apply fabric')).toBeTruthy();
    expect(screen.getByLabelText('Change color')).toBeTruthy();
  });

  it('calls rotate action when rotate button is clicked', () => {
    const mockCanvas = {
      getActiveObject: vi.fn(() => ({ __isBlockGroup: true, id: 'block-1' })),
      getActiveObjects: vi.fn(() => [{ __isBlockGroup: true }]),
      wrapperEl: { clientWidth: 800, clientHeight: 600 },
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };
    mockGetCanvas.mockReturnValue(mockCanvas);
    vi.mocked(getSelectionType).mockReturnValue('block');
    mockStore.selectedObjectIds = ['block-1'];

    render(<CanvasSelectionToolbar />);

    fireEvent.click(screen.getByLabelText('Rotate 90°'));
    expect(mockActions.rotate).toHaveBeenCalled();
  });

  it('calls delete action when delete button is clicked', () => {
    const mockCanvas = {
      getActiveObject: vi.fn(() => ({ __isBlockGroup: true, id: 'block-1' })),
      getActiveObjects: vi.fn(() => [{ __isBlockGroup: true }]),
      wrapperEl: { clientWidth: 800, clientHeight: 600 },
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };
    mockGetCanvas.mockReturnValue(mockCanvas);
    vi.mocked(getSelectionType).mockReturnValue('block');
    mockStore.selectedObjectIds = ['block-1'];

    render(<CanvasSelectionToolbar />);

    fireEvent.click(screen.getByLabelText('Delete'));
    expect(mockActions.delete).toHaveBeenCalled();
  });

  it('calls initiateSwap when swap button is clicked', () => {
    const mockCanvas = {
      getActiveObject: vi.fn(() => ({ __isBlockGroup: true, id: 'block-1' })),
      getActiveObjects: vi.fn(() => [{ __isBlockGroup: true }]),
      wrapperEl: { clientWidth: 800, clientHeight: 600 },
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };
    mockGetCanvas.mockReturnValue(mockCanvas);
    vi.mocked(getSelectionType).mockReturnValue('block');
    mockStore.selectedObjectIds = ['block-1'];

    render(<CanvasSelectionToolbar />);

    fireEvent.click(screen.getByLabelText('Swap position'));
    expect(mockActions.initiateSwap).toHaveBeenCalled();
  });

  it('opens fabric picker when fabric button is clicked', () => {
    const mockCanvas = {
      getActiveObject: vi.fn(() => ({ __isBlockGroup: true, id: 'block-1' })),
      getActiveObjects: vi.fn(() => [{ __isBlockGroup: true }]),
      wrapperEl: { clientWidth: 800, clientHeight: 600 },
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };
    mockGetCanvas.mockReturnValue(mockCanvas);
    vi.mocked(getSelectionType).mockReturnValue('block');
    mockStore.selectedObjectIds = ['block-1'];

    render(<CanvasSelectionToolbar />);

    fireEvent.click(screen.getByLabelText('Apply fabric'));
    expect(mockActions.openFabricPicker).toHaveBeenCalled();
  });

  it('disables swap button when in swap mode', () => {
    const mockCanvas = {
      getActiveObject: vi.fn(() => ({ __isBlockGroup: true, id: 'block-1' })),
      getActiveObjects: vi.fn(() => [{ __isBlockGroup: true }]),
      wrapperEl: { clientWidth: 800, clientHeight: 600 },
      viewportTransform: [1, 0, 0, 1, 0, 0],
    };
    mockGetCanvas.mockReturnValue(mockCanvas);
    vi.mocked(getSelectionType).mockReturnValue('block');
    mockStore.selectedObjectIds = ['block-1'];
    mockStore.swapMode = true;

    render(<CanvasSelectionToolbar />);

    const swapButton = screen.getByLabelText('Tap another block to swap') as HTMLButtonElement;
    expect(swapButton.disabled).toBe(true);
  });
});
