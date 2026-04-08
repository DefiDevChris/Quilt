'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '@/types/project';

import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { LayoutElementsLibrary } from '@/components/studio/layout-builder/LayoutElementsLibrary';
import { LayoutBuilderToolbar } from '@/components/studio/layout-builder/LayoutBuilderToolbar';
import { LayoutRoleInspector } from '@/components/studio/layout-builder/LayoutRoleInspector';

import { BottomBar } from '@/components/studio/BottomBar';
import { ContextMenu } from '@/components/canvas/ContextMenu';
import { QuickInfo } from '@/components/canvas/QuickInfo';

interface LayoutBuilderShellProps {
  readonly project: Project;
  readonly onDone: () => void;
}

type BuilderTool = 'select' | 'draw' | 'rectangle' | 'triangle' | 'pan';

/**
 * Layout Builder — a dedicated canvas surface where users design their own
 * layout on top of a reference grid.  Shapes are drawn or dragged from the
 * library, then assigned a role (border, sashing, block cell, edging).
 *
 * Toolbar (left, 88px) — Select, Pan, Draw (pencil), Rectangle, Triangle
 * ContextPanel (right, 320px) — TOP: Layout Elements Library (borders,
 *   sashing, block cells, edging). BOTTOM: Role Inspector.
 */
export function LayoutBuilderShell({ project, onDone }: LayoutBuilderShellProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<unknown>(null);
  const [activeTool, setActiveTool] = useState<BuilderTool>('select');
  const [selectedObject, setSelectedObject] = useState<unknown | null>(null);
  const isDrawingRef = useRef(false);
  const drawStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempShapeRef = useRef<unknown | null>(null);

  // Initialize Fabric canvas
  useEffect(() => {
    const canvasEl = canvasElRef.current;
    if (!canvasEl) return;

    let cancelled = false;

    async function init() {
      const fabric = await import('fabric');
      if (cancelled) return;
      if (!canvasEl) return;

      const { width, height } = canvasEl.getBoundingClientRect();
      const fabricCanvas = new fabric.Canvas(canvasEl, {
        width,
        height,
        backgroundColor: '#F8F7F5',
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = fabricCanvas;
      useCanvasStore.getState().setFabricCanvas(
        fabricCanvas as unknown as InstanceType<typeof fabric.Canvas>
      );

      // Draw reference grid as Fabric.js lines
      const gridSize = project.gridSettings?.size ?? 1;
      const canvasW = fabricCanvas.getWidth();
      const canvasH = fabricCanvas.getHeight();
      const gridLines: unknown[] = [];
      for (let x = 0; x <= canvasW; x += gridSize) {
        const line = new fabric.Line([x, 0, x, canvasH], {
          stroke: '#E5E2DD',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (line as unknown as Record<string, unknown>)['_layoutGridElement'] = true;
        gridLines.push(line);
      }
      for (let y = 0; y <= canvasH; y += gridSize) {
        const line = new fabric.Line([0, y, canvasW, y], {
          stroke: '#E5E2DD',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (line as unknown as Record<string, unknown>)['_layoutGridElement'] = true;
        gridLines.push(line);
      }
      gridLines.forEach((l) => fabricCanvas.add(l as Parameters<typeof fabricCanvas.add>[0]));

      // Events
      fabricCanvas.on('selection:created', (e) => {
        const obj = e.selected?.[0] ?? null;
        if (obj && !(obj as unknown as Record<string, unknown>)['_layoutGridElement']) {
          setSelectedObject(obj);
        }
      });
      fabricCanvas.on('selection:updated', (e) => {
        const obj = e.selected?.[0] ?? null;
        if (obj && !(obj as unknown as Record<string, unknown>)['_layoutGridElement']) {
          setSelectedObject(obj);
        }
      });
      fabricCanvas.on('selection:cleared', () => setSelectedObject(null));

      fabricCanvas.on('mouse:down', (opt) => {
        if (activeTool === 'select' || activeTool === 'pan') return;
        const fc = fabricCanvas as unknown as { getPointer: (e: import('fabric').TPointerEvent) => { x: number; y: number } };
        const pointer = fc.getPointer(opt.e!);
        isDrawingRef.current = true;
        drawStartPointRef.current = { x: pointer.x, y: pointer.y };
      });

      fabricCanvas.on('mouse:move', (opt) => {
        if (!isDrawingRef.current || !drawStartPointRef.current) return;
        const fc = fabricCanvas as unknown as { getPointer: (e: import('fabric').TPointerEvent) => { x: number; y: number } };
        const pointer = fc.getPointer(opt.e!);
        const start = drawStartPointRef.current;

        // Remove previous temp shape
        if (tempShapeRef.current) {
          fabricCanvas.remove(tempShapeRef.current as Parameters<typeof fabricCanvas.remove>[0]);
        }

        if (activeTool === 'rectangle') {
          const w = pointer.x - start.x;
          const h = pointer.y - start.y;
          const rect = new fabric.Rect({
            left: w > 0 ? start.x : pointer.x,
            top: h > 0 ? start.y : pointer.y,
            width: Math.abs(w),
            height: Math.abs(h),
            fill: 'rgba(255, 165, 0, 0.15)',
            stroke: '#FF9800',
            strokeWidth: 2,
            strokeDashArray: [5, 3],
            selectable: false,
            evented: false,
          });
          tempShapeRef.current = rect;
          fabricCanvas.add(rect);
          fabricCanvas.renderAll();
        } else if (activeTool === 'triangle') {
          const triangle = new fabric.Triangle({
            left: start.x,
            top: start.y,
            width: Math.abs(pointer.x - start.x),
            height: Math.abs(pointer.y - start.y),
            fill: 'rgba(255, 165, 0, 0.15)',
            stroke: '#FF9800',
            strokeWidth: 2,
            strokeDashArray: [5, 3],
            selectable: false,
            evented: false,
          });
          tempShapeRef.current = triangle;
          fabricCanvas.add(triangle);
          fabricCanvas.renderAll();
        } else if (activeTool === 'draw') {
          // Free draw — handled via fabric.Path in mouse:up
        }
      });

      fabricCanvas.on('mouse:up', (opt) => {
        if (!isDrawingRef.current || !drawStartPointRef.current) return;
        isDrawingRef.current = false;
        const fc = fabricCanvas as unknown as { getPointer: (e: import('fabric').TPointerEvent) => { x: number; y: number } };
        const pointer = fc.getPointer(opt.e!);
        const start = drawStartPointRef.current;
        drawStartPointRef.current = null;

        // Remove temp shape
        if (tempShapeRef.current) {
          fabricCanvas.remove(tempShapeRef.current as Parameters<typeof fabricCanvas.remove>[0]);
          tempShapeRef.current = null;
        }

        if (activeTool === 'rectangle') {
          const w = pointer.x - start.x;
          const h = pointer.y - start.y;
          if (Math.abs(w) > 3 && Math.abs(h) > 3) {
            const rect = new fabric.Rect({
              left: w > 0 ? start.x : pointer.x,
              top: h > 0 ? start.y : pointer.y,
              width: Math.abs(w),
              height: Math.abs(h),
              fill: 'rgba(255, 165, 0, 0.08)',
              stroke: '#333',
              strokeWidth: 1.5,
              selectable: true,
              evented: true,
            });
            (rect as unknown as Record<string, unknown>)['_layoutBuilderShape'] = true;
            fabricCanvas.add(rect);
            fabricCanvas.setActiveObject(rect);
            fabricCanvas.renderAll();
          }
        } else if (activeTool === 'triangle') {
          if (Math.abs(pointer.x - start.x) > 3 && Math.abs(pointer.y - start.y) > 3) {
            const triangle = new fabric.Triangle({
              left: Math.min(start.x, pointer.x),
              top: Math.min(start.y, pointer.y),
              width: Math.abs(pointer.x - start.x),
              height: Math.abs(pointer.y - start.y),
              fill: 'rgba(255, 165, 0, 0.08)',
              stroke: '#333',
              strokeWidth: 1.5,
              selectable: true,
              evented: true,
            });
            (triangle as unknown as Record<string, unknown>)['_layoutBuilderShape'] = true;
            fabricCanvas.add(triangle);
            fabricCanvas.setActiveObject(triangle);
            fabricCanvas.renderAll();
          }
        } else if (activeTool === 'draw') {
          // Simple free-hand path
          const pathData = `M ${start.x} ${start.y} L ${pointer.x} ${pointer.y}`;
          const path = new fabric.Path(pathData, {
            fill: '',
            stroke: '#333',
            strokeWidth: 2,
            selectable: true,
            evented: true,
          });
          (path as unknown as Record<string, unknown>)['_layoutBuilderShape'] = true;
          fabricCanvas.add(path);
          fabricCanvas.renderAll();
        }

        // Switch back to select after drawing
        setActiveTool('select');
      });

      // Resize observer
      const ro = new ResizeObserver(() => {
        const { width: w, height: h } = canvasEl.getBoundingClientRect();
        fabricCanvas.setDimensions({ width: w, height: h });
        fabricCanvas.renderAll();
      });
      ro.observe(canvasEl);

      return () => {
        ro.disconnect();
        fabricCanvas.dispose();
      };
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [project.gridSettings?.size]);

  // Handle drag-and-drop from layout elements library
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const fabricCanvas = fabricCanvasRef.current;
      if (!fabricCanvas) return;

      const fabric = await import('fabric');
      const fc = fabricCanvas as InstanceType<typeof fabric.Canvas> & {
        getPointer: (e: import('fabric').TPointerEvent) => { x: number; y: number };
      };
      const rect = fc.getElement().getBoundingClientRect();
      const pointer = fc.getPointer(e as unknown as import('fabric').TPointerEvent);

      const elementId = e.dataTransfer.getData('application/quiltcorgi-layout-element');
      if (!elementId) return;

      const element = LAYOUT_ELEMENTS.find((el) => el.id === elementId);
      if (!element) return;

      const shape = element.createShape(fabric, pointer.x, pointer.y);
      (shape as unknown as Record<string, unknown>)['_layoutBuilderShape'] = true;
      (shape as unknown as Record<string, unknown>)['_layoutRole'] = element.defaultRole;
      (shape as unknown as Record<string, unknown>)['_layoutElementId'] = elementId;

      fc.add(shape as Parameters<typeof fc.add>[0]);
      fc.setActiveObject(shape as Parameters<typeof fc.setActiveObject>[0]);
      fc.renderAll();
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left toolbar */}
      <LayoutBuilderToolbar activeTool={activeTool} onToolChange={setActiveTool} />

      {/* Canvas */}
      <div
        className="flex-1 flex flex-col overflow-hidden relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex-1 relative">
          {/* "Done" button overlay */}
          <div className="absolute top-3 left-3 z-10">
            <button
              type="button"
              onClick={onDone}
              className="rounded-full bg-gradient-to-r from-orange-500 to-rose-400 px-4 py-1.5 text-xs font-bold text-white shadow-elevation-1 hover:opacity-90 transition-opacity"
            >
              ✓ Done — Use Layout
            </button>
          </div>
          <canvas ref={canvasElRef} className="w-full h-full block" />
        </div>
        <ContextMenu />
        <QuickInfo />
      </div>

      {/* Right panel */}
      <aside className="w-[320px] h-full flex-shrink-0 flex flex-col bg-surface border-l border-outline-variant/15 overflow-hidden">
        {/* TOP: Layout Elements Library */}
        <section className="flex flex-col" style={{ flex: '0 0 50%', minHeight: 0 }}>
          <div className="flex items-center px-3 py-2 bg-surface-container-high border-b border-outline-variant/40 flex-shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface">
              Layout Elements
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <LayoutElementsLibrary />
          </div>
        </section>

        {/* BOTTOM: Role Inspector */}
        <section className="flex flex-col border-t-2 border-outline-variant/30" style={{ flex: '1 1 50%', minHeight: 0 }}>
          <div className="flex items-center justify-between px-3 py-2 bg-surface-container-high border-b border-outline-variant/40 flex-shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface">
              Shape Role
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <LayoutRoleInspector
              selectedObject={selectedObject}
              onChange={() => {
                (fabricCanvasRef.current as unknown as { renderAll: () => void })?.renderAll();
              }}
            />
          </div>
        </section>
      </aside>

      <BottomBar />
    </div>
  );
}

// ─── Layout Element Definitions ────────────────────────────────────────────

interface LayoutElement {
  id: string;
  name: string;
  description: string;
  defaultRole: string;
  icon: React.ReactNode;
  createShape: (
    fabric: typeof import('fabric'),
    x: number,
    y: number
  ) => unknown;
}

const BORDER_WIDTH = 4; // inches

const LAYOUT_ELEMENTS: LayoutElement[] = [
  {
    id: 'border',
    name: `Border (${BORDER_WIDTH}")`,
    description: `Adds a ${BORDER_WIDTH}" border around the quilt edge`,
    defaultRole: 'border',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="2" stroke="#9C6A3A" strokeWidth="4" />
        <rect x="6" y="6" width="20" height="20" rx="1" stroke="#D0C8BF" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    ),
    createShape(fabric, x, y) {
      return new fabric.Rect({
        left: x,
        top: y,
        width: 120,
        height: 120,
        fill: 'rgba(156, 106, 58, 0.1)',
        stroke: '#9C6A3A',
        strokeWidth: 2,
        selectable: true,
        evented: true,
      });
    },
  },
  {
    id: 'edging',
    name: 'Edging',
    description: 'Outermost decorative edge (outside the border)',
    defaultRole: 'edging',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="1" y="1" width="30" height="30" rx="2" stroke="#6B7B8D" strokeWidth="2" strokeDasharray="4 2" />
        <rect x="4" y="4" width="24" height="24" rx="1" stroke="#9C6A3A" strokeWidth="2" />
        <rect x="7" y="7" width="18" height="18" rx="1" stroke="#D0C8BF" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    ),
    createShape(fabric, x, y) {
      return new fabric.Rect({
        left: x,
        top: y,
        width: 140,
        height: 140,
        fill: 'rgba(107, 123, 141, 0.08)',
        stroke: '#6B7B8D',
        strokeWidth: 2,
        strokeDashArray: [4, 2],
        selectable: true,
        evented: true,
      });
    },
  },
  {
    id: 'sashing',
    name: 'Sashing Strip',
    description: 'Spacer strip between blocks',
    defaultRole: 'sashing',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="12" width="24" height="8" rx="1" stroke="#B0A090" strokeWidth="1.5" fill="rgba(176,160,144,0.15)" />
      </svg>
    ),
    createShape(fabric, x, y) {
      return new fabric.Rect({
        left: x,
        top: y,
        width: 100,
        height: 20,
        fill: 'rgba(176, 160, 144, 0.12)',
        stroke: '#B0A090',
        strokeWidth: 1.5,
        selectable: true,
        evented: true,
      });
    },
  },
  {
    id: 'block-cell',
    name: 'Block Cell',
    description: 'Placeholder for a quilt block',
    defaultRole: 'block-cell',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" stroke="#4CAF50" strokeWidth="1.5" fill="rgba(76,175,80,0.08)" />
        <path d="M16 10V22M10 16H22" stroke="#4CAF50" strokeWidth="1" strokeOpacity="0.5" />
      </svg>
    ),
    createShape(fabric, x, y) {
      return new fabric.Rect({
        left: x,
        top: y,
        width: 80,
        height: 80,
        fill: 'rgba(76, 175, 80, 0.06)',
        stroke: '#4CAF50',
        strokeWidth: 1.5,
        strokeDashArray: [4, 2],
        selectable: true,
        evented: true,
      });
    },
  },
];
