'use client';

import { useState, useEffect } from 'react';
import type { DraftTabProps } from './BlockDraftingShell';

type FreeformTool = 'select' | 'rectangle' | 'triangle' | 'line';

const DRAFT_TOOLS: { id: FreeformTool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'triangle', label: 'Triangle', icon: '△' },
  { id: 'line', label: 'Line', icon: '╱' },
];

export function FreeformDraftingTab({
  draftCanvasRef,
  fillColor,
  strokeColor,
  isOpen,
}: DraftTabProps) {
  const [activeDraftTool, setActiveDraftTool] = useState<FreeformTool>('select');

  // Handle drafting tool interactions
  useEffect(() => {
    if (!draftCanvasRef.current || !isOpen) return;

    let fabric: typeof import('fabric') | null = null;
    let cleanup: (() => void) | null = null;

    (async () => {
      fabric = await import('fabric');
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      if (activeDraftTool === 'select') {
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.getObjects().forEach((obj) => {
          if (!obj.strokeDashArray || obj.stroke !== '#E5E2DD') {
            obj.selectable = true;
            obj.evented = true;
          }
        });
        canvas.renderAll();
        return;
      }

      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.discardActiveObject();

      let isDrawing = false;
      let startX = 0;
      let startY = 0;
      let previewShape: InstanceType<typeof fabric.FabricObject> | null = null;

      function onMouseDown(e: { e: MouseEvent }) {
        if (!fabric || !canvas) return;
        const pointer = canvas.getScenePoint(e.e);
        isDrawing = true;
        startX = pointer.x;
        startY = pointer.y;

        if (activeDraftTool === 'rectangle') {
          previewShape = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: strokeColor,
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });
        } else if (activeDraftTool === 'triangle') {
          previewShape = new fabric.Polygon(
            [
              { x: startX, y: startY },
              { x: startX, y: startY },
              { x: startX, y: startY },
            ],
            {
              fill: 'transparent',
              stroke: strokeColor,
              strokeWidth: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            }
          );
        } else if (activeDraftTool === 'line') {
          previewShape = new fabric.Line([startX, startY, startX, startY], {
            stroke: strokeColor,
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });
        }

        if (previewShape) canvas.add(previewShape);
        canvas.renderAll();
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!fabric || !isDrawing || !previewShape) return;
        const pointer = canvas.getScenePoint(e.e);
        if (activeDraftTool === 'rectangle') {
          previewShape.set({
            left: Math.min(startX, pointer.x),
            top: Math.min(startY, pointer.y),
            width: Math.abs(pointer.x - startX),
            height: Math.abs(pointer.y - startY),
          });
        } else if (activeDraftTool === 'triangle') {
          const poly = previewShape as InstanceType<typeof fabric.Polygon>;
          poly.points = [
            { x: startX, y: pointer.y },
            { x: pointer.x, y: pointer.y },
            { x: startX, y: startY },
          ];
          poly.setBoundingBox(true);
          poly.setCoords();
        } else if (activeDraftTool === 'line') {
          (previewShape as InstanceType<typeof fabric.Line>).set({ x2: pointer.x, y2: pointer.y });
        }
        canvas.renderAll();
      }

      function onMouseUp() {
        if (!fabric || !isDrawing || !previewShape) return;
        isDrawing = false;
        const w = previewShape.width ?? 0;
        const h = previewShape.height ?? 0;
        if (w < 2 && h < 2) {
          canvas.remove(previewShape);
        } else {
          previewShape.set({
            fill: activeDraftTool === 'line' ? undefined : fillColor,
            stroke: strokeColor,
            strokeWidth: 1,
            strokeDashArray: undefined,
            selectable: true,
            evented: true,
          });
        }
        previewShape = null;
        canvas.renderAll();
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
      };
    })();

    return () => {
      cleanup?.();
    };
  }, [isOpen, activeDraftTool, fillColor, strokeColor, draftCanvasRef]);

  return (
    <div className="mb-2 flex items-center gap-1">
      {DRAFT_TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => setActiveDraftTool(tool.id)}
          title={tool.label}
          className={`h-8 w-8 rounded text-sm ${
            activeDraftTool === tool.id
              ? 'bg-primary text-white'
              : 'text-secondary hover:bg-background'
          }`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
