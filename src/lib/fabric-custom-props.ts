/**
 * Fabric.js Custom Property Registration
 *
 * Registers custom metadata properties so they survive every
 * serialization boundary (toJSON, toObject, loadFromJSON, undo/redo,
 * project save/load, copy/paste).
 *
 * Must be called ONCE before any canvas is created.
 */

const CUSTOM_PROPERTIES = [
  // Block patch metadata (set on individual pieces within block groups)
  '__shade', // 'dark' | 'light' | 'background' | 'unknown'
  '__pieceRole', // 'patch' | 'block'
  '__blockPatchIndex', // number — stable index within the block
  '__blockId', // string — which block definition this piece belongs to

  // Fabric identity (set on any object that receives a library fabric fill)
  'fabricId', // string — database ID of the assigned fabric

  // Block group metadata (set on the fabric.Group wrapping a placed block)
  '__isBlockGroup', // boolean — marks a group as a block placement
  '_inFenceCellId', // string — which fence cell this block occupies

  // Fence area metadata (set on fence Rects by useFenceRenderer)
  '_fenceElement', // boolean — marks an object as a fence rect
  '_fenceAreaId', // string — unique area identifier (e.g., 'cell-0-1')
  '_fenceRole', // LayoutAreaRole — 'block-cell' | 'sashing' | 'border' | etc.
] as const;

let registered = false;

export function registerFabricCustomProperties(): void {
  if (registered) return;
  registered = true;

  // Defer import so this module stays side-effect free until called
  import('fabric').then((fabric) => {
    const existing = fabric.FabricObject.customProperties ?? [];
    fabric.FabricObject.customProperties = [...existing, ...CUSTOM_PROPERTIES];
  });
}
