'use client';

import { useEffect } from 'react';
import { gridPointToPixel } from '@/lib/blockbuilder-utils';
import { CANVAS } from '@/lib/design-system';
import type {
  DrawSegment,
  Patch,
  ArcSegment,
  Segment,
  BlockBuilderMode,
  SnapHelpers,
  SegmentHelpers,
  MinimalCanvas,
} from './types';

const SEAM_LINE_COLOR = CANVAS.seamLine;
const SEAM_LINE_WIDTH = 2;
const PENCIL_PREVIEW_COLOR = CANVAS.pencilPreview;

type AnyToolHook = {
  onMouseDown?: (
    pointer: { x: number; y: number },
    c: MinimalCanvas,
    ev?: MouseEvent
  ) => void | Promise<void>;
  onMouseMove?: (
    pointer: { x: number; y: number },
    c: MinimalCanvas,
    ev?: MouseEvent
  ) => void | Promise<void>;
  onMouseUp?: (
    pointer: { x: number; y: number },
    c: MinimalCanvas,
    ev?: MouseEvent
  ) => void | Promise<void>;
  onDoubleClick?: (c: MinimalCanvas) => void;
  onEscape?: (c: MinimalCanvas) => void;
} | null;

interface UseBlockBuilderCanvasOptions {
  draftCanvasRef: React.MutableRefObject<unknown>;
  isOpen: boolean;
  canvasSize: number;
  gridCols: number;
  gridRows: number;
  activeMode: BlockBuilderMode;
  segments: readonly DrawSegment[];
  patches: readonly Patch[];
  patchFills: Readonly<Record<string, string>>;
  selectedPatchId: string | null;
  snap: SnapHelpers;
  segs: SegmentHelpers;
  tools: Record<BlockBuilderMode, AnyToolHook>;
}

export function useBlockBuilderCanvas({
  draftCanvasRef,
  isOpen,
  canvasSize,
  gridCols,
  gridRows,
  activeMode,
  segments,
  patches,
  patchFills,
  selectedPatchId,
  snap,
  tools,
}: UseBlockBuilderCanvasOptions) {
  useEffect(() => {
    if (!isOpen) return;
    const canvas = draftCanvasRef.current as InstanceType<typeof import('fabric').Canvas> | null;
    if (!canvas) return;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    // In select mode the patches need to respond to clicks so the user can
    // highlight / manipulate them. In drawing modes they must stay inert so
    // the pencil / shape tools receive raw canvas events instead of fabric
    // forwarding them as object-level events.
    const isSelectMode = activeMode === 'select';

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted) return;
      const c = canvas as InstanceType<typeof fabric.Canvas>;
      const mc = c as unknown as MinimalCanvas;

      const toRemove = c.getObjects().filter((o) => {
        if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
        if ((o as unknown as { _isGridLine?: boolean })._isGridLine) return false;
        return true;
      });
      for (const obj of toRemove) c.remove(obj);

      for (let row = 0; row <= gridRows; row++) {
        const y = row * snap.gridSize;
        const line = new fabric.Line([0, y, canvasSize, y], {
          stroke: CANVAS.gridLine,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (line as unknown as { _isGridLine: boolean })._isGridLine = true;
        c.add(line);
      }
      for (let col = 0; col <= gridCols; col++) {
        const x = col * snap.gridSize;
        const line = new fabric.Line([x, 0, x, canvasSize], {
          stroke: CANVAS.gridLine,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (line as unknown as { _isGridLine: boolean })._isGridLine = true;
        c.add(line);
      }

      for (const patch of patches) {
        const pixelVerts = patch.vertices.map((v) => ({
          x: v.x * snap.gridSize,
          y: v.y * snap.gridSize,
        }));
        if (pixelVerts.length < 3) continue;
        const fabricId = patchFills[patch.id];
        const fill = fabricId ? `url(#fabric-${fabricId})` : 'transparent';
        const polygon = new fabric.Polygon(pixelVerts, {
          fill,
          stroke: 'transparent',
          strokeWidth: 0,
          selectable: false,
          evented: isSelectMode,
          hoverCursor: isSelectMode ? 'pointer' : 'crosshair',
        });
        c.add(polygon);
      }

      if (selectedPatchId) {
        const selectedPatch = patches.find((p) => p.id === selectedPatchId);
        if (selectedPatch) {
          const pixelVerts = selectedPatch.vertices.map((v) => ({
            x: v.x * snap.gridSize,
            y: v.y * snap.gridSize,
          }));
          if (pixelVerts.length >= 3) {
            const highlight = new fabric.Polygon(pixelVerts, {
              fill: 'transparent',
              stroke: PENCIL_PREVIEW_COLOR,
              strokeWidth: 2,
              selectable: false,
              evented: false,
            });
            c.add(highlight);
          }
        }
      }

      for (const seg of segments) {
        if ('center' in seg) {
          const arc = seg as ArcSegment;
          const fromPx = gridPointToPixel(arc.from, snap.gridSize);
          const toPx = gridPointToPixel(arc.to, snap.gridSize);
          const centerPx = gridPointToPixel(arc.center, snap.gridSize);
          const dx = fromPx.x - centerPx.x;
          const dy = fromPx.y - centerPx.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const sweepFlag = arc.clockwise ? 1 : 0;
          const pathObj = new fabric.Path(
            `M ${fromPx.x} ${fromPx.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${toPx.x} ${toPx.y}`,
            {
              fill: '',
              stroke: SEAM_LINE_COLOR,
              strokeWidth: SEAM_LINE_WIDTH,
              selectable: false,
              evented: false,
            }
          );
          c.add(pathObj);
        } else {
          const fromPx = gridPointToPixel((seg as Segment).from, snap.gridSize);
          const toPx = gridPointToPixel((seg as Segment).to, snap.gridSize);
          const line = new fabric.Line([fromPx.x, fromPx.y, toPx.x, toPx.y], {
            stroke: SEAM_LINE_COLOR,
            strokeWidth: SEAM_LINE_WIDTH,
            selectable: false,
            evented: false,
          });
          c.add(line);
        }
      }

      c.renderAll();
      // Fabric's built-in drag-to-select box is disabled — selection here is
      // managed by our own useSelectTool to keep the interaction deterministic.
      c.selection = false;
      c.defaultCursor =
        activeMode === 'bend'
          ? 'pointer'
          : activeMode === 'select'
            ? 'default'
            : 'crosshair';

      const activeTool = tools[activeMode];

      function onMouseDown(e: { e: MouseEvent }) {
        const pointer = c.getScenePoint(e.e);
        activeTool?.onMouseDown?.(pointer, mc, e.e);
      }
      function onMouseMove(e: { e: MouseEvent }) {
        const pointer = c.getScenePoint(e.e);
        activeTool?.onMouseMove?.(pointer, mc, e.e);
      }
      function onMouseUp(e: { e: MouseEvent }) {
        const pointer = c.getScenePoint(e.e);
        activeTool?.onMouseUp?.(pointer, mc, e.e);
      }
      function onDoubleClick() {
        activeTool?.onDoubleClick?.(mc);
      }
      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') activeTool?.onEscape?.(mc);
      }

      c.on('mouse:down', onMouseDown as never);
      c.on('mouse:move', onMouseMove as never);
      c.on('mouse:up', onMouseUp as never);
      c.on('mouse:dblclick', onDoubleClick as never);

      const canvasEl = c.getElement();
      canvasEl.addEventListener('keydown', onKeyDown);

      cleanup = () => {
        c.off('mouse:down', onMouseDown as never);
        c.off('mouse:move', onMouseMove as never);
        c.off('mouse:up', onMouseUp as never);
        c.off('mouse:dblclick', onDoubleClick as never);
        canvasEl.removeEventListener('keydown', onKeyDown);
      };
    })().catch(() => {});

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [
    isOpen,
    canvasSize,
    patches,
    patchFills,
    selectedPatchId,
    activeMode,
    snap,
    gridCols,
    gridRows,
    segments,
    tools,
  ]);
}
