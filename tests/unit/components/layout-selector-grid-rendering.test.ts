// @vitest-environment jsdom
/**
 * SSSOT (2026-04-06): The quilt is the source of truth. Layout presets DO NOT
 * resize the canvas anymore — they update layoutStore, and useLayoutRenderer
 * calls fitLayoutToQuilt() to scale the layout to fit inside the existing
 * quilt dimensions.
 *
 * These tests validate the new behavior: picking a preset only mutates
 * layoutStore. Canvas dimensions in projectStore remain untouched.
 *
 * The fitLayoutToQuilt scaling math itself is covered by
 * tests/unit/lib/layout-renderer-fit.test.ts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { LAYOUT_PRESETS } from '@/lib/layout-library';

describe('Layout preset selection — quilt size is the source of truth', () => {
  beforeEach(() => {
    useLayoutStore.getState().reset();
    useProjectStore.getState().reset();
    useCanvasStore.getState().reset();
  });

  it('Grid 3×3 preset updates layoutStore but does not touch canvas dimensions', () => {
    const preset = LAYOUT_PRESETS.find((p) => p.id === 'grid-3x3');
    expect(preset).toBeDefined();
    if (!preset) return;

    const initialW = useProjectStore.getState().canvasWidth;
    const initialH = useProjectStore.getState().canvasHeight;
    expect(initialW).toBe(48); // DEFAULT_CANVAS_WIDTH
    expect(initialH).toBe(48); // DEFAULT_CANVAS_HEIGHT

    const layoutStore = useLayoutStore.getState();
    layoutStore.setLayoutType(preset.config.type);
    layoutStore.setSelectedPreset(preset.id);
    layoutStore.setRows(preset.config.rows);
    layoutStore.setCols(preset.config.cols);
    layoutStore.setBlockSize(preset.config.blockSize);
    layoutStore.setSashing(preset.config.sashing);

    // Layout store should reflect the preset
    expect(useLayoutStore.getState().layoutType).toBe('grid');
    expect(useLayoutStore.getState().rows).toBe(3);
    expect(useLayoutStore.getState().cols).toBe(3);
    expect(useLayoutStore.getState().blockSize).toBe(6);

    // Canvas dimensions MUST NOT be touched by the layout selector
    expect(useProjectStore.getState().canvasWidth).toBe(initialW);
    expect(useProjectStore.getState().canvasHeight).toBe(initialH);
  });

  it('Sashing 4×4 preset updates layoutStore.sashing but does not touch canvas dimensions', () => {
    const preset = LAYOUT_PRESETS.find((p) => p.id === 'sashing-4x4');
    expect(preset).toBeDefined();
    if (!preset) return;

    const initialW = useProjectStore.getState().canvasWidth;
    const initialH = useProjectStore.getState().canvasHeight;

    const layoutStore = useLayoutStore.getState();
    layoutStore.setLayoutType(preset.config.type);
    layoutStore.setSelectedPreset(preset.id);
    layoutStore.setRows(preset.config.rows);
    layoutStore.setCols(preset.config.cols);
    layoutStore.setBlockSize(preset.config.blockSize);
    layoutStore.setSashing(preset.config.sashing);

    expect(useLayoutStore.getState().layoutType).toBe('sashing');
    expect(useLayoutStore.getState().sashing.width).toBe(1);
    expect(useProjectStore.getState().canvasWidth).toBe(initialW);
    expect(useProjectStore.getState().canvasHeight).toBe(initialH);
  });

  it('On-Point 3×3 preset updates layoutStore.layoutType but does not touch canvas dimensions', () => {
    const preset = LAYOUT_PRESETS.find((p) => p.id === 'on-point-3x3');
    expect(preset).toBeDefined();
    if (!preset) return;

    const initialW = useProjectStore.getState().canvasWidth;
    const initialH = useProjectStore.getState().canvasHeight;

    const layoutStore = useLayoutStore.getState();
    layoutStore.setLayoutType(preset.config.type);
    layoutStore.setSelectedPreset(preset.id);
    layoutStore.setRows(preset.config.rows);
    layoutStore.setCols(preset.config.cols);
    layoutStore.setBlockSize(preset.config.blockSize);
    layoutStore.setSashing(preset.config.sashing);

    expect(useLayoutStore.getState().layoutType).toBe('on-point');
    expect(useProjectStore.getState().canvasWidth).toBe(initialW);
    expect(useProjectStore.getState().canvasHeight).toBe(initialH);
  });

  it('quilt size is the source of truth — layouts adapt to whatever the user picked', () => {
    // User picks a custom 60×72 quilt
    useProjectStore.getState().setCanvasWidth(60);
    useProjectStore.getState().setCanvasHeight(72);

    // Then drops a layout
    const preset = LAYOUT_PRESETS.find((p) => p.id === 'sashing-5x5-border');
    expect(preset).toBeDefined();
    if (!preset) return;

    const layoutStore = useLayoutStore.getState();
    layoutStore.setLayoutType(preset.config.type);
    layoutStore.setSelectedPreset(preset.id);
    layoutStore.setRows(preset.config.rows);
    layoutStore.setCols(preset.config.cols);
    layoutStore.setBlockSize(preset.config.blockSize);
    layoutStore.setSashing(preset.config.sashing);

    // Quilt dimensions are unchanged — they remain 60×72
    expect(useProjectStore.getState().canvasWidth).toBe(60);
    expect(useProjectStore.getState().canvasHeight).toBe(72);
  });
});
