/**
 * Yardage Calculator — thin orchestrator that walks a Fabric.js canvas,
 * collects every shape's fabric assignment + area, and feeds the existing
 * `yardage-utils` math.
 *
 * Why a separate module?
 * - `yardage-utils.ts` is canvas-agnostic and accepts pre-extracted
 *   `CanvasShapeData[]` so it can also be used from the PDF engine. We
 *   keep it that way.
 * - This module sits between Fabric and yardage-utils, handling the
 *   tree-walk (block groups contain nested patch objects), the recovery
 *   of fabric metadata (id / display name / thumbnail), and the unit
 *   conversion (pixels → inches via PIXELS_PER_INCH).
 *
 * Public API:
 *   • `extractCanvasShapes(canvas, lookupFabric)` → CanvasShapeData[]
 *   • `computeCanvasYardage(...)`                 → ComputedYardage
 *   • `formatShoppingList(...)`                   → string (clipboard)
 */

import {
  computeYardageEstimates,
  calculateBackingYardage,
  calculateBindingYardage,
  type CanvasShapeData,
  type YardageResult,
  type BackingYardageResult,
  type BindingYardageResult,
  type WOF,
} from '@/lib/yardage-utils';
import { PIXELS_PER_INCH, DEFAULT_WASTE_MARGIN } from '@/lib/constants';
import { decimalToFraction, toMixedNumberString } from '@/lib/fraction-math';

/**
 * Minimal structural type for a Fabric.js object — so this module
 * doesn't import fabric.js types directly (per AGENTS.md).
 */
interface CanvasLikeObject {
  readonly type?: string;
  readonly left?: number;
  readonly top?: number;
  readonly width?: number;
  readonly height?: number;
  readonly scaleX?: number;
  readonly scaleY?: number;
  readonly fill?: string | unknown;
  readonly fabricId?: string;
  readonly id?: string;
  readonly _layoutElement?: boolean;
  readonly _fenceElement?: boolean;
  readonly __isBlockGroup?: boolean;
  readonly __pieceRole?: string;
  readonly _objects?: CanvasLikeObject[];
  readonly getObjects?: () => CanvasLikeObject[];
}

/** Lookup hook for resolving fabricId → display info (name + thumbnail). */
export interface FabricLookup {
  (fabricId: string): { name: string; thumbnailUrl: string | null } | undefined;
}

/**
 * Walk the canvas tree and extract one CanvasShapeData per leaf shape
 * that has dimensions. Skips fence overlay rects, layout artifacts,
 * and bare guide lines. Recurses into block groups so the fabrics
 * inside a placed block are counted.
 */
export function extractCanvasShapes(
  canvas: { getObjects: () => CanvasLikeObject[] } | null | undefined,
  lookupFabric?: FabricLookup,
): CanvasShapeData[] {
  if (!canvas) return [];

  const out: CanvasShapeData[] = [];
  const stack: { obj: CanvasLikeObject; scaleX: number; scaleY: number }[] = [];

  for (const obj of canvas.getObjects()) {
    stack.push({ obj, scaleX: 1, scaleY: 1 });
  }

  while (stack.length > 0) {
    const { obj, scaleX: parentScaleX, scaleY: parentScaleY } = stack.pop()!;

    // Fence overlays, layout grid lines, and other studio chrome must
    // not be billed as fabric. Same for any object explicitly marked
    // as a non-billable layout element.
    if (obj._fenceElement || obj._layoutElement) continue;

    // Block group: recurse into its child patches with the group's scale
    // baked into the parent scale of each child. This way a 1.5× scaled
    // block correctly multiplies all its patch areas by 1.5×1.5 = 2.25.
    if (obj.__isBlockGroup) {
      const sx = (obj.scaleX ?? 1) * parentScaleX;
      const sy = (obj.scaleY ?? 1) * parentScaleY;
      const children = obj._objects ?? obj.getObjects?.() ?? [];
      for (const child of children) {
        stack.push({ obj: child, scaleX: sx, scaleY: sy });
      }
      continue;
    }

    // Generic group fallback (selections, etc.) — recurse but don't
    // count the wrapper itself.
    if (obj.type === 'group' || obj.type === 'activeSelection') {
      const sx = (obj.scaleX ?? 1) * parentScaleX;
      const sy = (obj.scaleY ?? 1) * parentScaleY;
      const children = obj._objects ?? obj.getObjects?.() ?? [];
      for (const child of children) {
        stack.push({ obj: child, scaleX: sx, scaleY: sy });
      }
      continue;
    }

    const widthPx = obj.width ?? 0;
    const heightPx = obj.height ?? 0;
    if (widthPx <= 0 || heightPx <= 0) continue;

    const totalScaleX = (obj.scaleX ?? 1) * parentScaleX;
    const totalScaleY = (obj.scaleY ?? 1) * parentScaleY;
    const fabricId = obj.fabricId ?? null;
    const fillColor = typeof obj.fill === 'string' ? obj.fill : '#b8a698';
    const lookupResult = fabricId && lookupFabric ? lookupFabric(fabricId) : undefined;

    out.push({
      id: obj.id ?? `obj-${out.length}`,
      widthPx,
      heightPx,
      scaleX: totalScaleX,
      scaleY: totalScaleY,
      fabricId,
      fabricName: lookupResult?.name ?? null,
      fillColor,
      type: obj.type ?? 'rect',
    });
  }

  return out;
}

/**
 * Per-fabric yardage row, ready for the panel UI.
 */
export interface YardageRow extends YardageResult {
  /** S3 thumbnail URL when the fabric is a real library fabric, else null. */
  readonly thumbnailUrl: string | null;
}

/**
 * Computed yardage result returned by `computeCanvasYardage`.
 */
export interface ComputedYardage {
  readonly fabrics: YardageRow[];
  readonly backing: BackingYardageResult | null;
  readonly binding: BindingYardageResult | null;
  /** Sum of all per-fabric yardage (rounded). Useful for one-line summaries. */
  readonly totalYards: number;
}

export interface ComputeYardageInput {
  readonly canvas: { getObjects: () => CanvasLikeObject[] } | null | undefined;
  readonly quiltWidth: number;
  readonly quiltHeight: number;
  readonly wof: WOF;
  readonly wasteMargin?: number;
  readonly lookupFabric?: FabricLookup;
}

/**
 * Top-level entry point — walk the canvas, group by fabric, return both
 * per-fabric yardage rows and project-level backing/binding requirements.
 */
export function computeCanvasYardage({
  canvas,
  quiltWidth,
  quiltHeight,
  wof,
  wasteMargin = DEFAULT_WASTE_MARGIN,
  lookupFabric,
}: ComputeYardageInput): ComputedYardage {
  const shapes = extractCanvasShapes(canvas, lookupFabric);
  const baseResults = computeYardageEstimates(shapes, PIXELS_PER_INCH, wof, wasteMargin);

  const fabrics: YardageRow[] = baseResults.map((r) => {
    const lookup = r.fabricId && lookupFabric ? lookupFabric(r.fabricId) : undefined;
    return { ...r, thumbnailUrl: lookup?.thumbnailUrl ?? null };
  });

  const backing =
    quiltWidth > 0 && quiltHeight > 0
      ? calculateBackingYardage(quiltWidth, quiltHeight, wof)
      : null;
  const binding =
    quiltWidth > 0 && quiltHeight > 0
      ? calculateBindingYardage(quiltWidth, quiltHeight, wof)
      : null;

  const totalYards = fabrics.reduce((sum, row) => sum + row.yardsRequired, 0);

  return { fabrics, backing, binding, totalYards };
}

/**
 * Render a copy-paste-able shopping list. Designed for the "Copy to
 * clipboard" button on the YardagePanel — quilters paste this into a
 * notes app, email, or fabric-shop chat.
 */
export function formatShoppingList(
  result: ComputedYardage,
  options?: { quiltSize?: { width: number; height: number }; projectName?: string },
): string {
  const lines: string[] = [];

  if (options?.projectName) {
    lines.push(`Quilt: ${options.projectName}`);
  }
  if (options?.quiltSize) {
    const w = toMixedNumberString(decimalToFraction(options.quiltSize.width));
    const h = toMixedNumberString(decimalToFraction(options.quiltSize.height));
    lines.push(`Finished size: ${w}″ × ${h}″`);
  }
  if (lines.length > 0) lines.push('');

  lines.push('Fabric requirements:');
  if (result.fabrics.length === 0) {
    lines.push('  (no fabrics applied yet)');
  } else {
    for (const row of result.fabrics) {
      const yards = row.yardsRequired > 0
        ? toMixedNumberString(decimalToFraction(row.yardsRequired))
        : '0';
      lines.push(`  • ${row.displayName} — ${yards} yd (${row.shapeCount} pieces)`);
    }
  }

  if (result.backing) {
    const backingYards = toMixedNumberString(decimalToFraction(result.backing.yardsRequired));
    lines.push('');
    lines.push(
      `Backing: ${backingYards} yd (${result.backing.panelsNeeded} panel${result.backing.panelsNeeded !== 1 ? 's' : ''})`,
    );
  }
  if (result.binding) {
    const bindingYards = toMixedNumberString(decimalToFraction(result.binding.yardsRequired));
    lines.push(
      `Binding: ${bindingYards} yd (${result.binding.stripCount} strips at ${toMixedNumberString(
        decimalToFraction(result.binding.stripWidthInches),
      )}″ × WOF)`,
    );
  }

  return lines.join('\n');
}
