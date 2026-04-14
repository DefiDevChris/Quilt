'use client';

import { useRef } from 'react';
import type { Project } from '@/types/project';
import { useCanvasInit } from '@/hooks/useCanvasInit';
import { useCanvasZoomPan } from '@/hooks/useCanvasZoomPan';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { useDesignerFenceRenderer } from '@/hooks/useDesignerFenceRenderer';
import { useRealisticRender } from '@/hooks/useRealisticRender';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { useFabricDrop } from '@/hooks/useFabricLayout';
import { Z_INDEX } from '@/lib/design-system';

interface DesignerCanvasWorkspaceProps {
  project: Project;
}

/**
 * DesignerCanvasWorkspace — Simplified canvas workspace for the designer route.
 *
 * Dual canvas setup (grid + fabric) with only the hooks needed for the
 * simplified designer experience:
 * - Canvas initialization, zoom/pan, keyboard navigation
 * - Designer-specific fence renderer (grid + sashing + borders only)
 * - Block drag-and-drop, fabric drop for sashing/borders
 * - Realistic rendering (shadows, stitch lines)
 *
 * Auto-save is handled by the parent (DesignerLayout) via useDesignerAutoSave.
 *
 * NO drawing tools, NO easydraw, NO bend, NO polygon.
 */
export function DesignerCanvasWorkspace({ project }: DesignerCanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);

  // Core canvas functionality
  useCanvasInit(fabricCanvasRef, gridCanvasRef, containerRef, project);
  useCanvasZoomPan();
  useCanvasKeyboard();

  // Designer-specific fences rendering
  useDesignerFenceRenderer();

  // Realistic rendering mode
  useRealisticRender();

  // Drag and drop — only block drop handlers attached to container
  const { handleDragStart, handleDragOver, handleDrop, handleDragLeave } = useBlockDrop();

  // Fabric drop — used by SashingBorderPanel via context/props, not attached here
  // (fabric drop targets are the drop zones in the right panel, not the canvas container)
  useFabricDrop();

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas ref={gridCanvasRef} className="absolute inset-0" style={{ zIndex: Z_INDEX.base }} />
      <canvas ref={fabricCanvasRef} />
    </div>
  );
}

// Re-export drop handlers for use in parent components (block panels, fabric library)
export { useBlockDrop, useFabricDrop };
