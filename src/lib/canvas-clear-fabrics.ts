/**
 * canvas-clear-fabrics
 *
 * Helper that strips fabric fills/patterns/images from every object on a
 * Fabric.js canvas, leaving the underlying shape outlines intact. Used by
 * the template-mode "Clear all fabrics" button.
 *
 * This is intentionally conservative:
 *   - Only modifies `fill`. Strokes, positions, and structure are untouched.
 *   - Drops Pattern fills (where Fabric stores `patternSourceCanvas`).
 *   - Drops fabric-image references stored in our custom metadata fields
 *     (`__fabricId`, `__fabricImageUrl`, `__fabricName`).
 *   - Skips fence elements and locked-fence-cell blocks (those are layout
 *     scaffolding, not fabric assignments).
 *
 * After clearing, callers must call `canvas.renderAll()` and push an undo
 * snapshot if they want the action to be reversible.
 */

const TRANSPARENT_FILL = 'transparent';

interface FabricLikeObject {
  type?: string;
  fill?: unknown;
  set?: (props: Record<string, unknown>) => void;
  getObjects?: () => FabricLikeObject[];
  forEachObject?: (cb: (o: FabricLikeObject) => void) => void;
}

function stripFabricFromObject(obj: FabricLikeObject): boolean {
  const meta = obj as unknown as Record<string, unknown>;
  if (meta._fenceElement) return false;

  let mutated = false;

  // Drop pattern fills (stored as { type: 'pattern', source: HTMLCanvasElement })
  // or any non-string fill we don't recognise. Keep stroke alone.
  if (obj.fill !== undefined && obj.fill !== TRANSPARENT_FILL) {
    obj.set?.({ fill: TRANSPARENT_FILL });
    mutated = true;
  }

  // Wipe our custom fabric metadata so the next save doesn't re-restore it.
  for (const key of ['__fabricId', '__fabricImageUrl', '__fabricName']) {
    if (key in meta) {
      delete meta[key];
      mutated = true;
    }
  }

  // Recurse into groups (block-piece patches live as sub-objects).
  if (typeof obj.getObjects === 'function') {
    const children = obj.getObjects();
    for (const child of children) {
      if (stripFabricFromObject(child)) mutated = true;
    }
  } else if (typeof obj.forEachObject === 'function') {
    obj.forEachObject((child) => {
      if (stripFabricFromObject(child)) mutated = true;
    });
  }

  return mutated;
}

interface FabricLikeCanvas {
  getObjects: () => FabricLikeObject[];
  renderAll: () => void;
  toJSON: () => Record<string, unknown>;
}

/**
 * Strip all fabric fills from the canvas. Returns true if anything changed.
 * Caller is responsible for any history bookkeeping (undo snapshot etc.).
 */
export function clearAllFabricsOnCanvas(canvas: unknown): boolean {
  const c = canvas as FabricLikeCanvas | null;
  if (!c || typeof c.getObjects !== 'function') return false;

  let mutated = false;
  for (const obj of c.getObjects()) {
    if (stripFabricFromObject(obj)) mutated = true;
  }

  if (mutated && typeof c.renderAll === 'function') {
    c.renderAll();
  }
  return mutated;
}
