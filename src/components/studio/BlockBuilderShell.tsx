'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '@/types/project';

import { useCanvasStore } from '@/stores/canvasStore';
import { STANDARD_BLOCK_SIZES } from '@/lib/quilt-sizing';
import { BlockBuilderRightPanel, BLOCK_PIECES } from '@/components/studio/block-builder/BlockBuilderRightPanel';

import { ContextMenu } from '@/components/canvas/ContextMenu';
import { QuickInfo } from '@/components/canvas/QuickInfo';

interface BlockBuilderShellProps {
  readonly project: Project;
  readonly onDone: () => void;
}

type BuilderTool = 'select' | 'pan' | 'draw-rect' | 'triangle';

/**
 * Block Builder — full worktable-style layout for designing custom quilt blocks.
 *
 * Left toolbar (single column, ~72px): Select, Pan, Draw Rectangle, Triangle
 * Center: Canvas with floating action bar (Back, Delete, Clear All)
 * Right panel (320px): Block Info / Block Library tabs
 *
 * No bottom bar, no bottom status bar — clean canvas-focused layout.
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

  // Canvas size in pixels — derived from block size
  const PIXELS_PER_INCH = 32;
  const canvasPx = blockSize * PIXELS_PER_INCH;

  // Grid cell size from project settings
  const gridCellSize = project.gridSettings?.size ?? 1;

  // Initialize Fabric canvas
  useEffect(() => {
    const canvasEl = canvasElRef.current;
    if (!canvasEl) return;

    let cancelled = false;

    async function init() {
      const fabric = await import('fabric');
      if (cancelled) return;
      if (!canvasEl) return;

      const fabricCanvas = new fabric.Canvas(canvasEl, {
        backgroundColor: '#F0EDE8',
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

      // Selection events
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

      // Mouse events for drawing
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

        if (activeTool === 'draw-rect') {
          const w = pointer.x - start.x;
          const h = pointer.y - start.y;
          const rect = new fabric.Rect({
            left: w > 0 ? start.x : pointer.x,
            top: h > 0 ? start.y : pointer.y,
            width: Math.abs(w),
            height: Math.abs(h),
            fill: 'rgba(100, 100, 100, 0.12)',
            stroke: '#333',
            strokeWidth: 1.5,
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
            fill: 'rgba(100, 100, 100, 0.12)',
            stroke: '#333',
            strokeWidth: 1.5,
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

        if (activeTool === 'draw-rect') {
          const w = pointer.x - start.x;
          const h = pointer.y - start.y;
          if (Math.abs(w) > 3 && Math.abs(h) > 3) {
            const rect = new fabric.Rect({
              left: w > 0 ? start.x : pointer.x,
              top: h > 0 ? start.y : pointer.y,
              width: Math.abs(w),
              height: Math.abs(h),
              fill: 'rgba(100, 100, 100, 0.12)',
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
              fill: 'rgba(100, 100, 100, 0.12)',
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
        }

        setActiveTool('select');
      });

      const ro = new ResizeObserver(() => {
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
  }, [blockSize, canvasPx, gridCellSize]);

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

  // Save block
  const handleSaveBlock = useCallback(async () => {
    const fc = fabricCanvasRef.current as { getObjects: () => unknown[] } | null;
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
                fill: rec['fill'] ?? 'rgba(100,100,100,0.12)',
                stroke: rec['stroke'] ?? '#333',
              };
            }),
          },
        }),
      });
      if (!res.ok) { console.error('Failed to save block'); return; }
      onDone();
    } catch {
      console.error('Failed to save block');
    }
  }, [blockName, blockSize, onDone]);

  // Handle canvas drag-and-drop
  const handleCanvasDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const pieceId = e.dataTransfer.getData('application/quiltcorgi-block-piece');
    if (!pieceId) return;

    try {
      const fabric = await import('fabric');
      const fc = fabricCanvasRef.current;
      if (!fc) return;

      const canvasW = (fc as { getWidth: () => number }).getWidth();
      const piece = BLOCK_PIECES.find((p) => p.id === pieceId);
      if (!piece) return;

      // Get drop position relative to the canvas container
      const canvasEl = canvasElRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const shape = piece.createShape(fabric, canvasW / 2) as Record<string, unknown>;
      // Position shape at drop point
      shape['left'] = x;
      shape['top'] = y;
      shape['_blockBuilderShape'] = true;

      const canvas = fc as { add: (obj: unknown) => void; renderAll: () => void };
      canvas.add(shape);
      canvas.renderAll();
    } catch (err) {
      console.error('Failed to drop piece:', err);
    }
  }, []);

  const activeToolRef = useRef(activeTool);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  return (
    <div className="flex-1 flex overflow-hidden bg-surface">
      {/* ── Left Toolbar (single column) ──────────────────────────── */}
      <div className="w-[72px] h-full flex-shrink-0 bg-white/60 backdrop-blur-xl border-r border-white/40 flex flex-col items-center py-3 gap-1 overflow-y-auto">
        <ToolButton
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 3L4 15L8 11L12 17L14 15.5L10 10L15 10L4 3Z" fill="currentColor" />
            </svg>
          }
          label="Select"
        />
        <ToolButton
          active={activeTool === 'pan'}
          onClick={() => setActiveTool('pan')}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3V7M10 13V17M3 10H7M13 10H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M10 3L7.5 5.5M10 3L12.5 5.5M10 17L7.5 14.5M10 17L12.5 14.5M3 10L5.5 7.5M3 10L5.5 12.5M17 10L14.5 7.5M17 10L14.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          label="Pan"
        />
        <ToolButton
          active={activeTool === 'draw-rect'}
          onClick={() => setActiveTool('draw-rect')}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="5" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          }
          label="Rectangle"
        />
        <ToolButton
          active={activeTool === 'triangle'}
          onClick={() => setActiveTool('triangle')}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3L17 16H3L10 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          }
          label="Triangle"
        />
      </div>

      {/* ── Canvas Area ───────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col overflow-hidden relative"
        onDrop={handleCanvasDrop}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      >
        {/* Floating action bar */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={onDone}
            className="rounded-full bg-surface-container/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors border border-outline-variant/30"
          >
            ← Back to Worktable
          </button>
          <button
            type="button"
            onClick={handleDeleteShape}
            disabled={!selectedObject}
            className="rounded-full bg-surface-container/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-outline-variant/30"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-full bg-surface-container/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 transition-colors border border-outline-variant/30"
          >
            Clear All
          </button>
        </div>

        {/* Canvas centered */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            className="relative rounded-lg overflow-hidden shadow-elevation-2 border border-outline-variant/30"
            style={{ width: canvasPx, height: canvasPx }}
          >
            <canvas
              ref={canvasElRef}
              width={canvasPx}
              height={canvasPx}
              className="block"
            />
          </div>
        </div>

        <ContextMenu />
        <QuickInfo />
      </div>

      {/* ── Right Panel ───────────────────────────────────────────── */}
      <BlockBuilderRightPanel
        blockName={blockName}
        onBlockNameChange={setBlockName}
        blockSize={blockSize}
        onBlockSizeChange={setBlockSize}
        onSave={handleSaveBlock}
        selectedObject={selectedObject}
      />
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  icon,
  label,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly icon: React.ReactNode;
  readonly label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl text-[10px] leading-tight transition-all ${active
        ? 'bg-primary text-white shadow-elevation-1'
        : 'text-secondary hover:bg-surface-container hover:text-on-surface'
        }`}
      title={label}
    >
      <span className="mb-0.5">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
