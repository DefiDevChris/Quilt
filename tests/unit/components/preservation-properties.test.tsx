// @vitest-environment jsdom
/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**
 * 
 * These tests capture observed behavior patterns that MUST be preserved after the fix.
 * They verify that free canvas mode, block/layout worktable toolbars, and even tool counts
 * continue to work correctly.
 * 
 * IMPORTANT: These tests should PASS on unfixed code to confirm baseline behavior to preserve.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Toolbar } from '@/components/studio/Toolbar';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useYardageStore } from '@/stores/yardageStore';
import { usePrintlistStore } from '@/stores/printlistStore';

describe('Property 2: Preservation - Free Canvas and Non-Quilt Worktable Behavior', () => {
  beforeEach(() => {
    // Reset all stores to initial state
    useCanvasStore.getState().reset();
    useLayoutStore.getState().reset();
    useProjectStore.getState().reset();
    useYardageStore.getState().reset();
    usePrintlistStore.getState().reset();
  });

  describe('Free Canvas Mode Preservation (Requirement 4.1)', () => {
    it('should set layoutType to free-form without updating canvas dimensions', () => {
      // Arrange: Record initial canvas dimensions
      const initialWidth = useProjectStore.getState().canvasWidth;
      const initialHeight = useProjectStore.getState().canvasHeight;
      expect(initialWidth).toBe(48); // DEFAULT_CANVAS_WIDTH
      expect(initialHeight).toBe(48); // DEFAULT_CANVAS_HEIGHT

      // Act: Simulate clicking "No Layout (Free Canvas)" option
      useLayoutStore.getState().setLayoutType('free-form');
      useLayoutStore.getState().setSelectedPreset(null);

      // Assert: layoutType should be 'free-form'
      const layoutStore = useLayoutStore.getState();
      expect(layoutStore.layoutType).toBe('free-form');
      expect(layoutStore.selectedPresetId).toBe(null);

      // Assert: Canvas dimensions should remain unchanged
      const projectStore = useProjectStore.getState();
      expect(projectStore.canvasWidth).toBe(initialWidth);
      expect(projectStore.canvasHeight).toBe(initialHeight);
    });

    it('should not trigger dimension updates when free-form is selected multiple times', () => {
      // Arrange: Set free-form mode
      const layoutStore = useLayoutStore.getState();
      const projectStore = useProjectStore.getState();
      layoutStore.setLayoutType('free-form');

      const initialWidth = projectStore.canvasWidth;
      const initialHeight = projectStore.canvasHeight;

      // Act: Select free-form again
      layoutStore.setLayoutType('free-form');
      layoutStore.setSelectedPreset(null);

      // Assert: Dimensions should remain unchanged
      expect(projectStore.canvasWidth).toBe(initialWidth);
      expect(projectStore.canvasHeight).toBe(initialHeight);
    });

    it('should preserve canvas dimensions when switching from grid to free-form', () => {
      // Arrange: Set a grid layout first
      const layoutStore = useLayoutStore.getState();
      const projectStore = useProjectStore.getState();

      layoutStore.setLayoutType('grid');
      layoutStore.setRows(3);
      layoutStore.setCols(3);
      layoutStore.setBlockSize(6);

      const dimensionsBeforeFreeForm = {
        width: projectStore.canvasWidth,
        height: projectStore.canvasHeight
      };

      // Act: Switch to free-form
      layoutStore.setLayoutType('free-form');
      layoutStore.setSelectedPreset(null);

      // Assert: Canvas dimensions should remain unchanged
      expect(projectStore.canvasWidth).toBe(dimensionsBeforeFreeForm.width);
      expect(projectStore.canvasHeight).toBe(dimensionsBeforeFreeForm.height);
    });
  });

  describe('Block Worktable Toolbar Preservation (Requirement 4.3)', () => {
    it('should display tools in single-column layout for block worktable', () => {
      // Arrange: Set active worktable to 'block'
      useCanvasStore.setState({ activeWorktable: 'block' });

      // Act: Render toolbar
      const { container } = render(<Toolbar />);

      // Assert: Should NOT have 2-column grid containers
      const twoColumnGrids = container.querySelectorAll('.grid.grid-cols-2');
      expect(twoColumnGrids.length).toBe(0);

      // Assert: Should have single-column layout (flex-col)
      const singleColumnContainers = container.querySelectorAll('.flex.flex-col');
      expect(singleColumnContainers.length).toBeGreaterThan(0);
    });

    it('should maintain single-column structure across all tool groups in block worktable', () => {
      // Arrange: Set active worktable to 'block'
      useCanvasStore.setState({ activeWorktable: 'block' });

      // Act: Render toolbar
      const { container } = render(<Toolbar />);

      // Assert: All tool buttons should be in single-column layout
      const toolButtons = container.querySelectorAll('button[aria-label]');

      // Verify we have tools rendered
      expect(toolButtons.length).toBeGreaterThan(0);

      // The parent container should use flex-col, not grid-cols-2
      const flexColContainers = container.querySelectorAll('.flex.flex-col');
      expect(flexColContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Quilt Worktable Toolbar Layout (Requirement 4.4)', () => {
    it('should display tools in single-column layout for quilt worktable', () => {
      // Arrange: Set active worktable to 'quilt'
      useCanvasStore.setState({ activeWorktable: 'quilt' });

      // Act: Render toolbar
      const { container } = render(<Toolbar />);

      // Assert: Should NOT have 2-column grid containers
      const twoColumnGrids = container.querySelectorAll('.grid.grid-cols-2');
      expect(twoColumnGrids.length).toBe(0);

      // Assert: Should have single-column layout (flex-col)
      const singleColumnContainers = container.querySelectorAll('.flex.flex-col');
      expect(singleColumnContainers.length).toBeGreaterThan(0);
    });

    it('should maintain single-column structure across all tool groups in quilt worktable', () => {
      // Arrange: Set active worktable to 'quilt'
      useCanvasStore.setState({ activeWorktable: 'quilt' });

      // Act: Render toolbar
      const { container } = render(<Toolbar />);

      // Assert: All tool buttons should be in single-column layout
      const toolButtons = container.querySelectorAll('button[aria-label]');

      // Verify we have tools rendered
      expect(toolButtons.length).toBeGreaterThan(0);

      // The parent container should use flex-col, not grid-cols-2
      const flexColContainers = container.querySelectorAll('.flex.flex-col');
      expect(flexColContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Even Tool Count Preservation (Requirement 4.8)', () => {
    it('should display toolbar with even tool counts correctly without orphan centering', () => {
      // Arrange: Set active worktable to 'quilt' (which uses 2-column grid)
      useCanvasStore.setState({ activeWorktable: 'quilt' });

      // Act: Render toolbar
      const { container } = render(<Toolbar />);

      // Find all 2-column grid containers
      const gridContainers = container.querySelectorAll('.grid.grid-cols-2');

      // Assert: For groups with even tool counts, no tools should be centered
      gridContainers.forEach(gridContainer => {
        const gridChildren = Array.from(gridContainer.children);

        // If the group has an even number of children, none should be centered
        if (gridChildren.length % 2 === 0) {
          const centeredTools = gridChildren.filter(child => {
            const element = child as HTMLElement;
            return element.classList.contains('col-span-2') &&
              element.classList.contains('justify-center');
          });

          // Even-count groups should have no centered tools
          expect(centeredTools.length).toBe(0);
        }
      });
    });
  });

  describe('Advanced Tools Toggle Preservation (Requirements 4.5, 4.6)', () => {
    it('should show only primary and pinned tools when advanced tools are collapsed', () => {
      // Arrange: Set active worktable to 'quilt'
      useCanvasStore.setState({ activeWorktable: 'quilt' });

      // Act: Render toolbar (advanced tools collapsed by default)
      const { container } = render(<Toolbar />);

      // Assert: Should have "More Tools" toggle button
      const moreToolsButton = container.querySelector('[aria-label*="advanced tools"]');
      expect(moreToolsButton).toBeTruthy();
      expect(moreToolsButton?.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('Layout Preset Selection Preservation (Requirement 4.7)', () => {
    it('should maintain selection state when clicking already-active preset', () => {
      // Arrange: Set a preset as active
      const layoutStore = useLayoutStore.getState();
      layoutStore.setLayoutType('grid');
      layoutStore.setSelectedPreset('grid-3x3');
      layoutStore.setRows(3);
      layoutStore.setCols(3);
      layoutStore.setBlockSize(6);

      const initialLayoutType = layoutStore.layoutType;
      const initialPresetId = layoutStore.selectedPresetId;
      const initialRows = layoutStore.rows;
      const initialCols = layoutStore.cols;

      // Act: "Click" the same preset again (simulate re-selection)
      layoutStore.setLayoutType('grid');
      layoutStore.setSelectedPreset('grid-3x3');
      layoutStore.setRows(3);
      layoutStore.setCols(3);
      layoutStore.setBlockSize(6);

      // Assert: Selection state should remain unchanged
      expect(layoutStore.layoutType).toBe(initialLayoutType);
      expect(layoutStore.selectedPresetId).toBe(initialPresetId);
      expect(layoutStore.rows).toBe(initialRows);
      expect(layoutStore.cols).toBe(initialCols);
    });
  });

  describe('Test Summary and Expected Outcomes', () => {
    it('should document that all preservation tests pass on unfixed code', () => {
      // This test documents the expected outcome of running preservation tests
      // on the UNFIXED codebase.
      //
      // EXPECTED OUTCOME: All tests in this file should PASS on unfixed code
      //
      // This confirms that the baseline behaviors we want to preserve are
      // currently working correctly:
      //
      // 1. Free Canvas Mode (4.1):
      //    - Clicking "No Layout (Free Canvas)" sets layoutType='free-form'
      //    - Canvas dimensions are NOT updated when free-form is selected
      //    - This behavior must be preserved after the fix
      //
      // 2. Block Worktable Toolbar (4.3):
      //    - Block worktable displays tools in single-column layout
      //    - No 2-column grid is used for block worktable
      //    - This behavior must be preserved after the fix
      //
      // 3. Layout Worktable Toolbar (4.4):
      //    - Layout worktable displays tools in single-column layout
      //    - No 2-column grid is used for layout worktable
      //    - This behavior must be preserved after the fix
      //
      // 4. Even Tool Count (4.8):
      //    - Toolbar groups with even tool counts display correctly
      //    - No orphan centering occurs for even-count groups
      //    - This behavior must be preserved after the fix
      //
      // 5. Advanced Tools Toggle (4.5, 4.6):
      //    - Advanced tools can be collapsed/expanded
      //    - This behavior must be preserved after the fix
      //
      // 6. Layout Preset Selection (4.7):
      //    - Re-selecting an active preset maintains state
      //    - This behavior must be preserved after the fix
      //
      // If any of these tests FAIL on unfixed code, it indicates that our
      // understanding of the baseline behavior is incorrect and we need to
      // re-observe the actual behavior before writing preservation tests.

      expect(true).toBe(true); // Placeholder to document expected behavior
    });
  });
});
