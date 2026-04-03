/**
 * Fabric Usage Engine
 * Analyzes canvas objects to determine which patches use a specific fabric.
 * Pure logic — no DOM or Fabric.js dependencies.
 */

export interface FabricUsageResult {
  patchCount: number;
  patches: Array<{
    objectId: string;
    fabricId: string;
    fabricImageUrl: string;
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
}

/**
 * Check if a canvas object uses the specified fabric.
 * Matches by fabricId or imageUrl.
 */
function objectUsesFabric(
  obj: unknown,
  fabricId: string,
  fabricImageUrl: string
): { fabricId: string; imageUrl: string } | null {
  const o = obj as Record<string, unknown>;

  // Skip grid lines and overlays
  if (o.stroke === '#E5E2DD' && o.type === 'line') return null;
  if ((o as unknown as { name?: string }).name === 'overlay-ref') return null;

  const fill = o.fill;
  let objImageUrl = '';

  if (fill && typeof fill !== 'string') {
    const pattern = fill as { source?: { src?: string } };
    objImageUrl = pattern.source?.src ?? '';
  }

  const objFabricId = (obj as unknown as { fabricId?: string }).fabricId ?? '';

  const matches =
    (fabricId && objFabricId === fabricId) || (fabricImageUrl && objImageUrl === fabricImageUrl);

  if (!matches) return null;
  return { fabricId: objFabricId, imageUrl: objImageUrl };
}

/**
 * Extract bounds from a Fabric.js object.
 */
function getObjectBounds(obj: unknown): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const o = obj as Record<string, unknown>;
  const getBoundingRect = (
    obj as unknown as {
      getBoundingRect?: () => { left: number; top: number; width: number; height: number };
    }
  ).getBoundingRect;

  if (getBoundingRect) {
    const br = getBoundingRect();
    return { left: br.left, top: br.top, width: br.width, height: br.height };
  }

  return {
    left: (o.left as number) ?? 0,
    top: (o.top as number) ?? 0,
    width: (o.width as number) ?? 0,
    height: (o.height as number) ?? 0,
  };
}

/**
 * Analyze canvas objects to find all patches using the specified fabric.
 * Matches by fabricId or imageUrl. Checks group children recursively.
 */
export function findFabricUsage(
  canvasObjects: unknown[],
  fabricId: string,
  fabricImageUrl: string
): FabricUsageResult {
  const patches: FabricUsageResult['patches'] = [];

  for (const obj of canvasObjects) {
    const usage = objectUsesFabric(obj, fabricId, fabricImageUrl);
    if (usage) {
      const bounds = getObjectBounds(obj);
      patches.push({
        objectId: (obj as unknown as { id?: string }).id ?? `obj-${Date.now()}`,
        fabricId: usage.fabricId,
        fabricImageUrl: usage.imageUrl,
        ...bounds,
      });
    }

    // Check group children
    const o = obj as Record<string, unknown>;
    if (o.type === 'group') {
      const getObjects = (o as unknown as { getObjects?: () => unknown[] }).getObjects;
      if (getObjects) {
        const children = getObjects();
        for (const child of children) {
          const childUsage = objectUsesFabric(child, fabricId, fabricImageUrl);
          if (childUsage) {
            const bounds = getObjectBounds(child);
            patches.push({
              objectId: (child as unknown as { id?: string }).id ?? `child-${Date.now()}`,
              fabricId: childUsage.fabricId,
              fabricImageUrl: childUsage.imageUrl,
              ...bounds,
            });
          }
        }
      }
    }
  }

  return {
    patchCount: patches.length,
    patches,
  };
}

/**
 * Get all unique fabrics used on the canvas.
 * Returns array of { fabricId, imageUrl, patchCount } for each fabric.
 */
export function getCanvasFabrics(canvasObjects: unknown[]): Array<{
  fabricId: string;
  imageUrl: string;
  patchCount: number;
}> {
  const fabricMap = new Map<string, { fabricId: string; imageUrl: string; patchCount: number }>();

  function processObject(obj: unknown) {
    const o = obj as Record<string, unknown>;

    // Skip grid lines and overlays
    if (o.stroke === '#E5E2DD' && o.type === 'line') return;
    if ((o as unknown as { name?: string }).name === 'overlay-ref') return;

    const fill = o.fill;
    let imageUrl = '';

    if (fill && typeof fill !== 'string') {
      const pattern = fill as { source?: { src?: string } };
      imageUrl = pattern.source?.src ?? '';
    }

    const fabricId = (obj as unknown as { fabricId?: string }).fabricId ?? '';

    if (!fabricId && !imageUrl) return;

    const key = fabricId || imageUrl;
    const existing = fabricMap.get(key);
    if (existing) {
      existing.patchCount++;
    } else {
      fabricMap.set(key, { fabricId, imageUrl, patchCount: 1 });
    }
  }

  for (const obj of canvasObjects) {
    processObject(obj);

    // Check group children
    const o = obj as Record<string, unknown>;
    if (o.type === 'group') {
      const getObjects = (o as unknown as { getObjects?: () => unknown[] }).getObjects;
      if (getObjects) {
        for (const child of getObjects()) {
          processObject(child);
        }
      }
    }
  }

  return Array.from(fabricMap.values());
}
