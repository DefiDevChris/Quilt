/**
 * Select Similar Engine
 * Finds canvas objects matching a reference object by fabric, fill color,
 * stroke color, or block structure. Pure logic — no DOM dependencies.
 */

import { getBlockSignature, signaturesMatch, type BlockSignature } from '@/lib/block-matching';

export type SimilarityMode = 'fabric' | 'fillColor' | 'strokeColor' | 'blockStructure';

/**
 * Extract fabric identifier from a Fabric.js object.
 * Checks pattern fill source URL and fabricId property.
 */
function getObjectFabricId(obj: unknown): { fabricId: string; imageUrl: string } | null {
  const fill = (obj as Record<string, unknown>).fill;
  let imageUrl = '';

  if (fill && typeof fill !== 'string') {
    const pattern = fill as { source?: { src?: string } };
    imageUrl = pattern.source?.src ?? '';
  }

  const fabricId = (obj as unknown as { fabricId?: string }).fabricId ?? '';

  if (!fabricId && !imageUrl) return null;
  return { fabricId, imageUrl };
}

/**
 * Extract fill color from a Fabric.js object.
 * Returns null if fill is a pattern (not a solid color).
 */
function getObjectFillColor(obj: unknown): string | null {
  const fill = (obj as Record<string, unknown>).fill;
  if (typeof fill === 'string') return fill;
  return null;
}

/**
 * Extract stroke color from a Fabric.js object.
 */
function getObjectStrokeColor(obj: unknown): string | null {
  const stroke = (obj as Record<string, unknown>).stroke;
  return typeof stroke === 'string' ? stroke : null;
}

/**
 * Find all objects on the canvas matching the similarity criteria.
 * Returns array of matching objects (excluding the reference).
 */
export function findSimilarObjects(
  allObjects: unknown[],
  referenceObject: unknown,
  mode: SimilarityMode
): unknown[] {
  switch (mode) {
    case 'fabric': {
      const refFabric = getObjectFabricId(referenceObject);
      if (!refFabric) return [];

      return allObjects.filter((obj: unknown) => {
        if (obj === referenceObject) return false;
        const objFabric = getObjectFabricId(obj);
        if (!objFabric) return false;
        if (refFabric.fabricId && objFabric.fabricId) {
          return refFabric.fabricId === objFabric.fabricId;
        }
        return refFabric.imageUrl === objFabric.imageUrl;
      });
    }

    case 'fillColor': {
      const refColor = getObjectFillColor(referenceObject);
      if (!refColor) return [];

      return allObjects.filter((obj: unknown) => {
        if (obj === referenceObject) return false;
        return getObjectFillColor(obj) === refColor;
      });
    }

    case 'strokeColor': {
      const refStroke = getObjectStrokeColor(referenceObject);
      if (!refStroke) return [];

      return allObjects.filter((obj: unknown) => {
        if (obj === referenceObject) return false;
        return getObjectStrokeColor(obj) === refStroke;
      });
    }

    case 'blockStructure': {
      const refSig = getBlockSignature(referenceObject);
      if (!refSig) return [];

      return allObjects.filter((obj: unknown) => {
        if (obj === referenceObject) return false;
        const sig = getBlockSignature(obj);
        return sig ? signaturesMatch(refSig, sig) : false;
      });
    }

    default:
      return [];
  }
}

/**
 * Get available similarity modes for a given reference object.
 * Returns modes that have valid data to match against.
 */
export function getAvailableSimilarityModes(referenceObject: unknown): SimilarityMode[] {
  const modes: SimilarityMode[] = [];

  const fabric = getObjectFabricId(referenceObject);
  if (fabric) modes.push('fabric');

  const fillColor = getObjectFillColor(referenceObject);
  if (fillColor) modes.push('fillColor');

  const strokeColor = getObjectStrokeColor(referenceObject);
  if (strokeColor) modes.push('strokeColor');

  if (getBlockSignature(referenceObject)) modes.push('blockStructure');

  return modes;
}
