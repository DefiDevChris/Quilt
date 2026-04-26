/**
 * clearCanvasFabrics
 *
 * Strips all fabric fills from a Fabric.js canvas, leaving just the bare
 * shape outlines on a clean white background. Used by the "Clear all
 * fabrics" action in template mode (per the design studio spec, templates
 * ship with bundled fabrics that the user can reset to start over).
 *
 * What gets cleared:
 *   - `fill` properties on every patch object (set to white)
 *   - `backgroundColor` on the canvas itself (reset to white)
 *   - any custom `__fabricId` metadata on objects
 *
 * What is preserved:
 *   - Shape outlines (`stroke`), positions, sizes
 *   - Object stacking order
 *   - The fence overlay (rendered separately by the fence renderer)
 */

const WHITE = '#ffffff';

interface FabricObjectLike {
  fill?: unknown;
  set?: (key: string, value: unknown) => void;
  __fabricId?: string | null;
  // Mark applied via the fabric pattern flow (for filters / future cleanup).
  __isPatternFill?: boolean;
}

interface FabricCanvasLike {
  getObjects: () => FabricObjectLike[];
  backgroundColor?: string;
  renderAll: () => void;
}

export function clearCanvasFabrics(canvas: unknown): void {
  if (!canvas) return;
  const fabricCanvas = canvas as FabricCanvasLike;
  if (typeof fabricCanvas.getObjects !== 'function') return;

  const objects = fabricCanvas.getObjects();
  for (const obj of objects) {
    if (obj.set) {
      obj.set('fill', WHITE);
    } else {
      obj.fill = WHITE;
    }
    if ('__fabricId' in obj) obj.__fabricId = null;
    if ('__isPatternFill' in obj) obj.__isPatternFill = false;
  }
  fabricCanvas.backgroundColor = WHITE;
  fabricCanvas.renderAll();
}
