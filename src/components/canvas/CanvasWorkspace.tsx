'use client';

import { useRef } from 'react';
import type { Project } from '@/types/project';
import { useCanvasInit } from '@/hooks/useCanvasInit';
import { useDrawingTool } from '@/hooks/useDrawingTool';
import { useBlockBuilderCanvas } from '@/hooks/useBlockBuilderCanvas';
import { usePolygonTool } from '@/hooks/usePolygonTool';
import { useCurveEdit } from '@/hooks/useCurveEdit';
import { useEdgeBendTool } from '@/hooks/useEdgeBendTool';
import { useCanvasZoomPan } from '@/hooks/useCanvasZoomPan';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { useLayoutRenderer } from '@/hooks/useLayoutRenderer';
import { useColorThemeTool } from '@/hooks/useColorThemeTool';

interface CanvasWorkspaceProps {
  project: Project;
}

export function CanvasWorkspace({ project }: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);

  useCanvasInit(fabricCanvasRef, gridCanvasRef, containerRef, project);
  useDrawingTool();
  useBlockBuilderCanvas();
  usePolygonTool();
  useCurveEdit();
  useEdgeBendTool();
  useCanvasZoomPan();
  useCanvasKeyboard();
  useLayoutRenderer();
  useColorThemeTool();
  useAutoSave();
  useBeforeUnload();

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden">
      <canvas ref={gridCanvasRef} className="absolute inset-0" style={{ zIndex: 0 }} />
      <canvas ref={fabricCanvasRef} />
    </div>
  );
}
