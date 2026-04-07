'use client';

import { useCallback } from 'react';
import type { Project } from '@/types/project';
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace';
import { FloatingToolbar } from '@/components/studio/FloatingToolbar';
import { CanvasErrorBoundary } from '@/components/studio/CanvasErrorBoundary';
import { useFabricDrop } from '@/hooks/useFabricLayout';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { useLayoutStore } from '@/stores/layoutStore';
import type { LayoutType } from '@/lib/layout-utils';

interface StudioDropZoneProps {
  readonly project: Project;
}

/**
 * Wraps the CanvasWorkspace with the unified drag-drop dispatcher.
 *
 * The dispatcher inspects the dataTransfer payload and routes:
 *  - `application/quiltcorgi-layout-preset` → updates layoutStore
 *    (useLayoutRenderer + fitLayoutToQuilt handle the visual reflow)
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
    (e: React.DragEvent) => {
      handleDragOver(e);
      handleFabricDragOver(e);
    },
    [handleDragOver, handleFabricDragOver]
  );

  const combinedDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const layoutPresetId = e.dataTransfer.getData('application/quiltcorgi-layout-preset');
      const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');

      if (layoutPresetId) {
        // Layout drop — update layoutStore only. Quilt size stays fixed;
        // useLayoutRenderer + fitLayoutToQuilt handle the reflow.
        import('@/lib/layout-library').then(({ LAYOUT_PRESETS }) => {
          const preset = LAYOUT_PRESETS.find((p) => p.id === layoutPresetId);
          if (preset) {
            const store = useLayoutStore.getState();
            store.setLayoutType(preset.config.type as LayoutType);
            store.setSelectedPreset(preset.id);
            store.setRows(preset.config.rows);
            store.setCols(preset.config.cols);
            store.setBlockSize(preset.config.blockSize);
            store.setSashing(preset.config.sashing);
          }
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
