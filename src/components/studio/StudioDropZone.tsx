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
import type { LayoutType } from '@/lib/layout-utils';

interface StudioDropZoneProps {
  readonly project: Project;
}

/**
 * Wraps the CanvasWorkspace with the unified drag-drop dispatcher.
 *
 * The dispatcher inspects the dataTransfer payload and routes:
 *  - `application/quiltcorgi-layout-preset` → creates a new worktable tab
 *    with the layout as a fence. One layout per worktable.
 *  - `application/quiltcorgi-fabric-id`     → applies a pattern fill
 *  - everything else                        → block drop with cell-snap
 *
 * Quilt dimensions are NEVER resized by drops — the quilt is the source
 * of truth and layouts adapt to fit inside it.
 */
export function StudioDropZone({ project }: StudioDropZoneProps) {
  const { handleDragStart: _handleBlockDragStart, handleDragOver, handleDrop } = useBlockDrop();
  const { handleFabricDragOver, handleFabricDrop } = useFabricDrop();

  void _handleBlockDragStart;

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
