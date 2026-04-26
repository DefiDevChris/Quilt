'use client';

import { useCallback } from 'react';
import type { Project } from '@/types/project';
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace';
import { CanvasErrorBoundary } from '@/components/studio/CanvasErrorBoundary';
import { useFabricDrop } from '@/hooks/useFabricLayout';
import { useBlockDrop } from '@/hooks/useBlockDrop';

interface StudioDropZoneProps {
  readonly project: Project;
}

/**
 * Wraps the CanvasWorkspace with the unified drag-drop dispatcher.
 *
 * The dispatcher routes:
 *  - `application/quiltcorgi-fabric-id` → applies a pattern fill (fence-enforced)
 *  - everything else                      → block drop with cell-snap (fence-enforced)
 *
 * Layout configuration is handled in Phase 1 via the SelectionShell — no
 * drag-to-apply layout presets here.
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
      const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');
      if (fabricId) {
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
        data-canvas-wrapper
        onDragOver={combinedDragOver}
        onDrop={combinedDrop}
      >
        <CanvasWorkspace project={project} />
      </div>
    </CanvasErrorBoundary>
  );
}
