'use client';

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { Canvas as FabricCanvas, FabricObject } from 'fabric';

interface Guide {
  type: 'vertical' | 'horizontal';
  position: number;
  label?: string;
}

export function SmartGuides() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const [guides, setGuides] = useState<Guide[]>([]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const canvas = fabricCanvas as FabricCanvas;
    const SNAP_THRESHOLD = 5; // pixels

    const handleObjectMoving = (e: { target: FabricObject }) => {
      const obj = e.target;
      if (!obj) return;

      const objBounds = obj.getBoundingRect();
      const objCenterX = objBounds.left + objBounds.width / 2;
      const objCenterY = objBounds.top + objBounds.height / 2;

      const newGuides: Guide[] = [];
      const objects = canvas.getObjects().filter((o) => o !== obj && o.visible);

      for (const other of objects) {
        const otherBounds = other.getBoundingRect();
        const otherCenterX = otherBounds.left + otherBounds.width / 2;
        const otherCenterY = otherBounds.top + otherBounds.height / 2;

        // Vertical alignment (left, center, right)
        if (Math.abs(objBounds.left - otherBounds.left) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: otherBounds.left });
          obj.set({ left: otherBounds.left });
        } else if (Math.abs(objBounds.left + objBounds.width - (otherBounds.left + otherBounds.width)) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: otherBounds.left + otherBounds.width });
          obj.set({ left: otherBounds.left + otherBounds.width - objBounds.width });
        } else if (Math.abs(objCenterX - otherCenterX) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: otherCenterX });
          obj.set({ left: obj.left! + (otherCenterX - objCenterX) });
        }

        // Horizontal alignment (top, middle, bottom)
        if (Math.abs(objBounds.top - otherBounds.top) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: otherBounds.top });
          obj.set({ top: otherBounds.top });
        } else if (Math.abs(objBounds.top + objBounds.height - (otherBounds.top + otherBounds.height)) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: otherBounds.top + otherBounds.height });
          obj.set({ top: otherBounds.top + otherBounds.height - objBounds.height });
        } else if (Math.abs(objCenterY - otherCenterY) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: otherCenterY });
          obj.set({ top: obj.top! + (otherCenterY - objCenterY) });
        }
      }

      setGuides(newGuides);
      obj.setCoords();
    };

    const handleObjectModified = () => {
      setGuides([]);
    };

    canvas.on('object:moving', handleObjectMoving);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:cleared', handleObjectModified);

    return () => {
      canvas.off('object:moving', handleObjectMoving);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('selection:cleared', handleObjectModified);
    };
  }, [fabricCanvas]);

  if (!fabricCanvas || guides.length === 0) return null;

  const canvas = fabricCanvas as FabricCanvas;
  const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
  const zoom = vpt[0];

  return (
    <div className="pointer-events-none absolute inset-0">
      {guides.map((guide, i) => {
        if (guide.type === 'vertical') {
          return (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-primary/60"
              style={{
                left: `${guide.position * zoom + vpt[4]}px`,
              }}
            />
          );
        } else {
          return (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-primary/60"
              style={{
                top: `${guide.position * zoom + vpt[5]}px`,
              }}
            />
          );
        }
      })}
    </div>
  );
}
