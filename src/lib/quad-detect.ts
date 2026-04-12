/**
 * Quad Detect — Hough-based quadrilateral detection for calibration seed.
 *
 * Given a quilt photo, finds the four corners of the largest axis-aligned
 * (or tilted) rectangle-ish blob and returns them so the Calibration step
 * can pre-position its pins instead of making the user drag from the 15%
 * inset default.
 *
 * Pipeline:
 *   1. Canny edges (via `edge-detect.ts`)
 *   2. Hough line transform (ρ/θ accumulator)
 *   3. Split peaks into horizontal / vertical pools by |cos θ| > 0.7
 *   4. Pick the topmost + bottommost horizontal and leftmost + rightmost
 *      vertical
 *   5. Intersect the four pairs → four corner points
 *   6. Reject if the quadrilateral isn't convex, is too small (<20% of
 *      the image area), or the minimum vote count is below a sanity
 *      threshold
 *
 * Pure computation — zero DOM, zero Fabric.js, zero React. Uses
 * resampling down to a 384-px long edge internally so the Hough
 * accumulator stays cheap.
 */

import type { ImageDataLike } from '@/lib/color-quantize';
import { resizeImageDataLike } from '@/lib/quilt-segmentation-engine';
import { cannyEdges } from '@/lib/edge-detect';
import type { QuadCorners } from '@/lib/photo-layout-types';

// ── Public types ─────────────────────────────────────────────────────────

export interface DetectedQuad {
  /** Four corners in ORIGINAL image pixels, ordered TL, TR, BR, BL. */
  readonly corners: QuadCorners;
  /** Confidence in 0..1 — higher is better. */
  readonly confidence: number;
}

interface Line {
  readonly rho: number;
  readonly theta: number;
  readonly votes: number;
}

interface Point2DMut {
  x: number;
  y: number;
}

// ── Tuning ───────────────────────────────────────────────────────────────

const WORK_MAX_DIM = 384;
const THETA_STEPS = 180; // 1° per bucket
const RHO_STEP = 1;
const MIN_VOTE_FRACTION = 0.08; // reject lines with < 8% of peak votes
const HORIZONTAL_COS_THRESHOLD = 0.7;
const MIN_QUAD_AREA_FRACTION = 0.2;

// ── Top-level API ────────────────────────────────────────────────────────

/**
 * Detect the dominant quad in an image. Returns `null` if nothing
 * convincing is found — that makes the caller fall back to the manual
 * 15% inset default.
 */
export function detectQuiltQuad(image: ImageDataLike): DetectedQuad | null {
  if (image.width < 32 || image.height < 32) return null;

  // 1) Downsample for the Hough pass. Corner coordinates are scaled back
  // to the original image at the end, so the caller never sees work-space
  // pixels.
  const work = resizeImageDataLike(image, WORK_MAX_DIM);
  const scale = image.width / work.width;

  const edges = cannyEdges(work);

  // 2) Hough accumulator.
  const lines = houghLines(edges, work.width, work.height);
  if (lines.length < 4) return null;

  // 3) Split lines into horizontal / vertical pools by |cos θ|, and
  //    collapse clusters of near-duplicate peaks so the extremal search
  //    doesn't latch onto slightly-tilted neighbours of the true edge.
  const horizontal: Line[] = [];
  const vertical: Line[] = [];
  for (const line of lines) {
    const c = Math.abs(Math.cos(line.theta));
    if (c > HORIZONTAL_COS_THRESHOLD) {
      vertical.push(line);
    } else {
      horizontal.push(line);
    }
  }
  const horizontalClusters = clusterLines(horizontal, work.width, work.height);
  const verticalClusters = clusterLines(vertical, work.width, work.height);
  if (horizontalClusters.length < 2 || verticalClusters.length < 2) return null;

  // 4) Pick two dominant lines per pool. A "dominant" pair is the
  //    strongest-voted cluster + the strongest other cluster whose
  //    signed offset from the image center is far enough away to be a
  //    real opposite edge. Picking by votes avoids the trap where a
  //    slightly-tilted satellite line has a more extreme offset than
  //    the true axis-aligned edge but drastically fewer votes.
  const cx = work.width / 2;
  const cy = work.height / 2;
  const offsetOf = (l: Line) => l.rho - (cx * Math.cos(l.theta) + cy * Math.sin(l.theta));

  const minSeparation = Math.max(10, Math.max(work.width, work.height) * 0.15);
  const pickOpposingPair = (clusters: Line[]): [Line, Line] | null => {
    if (clusters.length < 2) return null;
    const sorted = [...clusters].sort((a, b) => b.votes - a.votes);
    const first = sorted[0];
    const firstOffset = offsetOf(first);
    for (const candidate of sorted.slice(1)) {
      if (Math.abs(offsetOf(candidate) - firstOffset) >= minSeparation) {
        if (offsetOf(first) < offsetOf(candidate)) return [first, candidate];
        return [candidate, first];
      }
    }
    return null;
  };

  const horizontalPair = pickOpposingPair(horizontalClusters);
  const verticalPair = pickOpposingPair(verticalClusters);
  if (!horizontalPair || !verticalPair) return null;

  const [top, bottom] = horizontalPair;
  const [left, right] = verticalPair;

  // 5) Intersect the four line pairs.
  const tl = intersect(top, left);
  const tr = intersect(top, right);
  const br = intersect(bottom, right);
  const bl = intersect(bottom, left);
  if (!tl || !tr || !br || !bl) return null;

  // 6) Sanity-check convexity + area + bounds.
  const quad = [tl, tr, br, bl];
  if (!isConvex(quad)) return null;

  const workArea = work.width * work.height;
  const quadArea = polygonArea(quad);
  if (quadArea < workArea * MIN_QUAD_AREA_FRACTION) return null;

  const insideBounds = quad.every(
    (p) =>
      p.x >= -work.width * 0.05 &&
      p.x <= work.width * 1.05 &&
      p.y >= -work.height * 0.05 &&
      p.y <= work.height * 1.05
  );
  if (!insideBounds) return null;

  // Confidence blends the minimum line vote count with the normalized
  // quad area.
  const minVotes = Math.min(top.votes, bottom.votes, left.votes, right.votes);
  const maxVotes = Math.max(...lines.map((l) => l.votes));
  const voteStrength = Math.min(1, minVotes / maxVotes);
  const areaStrength = Math.min(1, quadArea / workArea);
  const confidence = (voteStrength + areaStrength) / 2;

  // Scale back to the original image space + clamp.
  const scaled: Point2DMut[] = quad.map((p) => ({
    x: clamp(Math.round(p.x * scale), 0, image.width - 1),
    y: clamp(Math.round(p.y * scale), 0, image.height - 1),
  }));

  return {
    corners: [scaled[0], scaled[1], scaled[2], scaled[3]] as unknown as QuadCorners,
    confidence,
  };
}

// ── Internal: Hough line transform ───────────────────────────────────────

function houghLines(edges: Uint8Array, width: number, height: number): Line[] {
  const maxRho = Math.ceil(Math.sqrt(width * width + height * height));
  const rhoSpan = 2 * maxRho + 1;
  const accumulator = new Uint32Array(THETA_STEPS * rhoSpan);

  // Precompute sin/cos for every theta.
  const cosT = new Float32Array(THETA_STEPS);
  const sinT = new Float32Array(THETA_STEPS);
  for (let t = 0; t < THETA_STEPS; t++) {
    const theta = (t * Math.PI) / THETA_STEPS;
    cosT[t] = Math.cos(theta);
    sinT[t] = Math.sin(theta);
  }

  // Vote.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] === 0) continue;
      for (let t = 0; t < THETA_STEPS; t++) {
        const rho = Math.round(x * cosT[t] + y * sinT[t]) / RHO_STEP;
        const rhoIdx = Math.round(rho) + maxRho;
        if (rhoIdx < 0 || rhoIdx >= rhoSpan) continue;
        accumulator[t * rhoSpan + rhoIdx]++;
      }
    }
  }

  // Find local maxima above a fraction of the global peak. Simple 3×3
  // non-max suppression in (rho, theta) space keeps us from returning 20
  // lines that all trace the same edge.
  let maxVotes = 0;
  for (let i = 0; i < accumulator.length; i++) {
    if (accumulator[i] > maxVotes) maxVotes = accumulator[i];
  }
  if (maxVotes === 0) return [];

  const floor = Math.max(20, Math.floor(maxVotes * MIN_VOTE_FRACTION));
  const lines: Line[] = [];
  for (let t = 0; t < THETA_STEPS; t++) {
    for (let r = 1; r < rhoSpan - 1; r++) {
      const v = accumulator[t * rhoSpan + r];
      if (v < floor) continue;

      // 3×3 neighborhood (wrap theta at the ends).
      let isMax = true;
      for (let dt = -1; dt <= 1 && isMax; dt++) {
        const tt = (t + dt + THETA_STEPS) % THETA_STEPS;
        for (let dr = -1; dr <= 1; dr++) {
          if (dt === 0 && dr === 0) continue;
          const rr = r + dr;
          if (rr < 0 || rr >= rhoSpan) continue;
          if (accumulator[tt * rhoSpan + rr] > v) {
            isMax = false;
            break;
          }
        }
      }
      if (!isMax) continue;

      lines.push({
        rho: (r - maxRho) * RHO_STEP,
        theta: (t * Math.PI) / THETA_STEPS,
        votes: v,
      });
    }
  }
  return lines;
}

// ── Internal: line intersection ──────────────────────────────────────────

/**
 * Intersect two Hough lines given in (rho, theta) form. Returns `null`
 * when the lines are parallel.
 */
function intersect(a: Line, b: Line): Point2DMut | null {
  const ca = Math.cos(a.theta);
  const sa = Math.sin(a.theta);
  const cb = Math.cos(b.theta);
  const sb = Math.sin(b.theta);
  const det = ca * sb - sa * cb;
  if (Math.abs(det) < 1e-6) return null;
  const x = (sb * a.rho - sa * b.rho) / det;
  const y = (ca * b.rho - cb * a.rho) / det;
  return { x, y };
}

/**
 * Collapse near-duplicate lines into clusters and keep the best-voted
 * representative of each. Two lines count as "duplicates" when their
 * angles are within 5° of each other and their perpendicular-to-center
 * offsets are within 6 % of the image's long edge. Hough peaks cluster
 * this way because the rasterizer lights up a narrow wedge of (ρ, θ)
 * bins for every strong edge, and picking `top`/`bottom`/`left`/`right`
 * by extremal offset without this step latches onto the tilted satellite
 * of the true edge instead of the edge itself.
 */
function clusterLines(lines: readonly Line[], width: number, height: number): Line[] {
  if (lines.length === 0) return [];
  const angleTolerance = (5 * Math.PI) / 180;
  const distTolerance = Math.max(6, 0.06 * Math.max(width, height));
  const cx = width / 2;
  const cy = height / 2;
  const offsetOf = (l: Line) => l.rho - (cx * Math.cos(l.theta) + cy * Math.sin(l.theta));

  // Sort strongest-first so each cluster's representative is its best peak.
  const sorted = [...lines].sort((a, b) => b.votes - a.votes);
  const picked: Line[] = [];
  for (const line of sorted) {
    let merged = false;
    for (const pick of picked) {
      let dTheta = Math.abs(pick.theta - line.theta);
      if (dTheta > Math.PI / 2) dTheta = Math.PI - dTheta; // wrap at ±π
      const dOffset = Math.abs(offsetOf(pick) - offsetOf(line));
      if (dTheta <= angleTolerance && dOffset <= distTolerance) {
        merged = true;
        break;
      }
    }
    if (!merged) picked.push(line);
  }
  return picked;
}

// ── Internal: geometry helpers ───────────────────────────────────────────

function polygonArea(points: readonly Point2DMut[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

function isConvex(points: readonly Point2DMut[]): boolean {
  if (points.length < 3) return false;
  let sign = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const c = points[(i + 2) % points.length];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (cross !== 0) {
      if (sign === 0) sign = Math.sign(cross);
      else if (Math.sign(cross) !== sign) return false;
    }
  }
  return true;
}

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}
