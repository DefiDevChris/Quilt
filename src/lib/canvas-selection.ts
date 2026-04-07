/**
 * canvas-selection — Pure helper that resolves a list of selected object IDs
 * into a typed `SelectionKind`. Used by the right-pane Inspector to decide
 * which panel to render based on what the user has selected on the canvas.
 *
 * Reads the same Fabric.js object tags that `useLayoutRenderer` and
 * `useBlockDrop` write:
 *   - `_layoutRendererElement: true`     → object is part of a layout overlay
 *   - `_layoutAreaId: string`            → unique area identifier
 *   - `_layoutAreaRole: LayoutAreaRole`  → role enum (block-cell, sashing, …)
 *   - `_inLayoutCellId: string`          → tag set by useBlockDrop on placed blocks
 *
 * Zero React/DOM dependencies — fully testable in Vitest.
 */

import type { Canvas as FabricCanvas, FabricObject } from 'fabric';
import type { LayoutAreaRole } from '@/types/layout';

export type SelectionKind =
  | 'none'
  | 'block-cell' // empty layout slot
  | 'block' // user-placed block group
  | 'piece' // sub-piece inside a block group
  | 'sashing'
  | 'cornerstone'
  | 'border'
  | 'binding'
  | 'setting-triangle'
  | 'edging'
  | 'free-shape' // user-drawn rect/polygon/path on free canvas
  | 'mixed'
  | 'unknown';

export interface ResolvedSelection {
  readonly kind: SelectionKind;
  readonly objects: readonly FabricObject[];
  readonly primary: FabricObject | null;
  readonly layoutAreaId?: string;
  readonly layoutAreaRole?: LayoutAreaRole;
  readonly borderIndex?: number;
  /** When kind === 'piece', this is the parent block Group */
  readonly blockGroup?: FabricObject;
  /** Cell ID of a placed block, when block has been dropped into a cell */
  readonly inLayoutCellId?: string;
}

const RENDERER_MARKER = '_layoutRendererElement';
const AREA_ID_PROP = '_layoutAreaId';
const AREA_ROLE_PROP = '_layoutAreaRole';
const IN_CELL_PROP = '_inLayoutCellId';
const BORDER_INDEX_PROP = '_layoutBorderIndex';

type AnyRecord = Record<string, unknown>;

/** True if the object was emitted by useLayoutRenderer (sashing/border/cell/binding/etc). */
export function isLayoutArea(obj: FabricObject | null | undefined): boolean {
  if (!obj) return false;
  return Boolean((obj as unknown as AnyRecord)[RENDERER_MARKER]);
}

/** True if the object is a user-placed block Group (has subTargetCheck). */
export function isUserBlock(obj: FabricObject | null | undefined): boolean {
  if (!obj) return false;
  if (isLayoutArea(obj)) return false;
  // Block drops produce fabric.Group with subTargetCheck enabled
  const r = obj as unknown as AnyRecord;
  return r['type'] === 'group' && Boolean(r['subTargetCheck']);
}

/** True if the object is a sub-target inside a block Group (a piece). */
export function isPiece(obj: FabricObject | null | undefined): boolean {
  if (!obj) return false;
  if (isLayoutArea(obj)) return false;
  const r = obj as unknown as AnyRecord;
  // Pieces are non-group Fabric objects whose .group property points at a user block
  if (r['type'] === 'group') return false;
  const parent = r['group'] as FabricObject | undefined;
  return isUserBlock(parent);
}

/** Read the layout area role from a tagged object, or null. */
export function readLayoutRole(obj: FabricObject | null | undefined): LayoutAreaRole | null {
  if (!obj) return null;
  if (!isLayoutArea(obj)) return null;
  return ((obj as unknown as AnyRecord)[AREA_ROLE_PROP] as LayoutAreaRole) ?? null;
}

/** Read the layout area ID from a tagged object, or null. */
export function readLayoutAreaId(obj: FabricObject | null | undefined): string | null {
  if (!obj) return null;
  if (!isLayoutArea(obj)) return null;
  return ((obj as unknown as AnyRecord)[AREA_ID_PROP] as string) ?? null;
}

/** Read the border index from a border-strip object, or undefined. */
export function readBorderIndex(obj: FabricObject | null | undefined): number | undefined {
  if (!obj) return undefined;
  const r = obj as unknown as AnyRecord;
  const idx = r[BORDER_INDEX_PROP];
  return typeof idx === 'number' ? idx : undefined;
}

/** Read the in-layout cell ID from a placed block, or undefined. */
export function readInLayoutCellId(obj: FabricObject | null | undefined): string | undefined {
  if (!obj) return undefined;
  const r = obj as unknown as AnyRecord;
  const id = r[IN_CELL_PROP];
  return typeof id === 'string' ? id : undefined;
}

/** Map a layout area role to its corresponding SelectionKind. */
function roleToKind(role: LayoutAreaRole): SelectionKind {
  switch (role) {
    case 'block-cell':
      return 'block-cell';
    case 'sashing':
      return 'sashing';
    case 'cornerstone':
      return 'cornerstone';
    case 'border':
      return 'border';
    case 'binding':
      return 'binding';
    case 'edging':
      return 'edging';
    default:
      return 'unknown';
  }
}

/**
 * Resolve a list of selected object IDs from canvasStore into a typed
 * SelectionKind plus metadata for inspector panels.
 *
 * Selection rules:
 *  - 0 objects                       → 'none'
 *  - 1 layout-area object            → role-derived kind
 *  - 1 user block group              → 'block'
 *  - 1 piece (group sub-target)      → 'piece' with parent group
 *  - 1 free shape                    → 'free-shape'
 *  - 2+ objects of mixed kind        → 'mixed'
 *  - 2+ objects of same kind         → that kind, primary = first
 */
export function resolveSelection(
  canvas: FabricCanvas | null,
  ids: readonly string[]
): ResolvedSelection {
  if (!canvas || ids.length === 0) {
    return { kind: 'none', objects: [], primary: null };
  }

  // Resolve IDs → objects via canvas.getObjects() lookup. Some Fabric objects
  // carry an `id` field; others use position-based identification. We honor
  // both: prefer explicit `id`, fall back to active selection.
  const allObjects = canvas.getObjects();
  const lookupById = new Map<string, FabricObject>();
  for (const obj of allObjects) {
    const id = (obj as unknown as AnyRecord)['id'];
    if (typeof id === 'string') lookupById.set(id, obj);
  }

  const objects: FabricObject[] = [];
  for (const id of ids) {
    const obj = lookupById.get(id);
    if (obj) objects.push(obj);
  }

  // Fallback: if explicit ID lookup fails, use canvas active selection
  if (objects.length === 0) {
    const active = canvas.getActiveObjects?.() ?? [];
    objects.push(...active);
  }

  if (objects.length === 0) {
    return { kind: 'none', objects: [], primary: null };
  }

  if (objects.length === 1) {
    const obj = objects[0];

    // Layout area?
    const role = readLayoutRole(obj);
    if (role) {
      return {
        kind: roleToKind(role),
        objects,
        primary: obj,
        layoutAreaId: readLayoutAreaId(obj) ?? undefined,
        layoutAreaRole: role,
        borderIndex: readBorderIndex(obj),
      };
    }

    // Sub-piece inside a block?
    if (isPiece(obj)) {
      const r = obj as unknown as AnyRecord;
      const parent = r['group'] as FabricObject | undefined;
      return {
        kind: 'piece',
        objects,
        primary: obj,
        blockGroup: parent,
      };
    }

    // User block group?
    if (isUserBlock(obj)) {
      return {
        kind: 'block',
        objects,
        primary: obj,
        inLayoutCellId: readInLayoutCellId(obj),
      };
    }

    // Generic free-form shape (rect/poly/path drawn with the drawing tools)
    return { kind: 'free-shape', objects, primary: obj };
  }

  // Multi-select: collapse to a single kind if homogeneous, else 'mixed'
  const kinds = new Set<SelectionKind>();
  for (const obj of objects) {
    const role = readLayoutRole(obj);
    if (role) {
      kinds.add(roleToKind(role));
      continue;
    }
    if (isPiece(obj)) {
      kinds.add('piece');
      continue;
    }
    if (isUserBlock(obj)) {
      kinds.add('block');
      continue;
    }
    kinds.add('free-shape');
  }

  if (kinds.size === 1) {
    const kind = [...kinds][0];
    return { kind, objects, primary: objects[0] };
  }

  return { kind: 'mixed', objects, primary: objects[0] };
}
