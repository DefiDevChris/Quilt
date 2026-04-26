import type { Canvas } from 'fabric';

/**
 * Removes all fabric-swatch objects from a Fabric.js canvas.
 * Objects are identified by the custom `objectType: 'fabric-swatch'` property.
 */
export function clearCanvasFabrics(canvas: Canvas): void {
  const toRemove = canvas.getObjects().filter(
    (obj) => (obj as { objectType?: string }).objectType === 'fabric-swatch'
  );
  toRemove.forEach((obj) => canvas.remove(obj));
  canvas.requestRenderAll();
}
