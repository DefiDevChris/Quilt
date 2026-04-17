/**
 * Shared drop highlight utilities for fence-enforced drag-and-drop.
 * Used by useBlockDrop (blue) and useFabricDrop (green).
 */

const HIGHLIGHT_SHAPE_PROPS = {
  selectable: false,
  evented: false,
  hasControls: false,
  hasBorders: false,
} as const;

/**
 * Show a dashed highlight rectangle around a target fence area.
 * Returns the created rect so the caller can track it for later removal.
 */
export async function showDropHighlight(
  canvas: unknown,
  target: unknown,
  color: string
): Promise<import('fabric').FabricObject> {
  const fabric = await import('fabric');

  const canvasApi = canvas as unknown as {
    add: (...objs: unknown[]) => void;
    bringObjectToFront: (obj: unknown) => void;
    requestRenderAll: () => void;
  };

  const shapeData = target as {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    x?: number;
    y?: number;
    rotation?: number;
    points?: Array<{ x: number; y: number }>;
  };

  const shape = shapeData.points && shapeData.points.length >= 3
    ? new fabric.Polygon(shapeData.points, {
        fill: `${color}14`,
        stroke: color,
        strokeWidth: 2,
        strokeDashArray: [6, 4],
        ...HIGHLIGHT_SHAPE_PROPS,
      })
    : new fabric.Rect({
        left: shapeData.left ?? shapeData.x ?? 0,
        top: shapeData.top ?? shapeData.y ?? 0,
        width: (shapeData.width ?? 100) * (shapeData.scaleX ?? 1),
        height: (shapeData.height ?? 100) * (shapeData.scaleY ?? 1),
        angle: shapeData.angle ?? shapeData.rotation ?? 0,
        fill: `${color}14`,
        stroke: color,
        strokeWidth: 2,
        strokeDashArray: [6, 4],
        ...HIGHLIGHT_SHAPE_PROPS,
      });

  (shape as unknown as Record<string, unknown>)['_dragHighlight'] = true;
  canvasApi.add(shape as unknown as import('fabric').FabricObject);
  canvasApi.bringObjectToFront(shape as unknown as import('fabric').FabricObject);
  canvasApi.requestRenderAll();

  return shape as unknown as import('fabric').FabricObject;
}

/**
 * Remove a previously shown drop highlight rect from the canvas.
 */
export function clearDropHighlight(canvas: unknown, highlightRect: unknown): void {
  if (!highlightRect || !canvas) return;
  const canvasApi = canvas as unknown as {
    remove: (...objs: unknown[]) => void;
    requestRenderAll: () => void;
  };
  canvasApi.remove(highlightRect as unknown as import('fabric').FabricObject);
  canvasApi.requestRenderAll();
}
