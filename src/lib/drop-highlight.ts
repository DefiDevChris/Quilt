/**
 * Shared drop highlight utilities for fence-enforced drag-and-drop.
 * Used by useBlockDrop (blue) and useFabricDrop (green).
 */

const HIGHLIGHT_RECT_PROPS = {
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

  const fabricObj = target as unknown as import('fabric').FabricObject;
  const x = fabricObj.left ?? 0;
  const y = fabricObj.top ?? 0;
  const w = (fabricObj.width ?? 100) * (fabricObj.scaleX ?? 1);
  const h = (fabricObj.height ?? 100) * (fabricObj.scaleY ?? 1);

  const rect = new fabric.Rect({
    left: x,
    top: y,
    width: w,
    height: h,
    fill: `${color}14`, // ~8% opacity hex
    stroke: color,
    strokeWidth: 2,
    strokeDashArray: [6, 4],
    ...HIGHLIGHT_RECT_PROPS,
  });

  (rect as unknown as Record<string, unknown>)['_dragHighlight'] = true;
  canvasApi.add(rect as unknown as import('fabric').FabricObject);
  canvasApi.bringObjectToFront(rect as unknown as import('fabric').FabricObject);
  canvasApi.requestRenderAll();

  return rect as unknown as import('fabric').FabricObject;
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
