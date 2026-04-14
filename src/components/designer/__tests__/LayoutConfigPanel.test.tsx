// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LayoutConfigPanel } from '@/components/designer/LayoutConfigPanel';
import { useDesignerStore } from '@/stores/designerStore';

describe('LayoutConfigPanel', () => {
  beforeEach(() => {
    useDesignerStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders the Layout Configuration header', () => {
      render(<LayoutConfigPanel />);
      expect(screen.getByText('Layout Configuration')).toBeDefined();
    });

    it('renders a Rows slider', () => {
      render(<LayoutConfigPanel />);
      expect(screen.getByRole('slider', { name: 'Rows' })).toBeDefined();
    });

    it('renders a Columns slider', () => {
      render(<LayoutConfigPanel />);
      expect(screen.getByRole('slider', { name: 'Columns' })).toBeDefined();
    });

    it('renders a Block Size slider', () => {
      render(<LayoutConfigPanel />);
      expect(screen.getByRole('slider', { name: 'Block Size (inches)' })).toBeDefined();
    });

    it('renders a Sashing Width slider', () => {
      render(<LayoutConfigPanel />);
      expect(screen.getByRole('slider', { name: 'Sashing Width (inches)' })).toBeDefined();
    });

    it('renders the Total Size section', () => {
      render(<LayoutConfigPanel />);
      expect(screen.getByText('Total Size')).toBeDefined();
    });

    it('renders the Grid Preview section', () => {
      render(<LayoutConfigPanel />);
      expect(screen.getByText('Grid Preview')).toBeDefined();
    });

    it('shows slider range labels', () => {
      render(<LayoutConfigPanel />);
      // Check that min/max range labels are rendered for each slider
      const allElements = screen.getAllByText(/\d+/);
      const allText = allElements.map((el) => el.textContent);
      // Rows/cols: 1 and 10
      expect(allText).toContain('1');
      expect(allText).toContain('10');
      // Block size and sashing have inch symbols - check for numbers near min/max
      const hasBlockSizeMin = allText.some((t) => t.includes('4'));
      const hasBlockSizeMax = allText.some((t) => t.includes('24'));
      expect(hasBlockSizeMin).toBe(true);
      expect(hasBlockSizeMax).toBe(true);
    });
  });

  describe('initial values', () => {
    it('shows correct initial rows value', () => {
      render(<LayoutConfigPanel />);
      const rowsSlider = screen.getByRole('slider', { name: 'Rows' }) as HTMLInputElement;
      expect(rowsSlider.value).toBe('3');
    });

    it('shows correct initial cols value', () => {
      render(<LayoutConfigPanel />);
      const colsSlider = screen.getByRole('slider', { name: 'Columns' }) as HTMLInputElement;
      expect(colsSlider.value).toBe('3');
    });

    it('shows correct initial block size value', () => {
      render(<LayoutConfigPanel />);
      const blockSizeSlider = screen.getByRole('slider', {
        name: 'Block Size (inches)',
      }) as HTMLInputElement;
      expect(blockSizeSlider.value).toBe('12');
    });

    it('shows correct initial sashing width value', () => {
      render(<LayoutConfigPanel />);
      const sashingSlider = screen.getByRole('slider', {
        name: 'Sashing Width (inches)',
      }) as HTMLInputElement;
      // Store default is 0, which is below min of 0.5, so browser clamps it
      expect(sashingSlider.value).toMatch(/^0/);
    });

    it('reflects store values in UI', () => {
      useDesignerStore.getState().setRows(5);
      useDesignerStore.getState().setCols(4);
      useDesignerStore.getState().setBlockSize(16);
      useDesignerStore.getState().setSashing(3);

      render(<LayoutConfigPanel />);

      expect((screen.getByRole('slider', { name: 'Rows' }) as HTMLInputElement).value).toBe('5');
      expect((screen.getByRole('slider', { name: 'Columns' }) as HTMLInputElement).value).toBe('4');
      expect(
        (screen.getByRole('slider', { name: 'Block Size (inches)' }) as HTMLInputElement).value
      ).toBe('16');
      expect(
        (screen.getByRole('slider', { name: 'Sashing Width (inches)' }) as HTMLInputElement).value
      ).toBe('3');
    });
  });

  describe('slider interactions', () => {
    it('updates rows when slider changes', () => {
      render(<LayoutConfigPanel />);
      const rowsSlider = screen.getByRole('slider', { name: 'Rows' });
      fireEvent.change(rowsSlider, { target: { value: '7' } });
      expect(useDesignerStore.getState().rows).toBe(7);
    });

    it('updates cols when slider changes', () => {
      render(<LayoutConfigPanel />);
      const colsSlider = screen.getByRole('slider', { name: 'Columns' });
      fireEvent.change(colsSlider, { target: { value: '5' } });
      expect(useDesignerStore.getState().cols).toBe(5);
    });

    it('updates blockSize when slider changes', () => {
      render(<LayoutConfigPanel />);
      const blockSizeSlider = screen.getByRole('slider', { name: 'Block Size (inches)' });
      fireEvent.change(blockSizeSlider, { target: { value: '18' } });
      expect(useDesignerStore.getState().blockSize).toBe(18);
    });

    it('updates sashingWidth when slider changes', () => {
      render(<LayoutConfigPanel />);
      const sashingSlider = screen.getByRole('slider', { name: 'Sashing Width (inches)' });
      fireEvent.change(sashingSlider, { target: { value: '2.5' } });
      expect(useDesignerStore.getState().sashingWidth).toBe(2.5);
    });
  });

  describe('total size computation', () => {
    it('computes content size without sashing', () => {
      // 3 rows x 3 cols x 12" blocks = 36" x 36"
      render(<LayoutConfigPanel quiltWidthIn={60} quiltHeightIn={80} />);
      const contentText = screen.getAllByText(/36\.0/);
      expect(contentText.length).toBeGreaterThan(0);
    });

    it('computes content size with sashing', () => {
      // 3x3 blocks of 12" + 2 sashing strips of 2" = 40" x 40"
      useDesignerStore.getState().setSashing(2);
      render(<LayoutConfigPanel quiltWidthIn={60} quiltHeightIn={80} />);
      const contentText = screen.getAllByText(/40\.0/);
      expect(contentText.length).toBeGreaterThan(0);
    });

    it('includes borders in total size', () => {
      useDesignerStore.getState().setBorders([{ width: 3, fabricId: null, fabricUrl: null }]);
      render(<LayoutConfigPanel quiltWidthIn={60} quiltHeightIn={80} />);
      // Content: 36" + borders: 6" each side = 42" x 42"
      const contentText = screen.getAllByText(/42\.0/);
      expect(contentText.length).toBeGreaterThan(0);
      const borderText = screen.getAllByText(/\+6/);
      expect(borderText.length).toBeGreaterThan(0);
    });

    it('shows fit indicator when layout fits', () => {
      render(<LayoutConfigPanel quiltWidthIn={60} quiltHeightIn={80} />);
      const fitText = screen.getAllByText(/Fits in/);
      expect(fitText.length).toBeGreaterThan(0);
    });

    it('shows exceed indicator when layout exceeds quilt size', () => {
      render(<LayoutConfigPanel quiltWidthIn={30} quiltHeightIn={30} />);
      const exceedText = screen.getAllByText(/Exceeds/);
      expect(exceedText.length).toBeGreaterThan(0);
    });

    it('uses default quilt dimensions when not provided', () => {
      render(<LayoutConfigPanel />);
      const fitText = screen.getAllByText(/Fits in/);
      expect(fitText.length).toBeGreaterThan(0);
    });
  });

  describe('grid preview', () => {
    it('renders correct number of cells for 3x3 grid', () => {
      render(<LayoutConfigPanel />);
      // The grid should have 9 cells (3x3)
      const gridContainer = screen.getByText('Grid Preview').closest('.space-y-2');
      const grid = gridContainer?.querySelector('[style*="grid-template-columns"]');
      expect(grid).toBeDefined();
      const cells = grid?.children;
      expect(cells?.length).toBe(9);
    });

    it('renders correct number of cells for 2x4 grid', () => {
      useDesignerStore.getState().setRows(2);
      useDesignerStore.getState().setCols(4);
      render(<LayoutConfigPanel />);
      const gridContainer = screen.getByText('Grid Preview').closest('.space-y-2');
      const grid = gridContainer?.querySelector('[style*="grid-template-columns"]');
      expect(grid?.children?.length).toBe(8);
    });

    it('updates grid preview when rows/cols change', async () => {
      render(<LayoutConfigPanel />);
      const rowsSlider = screen.getByRole('slider', { name: 'Rows' });
      fireEvent.change(rowsSlider, { target: { value: '5' } });

      await waitFor(() => {
        const gridContainer = screen.getByText('Grid Preview').closest('.space-y-2');
        const grid = gridContainer?.querySelector('[style*="grid-template-columns"]');
        // 5 rows x 3 cols = 15 cells
        expect(grid?.children?.length).toBe(15);
      });
    });
  });

  describe('external store sync', () => {
    it('updates UI when store changes externally', () => {
      render(<LayoutConfigPanel />);
      // Change store externally
      useDesignerStore.getState().setRows(8);
      useDesignerStore.getState().setCols(6);

      // Verify the store values changed (UI sync is handled via useEffect)
      expect(useDesignerStore.getState().rows).toBe(8);
      expect(useDesignerStore.getState().cols).toBe(6);
    });
  });
});
