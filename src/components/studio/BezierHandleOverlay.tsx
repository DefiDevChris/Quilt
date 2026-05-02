'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CubicSegment, Point } from '@/lib/easydraw-engine';
import { COLORS } from '@/lib/design-system';

const HANDLE_RADIUS = 5;
const HANDLE_HIT_RADIUS = 12;
const ANCHOR_RADIUS = 4;

interface BezierHandleOverlayProps {
  readonly segment: CubicSegment;
  readonly segmentPath: unknown;
  readonly onChange: (updated: CubicSegment) => void;
  readonly onClose: () => void;
}

export function BezierHandleOverlay({
  segment,
  segmentPath,
  onChange,
  onClose,
}: BezierHandleOverlayProps) {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const zoom = useCanvasStore((s) => s.zoom);
  const stateRef = useRef<{
    dragging: 'cp1' | 'cp2' | null;
    overlayObjects: unknown[];
  }>({
    dragging: null,
    overlayObjects: [],
  });

  const drawHandles = useCallback(async () => {
    if (!fabricCanvas) return;

    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

    stateRef.current.overlayObjects.forEach((obj) => {
      canvas.remove(obj as InstanceType<typeof fabric.FabricObject>);
    });
    stateRef.current.overlayObjects = [];

    const invZoom = 1 / Math.max(0.0001, zoom);
    const handleR = HANDLE_RADIUS * invZoom;
    const anchorR = ANCHOR_RADIUS * invZoom;
    const handleColor = COLORS.primary;
    const anchorColor = '#FFFFFF';
    const lineColor = COLORS.primary;

    const tangentLine1 = new fabric.Line(
      [segment.a.x, segment.a.y, segment.cp1.x, segment.cp1.y],
      {
        stroke: lineColor,
        strokeWidth: 1 * invZoom,
        strokeDashArray: [4 * invZoom, 3 * invZoom],
        selectable: false,
        evented: false,
      }
    );

    const tangentLine2 = new fabric.Line(
      [segment.b.x, segment.b.y, segment.cp2.x, segment.cp2.y],
      {
        stroke: lineColor,
        strokeWidth: 1 * invZoom,
        strokeDashArray: [4 * invZoom, 3 * invZoom],
        selectable: false,
        evented: false,
      }
    );

    const anchorA = new fabric.Circle({
      left: segment.a.x - anchorR,
      top: segment.a.y - anchorR,
      radius: anchorR,
      fill: anchorColor,
      stroke: handleColor,
      strokeWidth: 1.5 * invZoom,
      selectable: false,
      evented: false,
    });

    const anchorB = new fabric.Circle({
      left: segment.b.x - anchorR,
      top: segment.b.y - anchorR,
      radius: anchorR,
      fill: anchorColor,
      stroke: handleColor,
      strokeWidth: 1.5 * invZoom,
      selectable: false,
      evented: false,
    });

    const cp1Handle = new fabric.Circle({
      left: segment.cp1.x - handleR,
      top: segment.cp1.y - handleR,
      radius: handleR,
      fill: handleColor,
      stroke: '#FFFFFF',
      strokeWidth: 1.5 * invZoom,
      selectable: false,
      evented: true,
    });
    (cp1Handle as unknown as Record<string, unknown>).__handleType = 'cp1';

    const cp2Handle = new fabric.Circle({
      left: segment.cp2.x - handleR,
      top: segment.cp2.y - handleR,
      radius: handleR,
      fill: handleColor,
      stroke: '#FFFFFF',
      strokeWidth: 1.5 * invZoom,
      selectable: false,
      evented: true,
    });
    (cp2Handle as unknown as Record<string, unknown>).__handleType = 'cp2';

    const allObjects = [tangentLine1, tangentLine2, anchorA, anchorB, cp1Handle, cp2Handle];
    allObjects.forEach((obj) => {
      canvas.add(obj as InstanceType<typeof fabric.FabricObject>);
    });
    stateRef.current.overlayObjects = allObjects;

    canvas.renderAll();
  }, [fabricCanvas, segment, zoom]);

  useEffect(() => {
    drawHandles();
  }, [drawHandles]);

  useEffect(() => {
    if (!fabricCanvas) return;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted) return;
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      function getHandleType(obj: unknown): 'cp1' | 'cp2' | null {
        const o = obj as Record<string, unknown>;
        if (o.__handleType === 'cp1') return 'cp1';
        if (o.__handleType === 'cp2') return 'cp2';
        return null;
      }

      function onMouseDown(e: { e: MouseEvent }) {
        const target = canvas.findTarget(e.e);
        const handleType = getHandleType(target);
        if (handleType) {
          stateRef.current.dragging = handleType;
          canvas.defaultCursor = 'grabbing';
        }
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!stateRef.current.dragging) return;

        const pointer = canvas.getScenePoint(e.e);
        const handle = stateRef.current.dragging;
        const updated: CubicSegment = {
          ...segment,
          [handle]: { x: pointer.x, y: pointer.y },
        };

        onChange(updated);
      }

      function onMouseUp() {
        if (stateRef.current.dragging) {
          stateRef.current.dragging = null;
          canvas.defaultCursor = 'default';
        }
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          stateRef.current.dragging = null;
          onClose();
        }
      }

      function onSelectionCreated() {
        const active = canvas.getActiveObject();
        if (active && !getHandleType(active)) {
          onClose();
        }
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);
      window.addEventListener('keydown', onKeyDown);
      canvas.on('selection:created', onSelectionCreated as never);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        window.removeEventListener('keydown', onKeyDown);
        canvas.off('selection:created', onSelectionCreated as never);

        stateRef.current.overlayObjects.forEach((obj) => {
          canvas.remove(obj as InstanceType<typeof fabric.FabricObject>);
        });
        stateRef.current.overlayObjects = [];
        canvas.renderAll();
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, segment, onChange, onClose]);

  return null;
}
