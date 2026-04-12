'use client';

import { useRef } from 'react';
import type { Project } from '@/types/project';
import { useCanvasInit } from '@/hooks/useCanvasInit';
import { useDrawingTool } from '@/hooks/useDrawingTool';
import { usePolygonTool } from '@/hooks/usePolygonTool';
import { useEasyDrawTool } from '@/hooks/useEasyDrawTool';
import { useBendTool } from '@/hooks/useBendTool';
import { useCanvasZoomPan } from '@/hooks/useCanvasZoomPan';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { useFenceRenderer } from '@/hooks/useFenceRenderer';
import { Z_INDEX } from '@/lib/design-system';

interface CanvasWorkspaceProps {
  project: Project;
}

export function CanvasWorkspace({ project }: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);

  useCanvasInit(fabricCanvasRef, gridCanvasRef, containerRef, project);
  useDrawingTool();
  usePolygonTool();
  useEasyDrawTool();
  useBendTool();
  useCanvasZoomPan();
  useCanvasKeyboard();
  useFenceRenderer();
  useAutoSave();
  useBeforeUnload();

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden">
      <canvas ref={gridCanvasRef} className="absolute inset-0" style={{ zIndex: Z_INDEX.base }} />
      <canvas ref={fabricCanvasRef} />
    </div>
  );
}
