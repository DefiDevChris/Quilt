'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '@/types/project';

import { useCanvasStore } from '@/stores/canvasStore';
import { STANDARD_BLOCK_SIZES } from '@/lib/quilt-sizing';
import { LayoutBuilderToolbar } from '@/components/studio/layout-builder/LayoutBuilderToolbar';
import { BlockBuilderRightPanel } from '@/components/studio/block-builder/BlockBuilderRightPanel';

import { BottomBar } from '@/components/studio/BottomBar';
import { ContextMenu } from '@/components/canvas/ContextMenu';
import { QuickInfo } from '@/components/canvas/QuickInfo';

interface BlockBuilderShellProps {
  readonly project: Project;
  readonly onDone: () => void;
}

type BuilderTool = 'select' | 'draw' | 'rectangle' | 'triangle' | 'pan';

/**
 * Block Builder — a canvas where users draw/design individual quilt block
 * pieces.  All shapes placed on the canvas become part of a single block
 * group.  When saved, the group is stored as a user block and becomes
 * available in the block library for dragging into block cells.
 *
 * Left toolbar (88px): Select, Pan, Draw, Rectangle, Triangle
 * Center: canvas with reference grid
 * Right panel (320px): TOP = Block Library (system blocks for reference),
 *   BOTTOM = Block Info (name, save button)
 *
 * No role assignments — every shape is just a block piece.
 */
export function BlockBuilderShell({ project, onDone }: BlockBuilderShellProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<unknown>(null);
  const [activeTool, setActiveTool] = useState<BuilderTool>('select');
  const [selectedObject, setSelectedObject] = useState<object | null>(null);
  const [blockName, setBlockName] = useState('');
  const [blockSize, setBlockSize] = useState(12);
  const isDrawingRef = useRef(false);
  const drawStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempShapeRef = useRef<unknown | null>(null);

  // Grid cell size from project settings, or default
  const gridCellSize = project.gridSettings?.size ?? 1;

  // Canvas size in pixels — derived from block size so the grid
  // accurately represents the finished block dimensions.
  const PIXELS_PER_INCH = 32;
  const canvasPx = blockSize * PIXELS_PER_INCH;

  // Initialize Fabric canvas
  useEffect(() => {
    const canvasEl = canvasElRef.current;
    if (!canvasEl) return;

    let cancelled = false;

    async function init() {
      const fabric = await import('fabric');
      if (cancelled) return;
      if (!canvasEl) return;

      const { width: elW, height: elH } = canvasEl.getBoundingClientRect();
      // Use the smaller of the container size or the computed block canvas size
      const size = Math.min(elW, elH, canvasPx);
      const fabricCanvas = new fabric.Canvas(canvasEl, {
        width: size,
        height: size,
        backgroundColor: '#F8F7F5',
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = fabricCanvas;
      useCanvasStore.getState().setFabricCanvas(
        fabricCanvas as unknown as InstanceType<typeof fabric.Canvas>
      );

      // Draw reference grid
      const canvasW = fabricCanvas.getWidth();
      const canvasH = fabricCanvas.getHeight();
      const gridLines: unknown[] = [];
      for (let x = 0; x <= canvasW; x += gridCellSize) {
        const line = new fabric.Line([x, 0, x, canvasH], {
          stroke: '#E5E2DD',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (line as unknown as Record<string, unknown>)['_blockBuilderGridElement'] = true;
        gridLines.push(line);
      }
      for (let y = 0; y <= canvasH; y += gridCellSize) {
        const line = new fabric.Line([0, y, canvasW, y], {
          stroke: '#E5E2DD',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (line as unknown as Record<string, unknown>)['_blockBuilderGridElement'] = true;
        gridLines.push(line);
      }
      gridLines.forEach((l) => fabricCanvas.add(l as Parameters<typeof fabricCanvas.add>[0]));

      // Events
      fabricCanvas.on('selection:created', (e) => {
        const obj = e.selected?.[0] ?? null;
        if (obj && !(obj as unknown as Record<string, unknown>)['_blockBuilderGridElement']) {
          setSelectedObject(obj);
        }
      });
      fabricCanvas.on('selection:updated', (e) => {
        const obj = e.selected?.[0] ?? null;
        if (obj && !(obj as unknown as Record<string, unknown>)['_blockBuilderGridElement']) {
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
        }
      });

      fabricCanvas.on('mouse:up', (opt) => {
        if (!isDrawingRef.current || !drawStartPointRef.current) return;
        isDrawingRef.current = false;
        const fc = fabricCanvas as unknown as { getPointer: (e: import('fabric').TPointerEvent) => { x: number; y: number } };
        const pointer = fc.getPointer(opt.e!);
        const start = drawStartPointRef.current;
        drawStartPointRef.current = null;

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
              fill: 'rgba(100, 100, 100, 0.15)',
              stroke: '#333',
              strokeWidth: 1.5,
              selectable: true,
              evented: true,
            });
            (rect as unknown as Record<string, unknown>)['_blockBuilderShape'] = true;
            fabricCanvas.add(rect as Parameters<typeof fabricCanvas.add>[0]);
            fabricCanvas.setActiveObject(rect as Parameters<typeof fabricCanvas.setActiveObject>[0]);
            fabricCanvas.renderAll();
          }
        } else if (activeTool === 'triangle') {
          if (Math.abs(pointer.x - start.x) > 3 && Math.abs(pointer.y - start.y) > 3) {
            const triangle = new fabric.Triangle({
              left: Math.min(start.x, pointer.x),
              top: Math.min(start.y, pointer.y),
              width: Math.abs(pointer.x - start.x),
              height: Math.abs(pointer.y - start.y),
              fill: 'rgba(100, 100, 100, 0.15)',
              stroke: '#333',
              strokeWidth: 1.5,
              selectable: true,
              evented: true,
            });
            (triangle as unknown as Record<string, unknown>)['_blockBuilderShape'] = true;
            fabricCanvas.add(triangle as Parameters<typeof fabricCanvas.add>[0]);
            fabricCanvas.setActiveObject(triangle as Parameters<typeof fabricCanvas.setActiveObject>[0]);
            fabricCanvas.renderAll();
          }
        } else if (activeTool === 'draw') {
          const pathData = `M ${start.x} ${start.y} L ${pointer.x} ${pointer.y}`;
          const path = new fabric.Path(pathData, {
            fill: '',
            stroke: '#333',
            strokeWidth: 2,
            selectable: true,
            evented: true,
          });
          (path as unknown as Record<string, unknown>)['_blockBuilderShape'] = true;
          fabricCanvas.add(path as Parameters<typeof fabricCanvas.add>[0]);
          fabricCanvas.renderAll();
        }

        // Switch back to select after drawing
        setActiveTool('select');
      });

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
    return () => { cancelled = true; };
  }, [gridCellSize, blockSize, canvasPx]);

  // Sync activeTool state to mouse event handlers via ref
  const activeToolRef = useRef(activeTool);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  // Delete selected shape
  const handleDeleteShape = useCallback(() => {
    if (!selectedObject) return;
    const fc = fabricCanvasRef.current as { remove: (obj: unknown) => void; renderAll: () => void } | null;
    fc?.remove(selectedObject);
    fc?.renderAll();
    setSelectedObject(null);
  }, [selectedObject]);

  // Clear all shapes
  const handleClearAll = useCallback(() => {
    const fc = fabricCanvasRef.current as { getObjects: () => unknown[]; remove: (obj: unknown) => void; renderAll: () => void } | null;
    if (!fc) return;
    const objects = fc.getObjects().filter((o) =>
      (o as unknown as Record<string, unknown>)['_blockBuilderShape']
    );
    objects.forEach((o) => fc.remove(o));
    fc.renderAll();
    setSelectedObject(null);
  }, []);

  // Save block — group all shapes and store as a user block
  const handleSaveBlock = useCallback(async () => {
    const fc = fabricCanvasRef.current as {
      getObjects: () => unknown[];
    } | null;
    if (!fc) return;

    const shapes = fc.getObjects().filter((o) =>
      (o as unknown as Record<string, unknown>)['_blockBuilderShape']
    );

    if (shapes.length === 0) return;

    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: blockName.trim() || 'My Block',
          category: 'Custom',
          tags: [],
          blockWidthIn: blockSize,
          blockHeightIn: blockSize,
          // Serialize the shapes as JSON for storage
          fabricJsData: {
            type: 'custom-block',
            shapes: shapes.map((s) => {
              const rec = s as unknown as Record<string, unknown>;
              return {
                type: rec['type'] ?? 'rect',
                left: rec['left'] ?? 0,
                top: rec['top'] ?? 0,
                width: rec['width'] ?? 100,
                height: rec['height'] ?? 100,
                fill: rec['fill'] ?? 'rgba(100,100,100,0.15)',
                stroke: rec['stroke'] ?? '#333',
              };
            }),
          },
        }),
      });

      if (!res.ok) {
        console.error('Failed to save block');
        return;
      }

      onDone();
    } catch {
      console.error('Failed to save block');
    }
  }, [blockName, blockSize, onDone]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left toolbar */}
      <LayoutBuilderToolbar activeTool={activeTool} onToolChange={setActiveTool} />

      {/* Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 relative">
          {/* "Done" button overlay */}
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <button
              type="button"
              onClick={onDone}
              className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-medium text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              ← Back to Worktable
            </button>
            <button
              type="button"
              onClick={handleDeleteShape}
              disabled={!selectedObject}
              className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 transition-colors"
            >
              Clear All
            </button>
          </div>
          <canvas ref={canvasElRef} className="w-full h-full block" />
        </div>
        <ContextMenu />
        <QuickInfo />
      </div>

      {/* Right panel */}
      <BlockBuilderRightPanel
        blockName={blockName}
        onBlockNameChange={setBlockName}
        blockSize={blockSize}
        onBlockSizeChange={setBlockSize}
        onSave={handleSaveBlock}
        selectedObject={selectedObject}
        fabricCanvasRef={fabricCanvasRef}
      />

      <BottomBar />
    </div>
  );
}
