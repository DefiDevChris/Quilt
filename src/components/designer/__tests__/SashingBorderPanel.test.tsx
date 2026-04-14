// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SashingBorderPanel } from '@/components/designer/SashingBorderPanel';
import { useDesignerStore } from '@/stores/designerStore';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
}));

describe('SashingBorderPanel', () => {
  beforeEach(() => {
    useDesignerStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders the Sashing section header', () => {
      render(<SashingBorderPanel />);
      expect(screen.getByText('Sashing')).toBeDefined();
    });

    it('renders the Borders section header', () => {
      render(<SashingBorderPanel />);
      expect(screen.getByText('Borders')).toBeDefined();
    });

    it('renders a width input for sashing', () => {
      render(<SashingBorderPanel />);
      const input = screen.getByLabelText('Width (inches)');
      expect(input).toBeDefined();
      expect((input as HTMLInputElement).value).toBe('0');
    });

    it('renders 6 quick-apply swatches', () => {
      render(<SashingBorderPanel />);
      const swatches = screen.getAllByRole('button');
      const quickApplyButtons = swatches.filter((btn) => {
        const title = btn.getAttribute('title');
        return title !== null && title.length > 0;
      });
      // At least 6 quick-apply buttons + add button
      expect(quickApplyButtons.length).toBeGreaterThanOrEqual(6);
    });

    it('renders a fabric drop zone for sashing', () => {
      render(<SashingBorderPanel />);
      expect(screen.getByText('Drop fabric here')).toBeDefined();
    });

    it('renders empty state when no borders exist', () => {
      render(<SashingBorderPanel />);
      expect(screen.getByText('No borders yet. Click "Add" to add a border.')).toBeDefined();
    });

    it('renders the Add button for borders', () => {
      render(<SashingBorderPanel />);
      expect(screen.getByRole('button', { name: /Add/i })).toBeDefined();
    });
  });

  describe('sashing width interaction', () => {
    it('updates sashing width when input changes', () => {
      render(<SashingBorderPanel />);
      const input = screen.getAllByRole('spinbutton')[0] as HTMLInputElement;
      fireEvent.change(input, { target: { value: '3' } });
      expect(useDesignerStore.getState().sashingWidth).toBe(3);
    });

    it('reflects store value in local state', () => {
      useDesignerStore.getState().setSashing(2.5);
      render(<SashingBorderPanel />);
      const input = screen.getAllByRole('spinbutton')[0] as HTMLInputElement;
      expect(input.value).toBe('2.5');
    });
  });

  describe('quick-apply swatches', () => {
    it('sets fabricId on quick-apply click', () => {
      render(<SashingBorderPanel />);
      const whiteSwatch = screen.getByTitle('White');
      fireEvent.click(whiteSwatch);
      expect(useDesignerStore.getState().sashingFabricId).toBe('qa-white');
    });

    it('highlights the active quick-apply swatch', () => {
      useDesignerStore.getState().setSashing(0, 'qa-cream');
      render(<SashingBorderPanel />);
      const creamSwatch = screen.getByTitle('Cream');
      // The inner div with the color should have the primary border
      const innerDiv = creamSwatch.querySelector('div');
      expect(innerDiv?.className).toContain('border-[var(--color-primary)]');
    });
  });

  describe('border management', () => {
    it('adds a border when Add button is clicked', () => {
      render(<SashingBorderPanel />);
      const addBtn = screen.getByRole('button', { name: /Add/i });
      fireEvent.click(addBtn);
      expect(useDesignerStore.getState().borders).toHaveLength(1);
    });

    it('adds up to 3 borders maximum', () => {
      render(<SashingBorderPanel />);
      const addBtn = screen.getByRole('button', { name: /Add/i });
      fireEvent.click(addBtn);
      fireEvent.click(addBtn);
      fireEvent.click(addBtn);
      expect(useDesignerStore.getState().borders).toHaveLength(3);
      // Fourth click should not add more
      fireEvent.click(addBtn);
      expect(useDesignerStore.getState().borders).toHaveLength(3);
    });

    it('disables Add button at max borders', () => {
      useDesignerStore.getState().setBorders([
        { width: 2, fabricId: null, fabricUrl: null },
        { width: 2, fabricId: null, fabricUrl: null },
        { width: 2, fabricId: null, fabricUrl: null },
      ]);
      render(<SashingBorderPanel />);
      const addBtn = screen.getByRole('button', { name: /Add/i }) as HTMLButtonElement;
      expect(addBtn.disabled).toBe(true);
    });

    it('removes a border when X button is clicked', () => {
      useDesignerStore.getState().setBorders([
        { width: 2, fabricId: null, fabricUrl: null },
        { width: 3, fabricId: null, fabricUrl: null },
      ]);
      render(<SashingBorderPanel />);
      const removeBtns = screen.getAllByTestId('x-icon');
      fireEvent.click(removeBtns[0]);
      expect(useDesignerStore.getState().borders).toHaveLength(1);
    });

    it('renders border labels correctly', () => {
      useDesignerStore.getState().setBorders([{ width: 2, fabricId: null, fabricUrl: null }]);
      render(<SashingBorderPanel />);
      expect(screen.getByText('Border 1')).toBeDefined();
    });
  });

  describe('border width input', () => {
    it('updates border width when changed', () => {
      useDesignerStore.getState().setBorders([{ width: 2, fabricId: null, fabricUrl: null }]);
      render(<SashingBorderPanel />);
      const spinButtons = screen.getAllByRole('spinbutton');
      // First spinbutton is sashing, second is border
      const borderWidthInput = spinButtons[1] as HTMLInputElement;
      fireEvent.change(borderWidthInput, { target: { value: '4' } });
      expect(useDesignerStore.getState().borders[0].width).toBe(4);
    });
  });

  describe('fabric drop zones', () => {
    it('shows fabric info when fabricId is set for sashing', () => {
      useDesignerStore.getState().setSashing(2, 'test-fabric', 'https://example.com/fabric.jpg');
      render(<SashingBorderPanel />);
      expect(screen.getByText('test-fabric')).toBeDefined();
    });

    it('shows fabric info when fabricId is set for border', () => {
      useDesignerStore
        .getState()
        .setBorders([{ width: 2, fabricId: 'border-fabric', fabricUrl: null }]);
      render(<SashingBorderPanel />);
      expect(screen.getByText('border-fabric')).toBeDefined();
    });
  });

  describe('drag event passthrough', () => {
    it('calls onFabricDragOver when provided and drag over occurs', () => {
      const handleDragOver = vi.fn();
      render(<SashingBorderPanel onFabricDragOver={handleDragOver} />);
      const dropZone = screen.getByText('Drop fabric here');
      fireEvent.dragOver(dropZone);
      expect(handleDragOver).toHaveBeenCalled();
    });

    it('calls onFabricDrop when provided and drop occurs', () => {
      const handleDrop = vi.fn();
      render(<SashingBorderPanel onFabricDrop={handleDrop} />);
      const dropZone = screen.getByText('Drop fabric here');
      fireEvent.drop(dropZone);
      expect(handleDrop).toHaveBeenCalled();
    });

    it('calls onFabricDragLeave when provided and drag leave occurs', () => {
      const handleDragLeave = vi.fn();
      render(<SashingBorderPanel onFabricDragLeave={handleDragLeave} />);
      const dropZone = screen.getByText('Drop fabric here');
      fireEvent.dragLeave(dropZone);
      expect(handleDragLeave).toHaveBeenCalled();
    });

    it('calls onFabricDragStart when quick-apply swatch drag starts', () => {
      const handleDragStart = vi.fn();
      render(<SashingBorderPanel onFabricDragStart={handleDragStart} />);
      const whiteSwatch = screen.getByTitle('White');
      const mockEvent = {
        dataTransfer: { setData: vi.fn(), effectAllowed: '' },
      };
      fireEvent.dragStart(whiteSwatch, mockEvent);
      expect(handleDragStart).toHaveBeenCalled();
    });
  });
});
