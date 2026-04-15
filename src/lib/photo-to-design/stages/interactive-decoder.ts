// ============================================================================
// Stage: Interactive Point-Prompt Decoder (U6)
//
// The review canvas lets the quilter click into the photo to add or fix a
// patch the auto-segment missed. This stage runs the short-circuit pipeline
// for a single click:
//
//   SAM decoder (one point, reuses cached image embedding)
//     → morphology + Douglas–Peucker (U4)
//     → grid snap (U5)
//     → invariant gate (U7)
//
// The image encoder is the expensive step — several seconds even on WebGPU —
// so we never re-run it here. `decodeSinglePoint` will only touch the encoder
// when the image hash changes (e.g. the user rescanned a different photo).
//
// Output is intentionally partial (`vertices` + `svgPath` only) — the store
// owns `id` / `templateId` assignment so that interactive patches can be
// deduplicated against the templates the auto-segment already produced.
// ============================================================================

import { canonicalizePatches } from './canonicalize';
import { decodeSinglePoint } from './sam-segment';
import { validatePatches } from './validate';
import { vectorizeMasks } from './vectorize';
import type { GridSpec, Point } from '../types';

export interface InteractiveDecoderInput {
  /** Prescaled image pixels (the same buffer that produced the current result). */
  imageData: ImageData;
  /** Hash of the prescaled pixels — key for the embedding cache. */
  imageHash: string;
  /** Click point in prescaled-image coordinates. */
  point: Point;
  /** Grid calibration for ¼″ snap. Coords are in ORIGINAL image space. */
  gridSpec: GridSpec;
  /** originalDim / prescaledDim. Multiply prescaled coords by this to get original coords. */
  scale: number;
}

/**
 * The geometry half of a patch. The caller owns id + templateId allocation so
 * new patches can dedup against templates from the original auto-segment pass.
 */
export interface InteractiveDecodeResult {
  vertices: Point[];
  svgPath: string;
}

export async function runInteractiveDecode(
  input: InteractiveDecoderInput
): Promise<InteractiveDecodeResult | null> {
  const mask = await decodeSinglePoint(input.imageData, input.imageHash, [
    Math.round(input.point.x),
    Math.round(input.point.y),
  ]);
  if (!mask) return null;

  const vectorized = await vectorizeMasks([mask]);
  if (vectorized.length === 0) return null;

  // Lift vertices out of prescaled space into the original image's coord
  // system, where the user's gridSpec was calibrated.
  const upscaled =
    input.scale === 1
      ? vectorized
      : vectorized.map((v) => ({
          ...v,
          vertices: v.vertices.map((p) => ({ x: p.x * input.scale, y: p.y * input.scale })),
          bbox: {
            minX: v.bbox.minX * input.scale,
            minY: v.bbox.minY * input.scale,
            maxX: v.bbox.maxX * input.scale,
            maxY: v.bbox.maxY * input.scale,
            width: v.bbox.width * input.scale,
            height: v.bbox.height * input.scale,
          },
        }));

  const patches = canonicalizePatches(upscaled, input.gridSpec);
  if (patches.length === 0) return null;

  // Throws on invariant failure — caller surfaces the user-facing message.
  validatePatches(patches);

  const [patch] = patches;
  return { vertices: patch.vertices, svgPath: patch.svgPath };
}
