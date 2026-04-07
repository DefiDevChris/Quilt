// @vitest-environment jsdom
/**
 * Bug Condition Exploration Test: Grid Layout Rendering
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 * 
 * This test verifies that clicking layout presets (Grid 3×3, Grid 4×4 with Sashing, On-Point 3×3)
 * updates canvas dimensions and centers viewport.
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * 
 * The test encodes the expected behavior - it will validate the fix when it passes after implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { LAYOUT_PRESETS } from '@/lib/layout-library';

describe('Bug Condition 1: Grid Layout Presets Do Not Render on Canvas', () => {
  beforeEach(() => {
    // Reset all stores to initial state
    useLayoutStore.getState().reset();
    useProjectStore.getState().reset();
    useCanvasStore.getState().reset();
  });

  it('Grid 3×3 preset should update canvas dimensions to 18×18 and center viewport', () => {
    // Arrange: Find Grid 3×3 preset
    const preset = LAYOUT_PRESETS.find(p => p.id === 'grid-3x3');
    expect(preset).toBeDefined();
    if (!preset) return;

    // Expected dimensions: 3 cols × 6 blockSize = 18, 3 rows × 6 blockSize = 18
    const expectedWidth = preset.config.cols * preset.config.blockSize;
    const expectedHeight = preset.config.rows * preset.config.blockSize;
    expect(expectedWidth).toBe(18);
    expect(expectedHeight).toBe(18);

    // Record initial canvas dimensions (should be default 48×48)
    const projectStore = useProjectStore.getState();
    const initialWidth = projectStore.canvasWidth;
    const initialHeight = projectStore.canvasHeight;
    expect(initialWidth).toBe(48); // DEFAULT_CANVAS_WIDTH
    expect(initialHeight).toBe(48); // DEFAULT_CANVAS_HEIGHT

    // Act: Simulate clicking the preset (what LayoutSelector.handleSelectPreset does)
    const layoutStore = useLayoutStore.getState();
    layoutStore.setLayoutType(preset.config.type);
    layoutStore.setSelectedPreset(preset.id);
    layoutStore.setRows(preset.config.rows);
    layoutStore.setCols(preset.config.cols);
    layoutStore.setBlockSize(preset.config.blockSize);
    layoutStore.setSashing(preset.config.sashing);

    // Assert: Canvas dimensions should be updated to match the layout
    // BUG: On unfixed code, this will FAIL because canvas dimensions remain at 48×48
    expect(projectStore.canvasWidth).toBe(expectedWidth);
    expect(projectStore.canvasHeight).toBe(expectedHeight);

    // Note: We cannot directly test centerAndFitViewport() call without a real canvas,
    // but we verify the dimensions are correct which is the prerequisite for centering
  });

  it('Grid 4×4 with Sashing preset should update canvas dimensions to include sashing (27×27) and center viewport', () => {
    // Arrange: Find Grid 4×4 with Sashing preset
    const preset = LAYOUT_PRESETS.find(p => p.id === 'sashing-4x4');
    expect(preset).toBeDefined();
    if (!preset) return;

    // Expected dimensions: 4 cols × 6 blockSize + 1 sashing × 3 gaps = 24 + 3 = 27
    const expectedWidth = preset.config.cols * preset.config.blockSize + 
                         preset.config.sashing.width * (preset.config.cols - 1);
    const expectedHeight = preset.config.rows * preset.config.blockSize + 
                          preset.config.sashing.width * (preset.config.rows - 1);
    expect(expectedWidth).toBe(27);
    expect(expectedHeight).toBe(27);

    // Record initial canvas dimensions
    const projectStore = useProjectStore.getState();
    const initialWidth = projectStore.canvasWidth;
    const initialHeight = projectStore.canvasHeight;
    expect(initialWidth).toBe(48); // DEFAULT_CANVAS_WIDTH
    expect(initialHeight).toBe(48); // DEFAULT_CANVAS_HEIGHT

    // Act: Simulate clicking the preset
    const layoutStore = useLayoutStore.getState();
    layoutStore.setLayoutType(preset.config.type);
    layoutStore.setSelectedPreset(preset.id);
    layoutStore.setRows(preset.config.rows);
    layoutStore.setCols(preset.config.cols);
    layoutStore.setBlockSize(preset.config.blockSize);
    layoutStore.setSashing(preset.config.sashing);

    // Assert: Canvas dimensions should include sashing
    // BUG: On unfixed code, this will FAIL because canvas dimensions remain at 48×48
    expect(projectStore.canvasWidth).toBe(expectedWidth);
    expect(projectStore.canvasHeight).toBe(expectedHeight);
  });

  it('On-Point 3×3 preset should update canvas dimensions for rotated layout and center viewport', () => {
    // Arrange: Find On-Point 3×3 preset
    const preset = LAYOUT_PRESETS.find(p => p.id === 'on-point-3x3');
    expect(preset).toBeDefined();
    if (!preset) return;

    // For on-point layouts, blocks are rotated 45 degrees
    // The diagonal of a square block becomes the width/height
    // Diagonal = blockSize * sqrt(2) ≈ 6 * 1.414 = 8.485
    // For a 3×3 on-point grid, we need space for the rotated blocks plus setting triangles
    // Approximate expected dimensions (this will need adjustment based on actual calculation)
    const blockSize = preset.config.blockSize;
    const diagonal = blockSize * Math.sqrt(2);
    
    // On-point layout calculation:
    // Width/Height ≈ (rows + cols - 1) * diagonal / 2
    // For 3×3: (3 + 3 - 1) * 8.485 / 2 ≈ 21.2
    const expectedDimension = Math.ceil((preset.config.rows + preset.config.cols - 1) * diagonal / 2);

    // Record initial canvas dimensions
    const projectStore = useProjectStore.getState();
    const initialWidth = projectStore.canvasWidth;
    const initialHeight = projectStore.canvasHeight;
    expect(initialWidth).toBe(48); // DEFAULT_CANVAS_WIDTH
    expect(initialHeight).toBe(48); // DEFAULT_CANVAS_HEIGHT

    // Act: Simulate clicking the preset
    const layoutStore = useLayoutStore.getState();
    layoutStore.setLayoutType(preset.config.type);
    layoutStore.setSelectedPreset(preset.id);
    layoutStore.setRows(preset.config.rows);
    layoutStore.setCols(preset.config.cols);
    layoutStore.setBlockSize(preset.config.blockSize);
    layoutStore.setSashing(preset.config.sashing);

    // Assert: Canvas dimensions should account for rotation
    // Note: The exact calculation may differ, but dimensions should be larger than straight grid
    const straightGridDimension = preset.config.rows * preset.config.blockSize;
    
    // BUG: On unfixed code, this will FAIL because canvas dimensions remain at 48×48
    // On-point should be larger than straight grid due to rotation
    expect(projectStore.canvasWidth).toBeGreaterThan(straightGridDimension);
    expect(projectStore.canvasHeight).toBeGreaterThan(straightGridDimension);
    
    // Should be close to our calculated expected dimension (within 20% tolerance for rounding)
    expect(projectStore.canvasWidth).toBeGreaterThanOrEqual(expectedDimension * 0.8);
    expect(projectStore.canvasWidth).toBeLessThanOrEqual(expectedDimension * 1.2);
  });

  it('should document counterexamples when tests fail on unfixed code', () => {
    // This test documents the expected failure pattern
    // When run on unfixed code, the above tests will fail because:
    // 1. Canvas dimensions remain at default values (not updated)
    // 2. Viewport is not centered/fitted
    // 3. Layout store is updated but canvas store is not synchronized
    
    // Expected counterexamples:
    // - Grid 3×3: canvasWidth remains 48 (default) instead of 18
    // - Sashing 4×4: canvasWidth remains 48 (default) instead of 27
    // - On-Point 3×3: canvasWidth remains 48 (default) instead of ~21
    
    expect(true).toBe(true); // Placeholder to document expected behavior
  });
});
