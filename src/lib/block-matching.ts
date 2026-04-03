/**
 * Block Matching Utilities
 *
 * Identifies "same block" groups on the canvas by comparing Group structure:
 * child count, child types, stroke colors, relative positions, and dimensions.
 * Used for bulk operations like "Apply Fabric to All Same Blocks".
 */

export interface BlockSignature {
  childCount: number;
  children: Array<{
    type: string;
    hasStroke: boolean;
    strokeColor: string | null;
    relPos: { x: number; y: number };
    relSize: { w: number; h: number };
  }>;
}

/**
 * Build a structural signature for a Group object.
 * Normalizes child positions relative to group center so that
 * blocks at different canvas positions still match.
 */
export function getBlockSignature(group: unknown): BlockSignature | null {
  const g = group as Record<string, unknown>;
  if (g.type !== 'group') return null;

  const objects = (g as unknown as { getObjects?: () => unknown[] }).getObjects?.();
  if (!objects || objects.length === 0) return null;

  const width = (g.width as number) ?? 1;
  const height = (g.height as number) ?? 1;
  const scaleX = (g.scaleX as number) ?? 1;
  const scaleY = (g.scaleY as number) ?? 1;

  const children = objects.map((child: unknown) => {
    const c = child as Record<string, unknown>;
    const cType = (c.type as string) || 'unknown';
    const cStroke = c.stroke as string | undefined;
    const cWidth = ((c.width as number) ?? 0) * ((c.scaleX as number) ?? 1);
    const cHeight = ((c.height as number) ?? 0) * ((c.scaleY as number) ?? 1);
    const cLeft = (c.left as number) ?? 0;
    const cTop = (c.top as number) ?? 0;

    return {
      type: cType,
      hasStroke: cStroke !== undefined && cStroke !== '',
      strokeColor: cStroke || null,
      relPos: {
        x: Math.round((cLeft / (width * scaleX)) * 100) / 100,
        y: Math.round((cTop / (height * scaleY)) * 100) / 100,
      },
      relSize: {
        w: Math.round((cWidth / (width * scaleX)) * 100) / 100,
        h: Math.round((cHeight / (height * scaleY)) * 100) / 100,
      },
    };
  });

  return { childCount: children.length, children };
}

/**
 * Compare two block signatures for structural equality.
 */
export function signaturesMatch(a: BlockSignature, b: BlockSignature): boolean {
  if (a.childCount !== b.childCount) return false;
  if (a.children.length !== b.children.length) return false;

  for (let i = 0; i < a.children.length; i++) {
    const ca = a.children[i];
    const cb = b.children[i];
    if (ca.type !== cb.type) return false;
    if (ca.hasStroke !== cb.hasStroke) return false;
    if (ca.strokeColor !== cb.strokeColor) return false;
    if (Math.abs(ca.relPos.x - cb.relPos.x) > 0.02) return false;
    if (Math.abs(ca.relPos.y - cb.relPos.y) > 0.02) return false;
    if (Math.abs(ca.relSize.w - cb.relSize.w) > 0.05) return false;
    if (Math.abs(ca.relSize.h - cb.relSize.h) > 0.05) return false;
  }

  return true;
}

/**
 * Find all groups on the canvas that match the signature of the given group.
 * Returns an array of matching group objects (excluding the reference itself).
 */
export function findMatchingBlocks(canvas: unknown, referenceGroup: unknown): unknown[] {
  const fabric = canvas as Record<string, unknown>;
  const getObjects = (fabric.getObjects as () => unknown[])?.bind(fabric);
  if (!getObjects) return [];

  const refSig = getBlockSignature(referenceGroup);
  if (!refSig) return [];

  const allObjects = getObjects();
  return allObjects.filter((obj: unknown) => {
    if (obj === referenceGroup) return false;
    const sig = getBlockSignature(obj);
    return sig ? signaturesMatch(refSig, sig) : false;
  });
}
