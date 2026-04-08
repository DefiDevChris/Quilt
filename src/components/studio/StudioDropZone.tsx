'use client';

import { useCallback } from 'react';
import type { Project } from '@/types/project';
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace';
import { FloatingToolbar } from '@/components/studio/FloatingToolbar';
import { CanvasErrorBoundary } from '@/components/studio/CanvasErrorBoundary';
import { useFabricDrop } from '@/hooks/useFabricLayout';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { useLayoutStore } from '@/stores/layoutStore';
import { useCanvasStore, type WorktableTab } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import type { LayoutType, BorderConfig, SashingConfig } from '@/lib/layout-utils';

/**
 * Compute the total quilt size (in inches) from a layout config.
 */
function computeLayoutSize(opts: {
  rows: number;
  cols: number;
  blockSize: number;
  sashing: SashingConfig;
  borders: BorderConfig[];
  bindingWidth: number;
  hasCornerstones: boolean;
}): { width: number; height: number } {
  const { rows, cols, blockSize, sashing, borders, bindingWidth } = opts;

  // Block area
  const blockAreaW = cols * blockSize;
  const blockAreaH = rows * blockSize;

  // Sashing gaps (between blocks)
  const sashingCols = Math.max(0, cols - 1) * sashing.width;
  const sashingRows = Math.max(0, rows - 1) * sashing.width;

  // Borders (each border adds width to BOTH sides)
  let borderW = 0;
  let borderH = 0;
  for (const b of borders) {
    borderW += b.width * 2;
    borderH += b.width * 2;
  }

  // Binding adds to all four sides
  const bindingTotal = bindingWidth * 2;

  const totalW = blockAreaW + sashingCols + borderW + bindingTotal;
  const totalH = blockAreaH + sashingRows + borderH + bindingTotal;

  return { width: Math.max(1, Math.round(totalW * 100) / 100), height: Math.max(1, Math.round(totalH * 100) / 100) };
}

interface StudioDropZoneProps {
  readonly project: Project;
}

/**
 * Wraps the CanvasWorkspace with the unified drag-drop dispatcher.
 *
 * The dispatcher inspects the dataTransfer payload and routes:
 *  - `application/quiltcorgi-layout-preset` → creates a new worktable tab
 *    with the layout as a fence, and resizes the quilt canvas to fit.
 *  - `application/quiltcorgi-fabric-id`     → applies a pattern fill
 *  - everything else                        → block drop with cell-snap
 */
export function StudioDropZone({ project }: StudioDropZoneProps) {
  const { handleDragOver, handleDrop } = useBlockDrop();
  const { handleFabricDragOver, handleFabricDrop } = useFabricDrop();

  const combinedDragOver = useCallback(
    async (e: React.DragEvent) => {
      await handleDragOver(e);
      await handleFabricDragOver(e);
    },
    [handleDragOver, handleFabricDragOver]
  );

  const combinedDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const layoutPresetId = e.dataTransfer.getData('application/quiltcorgi-layout-preset');
      const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');

      if (layoutPresetId) {
        // Layout drop — create a NEW worktable tab with this layout.
        // One layout per worktable; changing layout = new tab.
        import('@/lib/layout-library').then(({ LAYOUT_PRESETS }) => {
          const preset = LAYOUT_PRESETS.find((p) => p.id === layoutPresetId);
          if (!preset) return;

          const layoutStore = useLayoutStore.getState();
          layoutStore.setLayoutType(preset.config.type as LayoutType);
          layoutStore.setSelectedPreset(preset.id);
          layoutStore.setRows(preset.config.rows);
          layoutStore.setCols(preset.config.cols);
          layoutStore.setBlockSize(preset.config.blockSize);
          layoutStore.setSashing(preset.config.sashing);

          // Resize the quilt canvas to match the layout dimensions
          const layoutSize = computeLayoutSize({
            rows: preset.config.rows,
            cols: preset.config.cols,
            blockSize: preset.config.blockSize,
            sashing: preset.config.sashing,
            borders: preset.config.borders ?? [],
            bindingWidth: 0,
            hasCornerstones: false,
          });
          useProjectStore.getState().setCanvasWidth(layoutSize.width);
          useProjectStore.getState().setCanvasHeight(layoutSize.height);

          // Create a new worktable tab with this layout snapshot
          const tab: WorktableTab = {
            id: `wt-${Date.now()}`,
            name: preset.name,
            type: 'quilt',
            layoutSnapshot: {
              layoutType: preset.config.type,
              rows: preset.config.rows,
              cols: preset.config.cols,
              blockSize: preset.config.blockSize,
              sashingWidth: preset.config.sashing.width,
              hasCornerstones: false,
              borders: preset.config.borders ?? [],
              bindingWidth: 0,
              selectedPresetId: preset.id,
            },
            createdAt: Date.now(),
          };
          useCanvasStore.getState().addWorktableTab(tab);

          // Re-center the viewport after resize
          setTimeout(() => {
            useCanvasStore.getState().centerAndFitViewport();
          }, 50);
        });
      } else if (fabricId) {
        handleFabricDrop(e);
      } else {
        handleDrop(e);
      }
    },
    [handleDrop, handleFabricDrop]
  );

  return (
    <CanvasErrorBoundary>
      <div
        className="flex-1 flex overflow-hidden relative"
        onDragOver={combinedDragOver}
        onDrop={combinedDrop}
      >
        <CanvasWorkspace project={project} />
        <FloatingToolbar />
      </div>
    </CanvasErrorBoundary>
  );
}
