'use client';

import { useRef } from 'react';
import type { Project } from '@/types/project';
import { useCanvasInit } from '@/hooks/useCanvasInit';
import { useDrawingTool } from '@/hooks/useDrawingTool';
import { useBezierCurveTool } from '@/hooks/useBezierCurveTool';
import { useFreeDrawTool } from '@/hooks/useFreeDrawTool';
import { useCurveEdit } from '@/hooks/useCurveEdit';
import { useCanvasZoomPan } from '@/hooks/useCanvasZoomPan';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { useLayoutEngine } from '@/hooks/useLayoutEngine';
import { useTextTool } from '@/hooks/useTextTool';
import { useColorwayTool } from '@/hooks/useColorwayTool';
import { usePuzzleView } from '@/hooks/usePuzzleView';

interface CanvasWorkspaceProps {
  project: Project;
}

export function CanvasWorkspace({ project }: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);

  useCanvasInit(fabricCanvasRef, gridCanvasRef, containerRef, project);
  useDrawingTool();
  useBezierCurveTool();
  useFreeDrawTool();
  useCurveEdit();
  useCanvasZoomPan();
  useCanvasKeyboard();
  useLayoutEngine();
  useTextTool();
  useColorwayTool();
  usePuzzleView();
  useAutoSave();
  useBeforeUnload();

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden">
      <canvas ref={gridCanvasRef} className="absolute inset-0" style={{ zIndex: 0 }} />
      <canvas ref={fabricCanvasRef} />
    </div>
  );
}
