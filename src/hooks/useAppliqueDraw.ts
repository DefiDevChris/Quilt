'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type AppliqueLayer,
  type ShapeType,
  createLayer,
  createBackgroundLayer,
  bringForward,
  sendBackward,
} from '@/lib/applique-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAppliqueDrawOptions {
  draftCanvasRef: React.MutableRefObject<unknown>;
  isOpen: boolean;
  fillColor: string;
  strokeColor: string;
  canvasSize: number;
}

export interface UseAppliqueDrawReturn {
  layers: readonly AppliqueLayer[];
  addShape: (shapeType: ShapeType) => void;
  moveForward: (layerId: string) => void;
  moveBackward: (layerId: string) => void;
  removeLayer: (layerId: string) => void;
  setLayerFill: (layerId: string, fill: string) => void;
}

// ---------------------------------------------------------------------------
// Shape defaults
// ---------------------------------------------------------------------------

const DEFAULT_SHAPE_SIZE = 80;

function shapeLabel(type: ShapeType): string {
  switch (type) {
    case 'circle':
      return 'Circle';
    case 'oval':
      return 'Oval';
    case 'heart':
      return 'Heart';
    case 'leaf':
      return 'Leaf';
    case 'teardrop':
      return 'Teardrop';
    case 'freeform':
      return 'Freeform';
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAppliqueDraw({
  draftCanvasRef,
  isOpen,
  fillColor,
  strokeColor,
  canvasSize,
}: UseAppliqueDrawOptions): UseAppliqueDrawReturn {
  const [layers, setLayers] = useState<AppliqueLayer[]>(() => [
    createBackgroundLayer(canvasSize, canvasSize, '#FFFFFF'),
  ]);

  // Track the previous sync to avoid redundant canvas updates
  const prevLayersRef = useRef<readonly AppliqueLayer[]>(layers);

  // Reset layers when the panel opens
  useEffect(() => {
    if (isOpen) {
      const initial = [createBackgroundLayer(canvasSize, canvasSize, '#FFFFFF')];
      setLayers(initial);
      prevLayersRef.current = initial;
    }
  }, [isOpen, canvasSize]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const addShape = useCallback(
    (shapeType: ShapeType) => {
      const cx = canvasSize / 2;
      const cy = canvasSize / 2;
      const id = crypto.randomUUID();

      setLayers((prev) => {
        const zIndex = prev.length;
        const layer = createLayer(id, shapeType, cx, cy, DEFAULT_SHAPE_SIZE, fillColor, zIndex);
        return [...prev, layer];
      });
    },
    [canvasSize, fillColor]
  );

  const moveForward = useCallback((layerId: string) => {
    setLayers((prev) => bringForward(prev, layerId));
  }, []);

  const moveBackward = useCallback((layerId: string) => {
    setLayers((prev) => sendBackward(prev, layerId));
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    if (layerId === 'background') return;
    setLayers((prev) => {
      const filtered = prev.filter((l) => l.id !== layerId);
      return filtered.map((l, i) => ({ ...l, zIndex: i }));
    });
  }, []);

  const setLayerFill = useCallback((layerId: string, fill: string) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, fill } : l)));
  }, []);

  // -----------------------------------------------------------------------
  // Sync layers to Fabric.js canvas
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen || !draftCanvasRef.current) return;

    let cancelled = false;

    (async () => {
      const fabric = await import('fabric');
      if (cancelled || !draftCanvasRef.current) return;

      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      // Remove previous applique objects (tagged with _appliqueId)
      const existing = canvas
        .getObjects()
        .filter((obj) => (obj as unknown as Record<string, unknown>)._appliqueId);

      for (const obj of existing) {
        canvas.remove(obj);
      }

      // Render each non-background layer as a Fabric.js Path
      const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

      for (const layer of sortedLayers) {
        if (!layer.pathData) continue;

        const path = new fabric.Path(layer.pathData, {
          fill: layer.fill,
          stroke: layer.id === 'background' ? 'transparent' : strokeColor,
          strokeWidth: layer.id === 'background' ? 0 : 1,
          selectable: layer.id !== 'background',
          evented: layer.id !== 'background',
          originX: 'center',
          originY: 'center',
          left: canvasSize / 2 + layer.transform.x,
          top: canvasSize / 2 + layer.transform.y,
          angle: layer.transform.rotation,
          scaleX: layer.transform.scaleX,
          scaleY: layer.transform.scaleY,
        });

        // Tag the object so we can identify it during sync
        (path as unknown as Record<string, unknown>)._appliqueId = layer.id;
        (path as unknown as Record<string, unknown>)._appliqueLabel = shapeLabel(layer.shapeType);

        canvas.add(path);
      }

      canvas.renderAll();
      prevLayersRef.current = layers;
    })();

    return () => {
      cancelled = true;
    };
  }, [layers, isOpen, draftCanvasRef, strokeColor, canvasSize]);

  return {
    layers,
    addShape,
    moveForward,
    moveBackward,
    removeLayer,
    setLayerFill,
  };
}
