/**
 * Manual-edit primitives for the Photo-to-Design label map.
 *
 * All edits operate directly on the label map (`Int32Array` at the scaled
 * worker resolution). Each primitive mutates the map in place and returns a
 * description of what changed so the worker can re-extract contours + colors
 * only for the affected patches and emit an `editResult` diff.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Point, Patch, ProcessParams } from '@/types/photo-to-design';
import type { MatRegistry } from './mat-registry';
import { extractColors } from './color-extract';
import { detectNeighbors } from './neighbor-detect';

// ── Types ───────────────────────────────────────────────────────────────────

export interface SplitResult {
  success: boolean;
  /** IDs produced by the split. The first ID re-uses `patchId`. */
  newIds: number[];
  /** Error message if !success. */
  message?: string;
}

export interface FloodFillResult {
  /** The ID whose pixels were reassigned. */
  fromId: number;
  /** Target patch ID the pixels were written to. */
  toId: number;
  /** Number of pixels reassigned. */
  pixels: number;
}

export interface ContourData {
  patchId: number;
  points: Point[];
  pixelPoints: Point[];
  centroid: Point;
  area: number;
}

// ── Label-map helpers ───────────────────────────────────────────────────────

/**
 * Find the two patch IDs on either side of a boundary near `point`. Scans a
 * small neighborhood around the click and returns the two distinct non-zero
 * IDs found, or null if the click is inside a single patch. Used by Erase
 * Seam to turn a one-click boundary pick into a mergePatches call.
 */
export function findSeamPair(
  labelMat: any,
  width: number,
  height: number,
  point: Point,
  radius = 6
): { aId: number; bId: number } | null {
  const data = labelMat.data32S as Int32Array;
  const cx = Math.max(0, Math.min(width - 1, Math.round(point.x)));
  const cy = Math.max(0, Math.min(height - 1, Math.round(point.y)));

  const counts = new Map<number, number>();
  for (let dy = -radius; dy <= radius; dy++) {
    const y = cy + dy;
    if (y < 0 || y >= height) continue;
    for (let dx = -radius; dx <= radius; dx++) {
      const x = cx + dx;
      if (x < 0 || x >= width) continue;
      const id = data[y * width + x];
      if (id === 0) continue;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }

  if (counts.size < 2) return null;
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return { aId: sorted[0][0], bId: sorted[1][0] };
}

/** Read the label ID at an (x, y) pixel in the label map. */
export function labelAt(
  labelMat: any,
  width: number,
  height: number,
  x: number,
  y: number
): number {
  const ix = Math.max(0, Math.min(width - 1, Math.round(x)));
  const iy = Math.max(0, Math.min(height - 1, Math.round(y)));
  return labelMat.data32S[iy * width + ix];
}

/** Maximum existing patch ID in the label map. */
export function maxPatchId(labelMat: any, width: number, height: number): number {
  let max = 0;
  const data = labelMat.data32S as Int32Array;
  const n = width * height;
  for (let i = 0; i < n; i++) {
    if (data[i] > max) max = data[i];
  }
  return max;
}

// ── Contour extraction for a single patch ID ────────────────────────────────

/**
 * Extract a simplified polygon contour for a single patch ID from the label
 * map. Returns null if the patch has no pixels.
 */
export function extractPatchContour(
  cv: any,
  reg: MatRegistry,
  labelMat: any,
  patchId: number,
  width: number,
  height: number
): ContourData | null {
  const maskName = `edit-mask-${patchId}-${Date.now()}-${Math.random()}`;
  const mask = reg.create(maskName, height, width, cv.CV_8U) as any;
  mask.data.fill(0);

  const labelData = labelMat.data32S as Int32Array;
  let pixelCount = 0;
  for (let i = 0; i < height * width; i++) {
    if (labelData[i] === patchId) {
      mask.data[i] = 255;
      pixelCount++;
    }
  }

  if (pixelCount === 0) {
    reg.delete(maskName);
    return null;
  }

  const contoursVec = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(mask, contoursVec, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let largestIdx = -1;
  let largestLen = 0;
  for (let i = 0; i < contoursVec.size(); i++) {
    const contourMat = contoursVec.get(i);
    const len = cv.arcLength(contourMat, true);
    if (len > largestLen) {
      largestLen = len;
      largestIdx = i;
    }
    contourMat.delete();
  }

  if (largestIdx < 0) {
    reg.delete(maskName);
    contoursVec.delete();
    hierarchy.delete();
    return null;
  }

  const contourMat = contoursVec.get(largestIdx);
  const epsilon = 0.02 * cv.arcLength(contourMat, true);
  const approxName = `edit-approx-${patchId}-${Date.now()}-${Math.random()}`;
  const approx = reg.create(approxName) as any;
  cv.approxPolyDP(contourMat, approx, epsilon, true);

  const points: Point[] = [];
  const pixelPoints: Point[] = [];
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < approx.rows; i++) {
    const x = approx.intAt(i, 0);
    const y = approx.intAt(i, 1);
    points.push({ x, y });
    pixelPoints.push({ x, y });
    sumX += x;
    sumY += y;
  }

  const centroid: Point = {
    x: sumX / points.length,
    y: sumY / points.length,
  };
  const area = cv.contourArea(contourMat);

  reg.delete(maskName);
  reg.delete(approxName);
  contourMat.delete();
  contoursVec.delete();
  hierarchy.delete();

  return { patchId, points, pixelPoints, centroid, area };
}

// ── Split patch (Draw Seam) ─────────────────────────────────────────────────

/**
 * Split a patch along a line. The line is rasterized 2 px wide, subtracted
 * from the patch mask, and the remainder is connected-components labeled.
 * Returns { success: false } if the result is still one connected region
 * (line didn't cross the patch).
 */
export function splitPatchImpl(
  cv: any,
  reg: MatRegistry,
  labelMat: any,
  patchId: number,
  line: [Point, Point],
  width: number,
  height: number,
  snapAngles = true
): SplitResult {
  const labelData = labelMat.data32S as Int32Array;

  // Build mask of patch
  const maskName = `split-mask-${patchId}-${Date.now()}`;
  const mask = reg.create(maskName, height, width, cv.CV_8U) as any;
  mask.data.fill(0);
  let patchPixels = 0;
  for (let i = 0; i < height * width; i++) {
    if (labelData[i] === patchId) {
      mask.data[i] = 255;
      patchPixels++;
    }
  }
  if (patchPixels === 0) {
    reg.delete(maskName);
    return { success: false, newIds: [], message: 'Patch not found.' };
  }

  // Snap line angle to {0°, 45°, 90°, 135°} within 15° on release.
  const [p0raw, p1raw] = line;
  const [p0, p1] = snapAngles ? snapLineAngle(p0raw, p1raw) : [p0raw, p1raw];

  // Rasterize the line into a temp mask, 2 px wide, and subtract from patch mask.
  cv.line(
    mask,
    new cv.Point(Math.round(p0.x), Math.round(p0.y)),
    new cv.Point(Math.round(p1.x), Math.round(p1.y)),
    new cv.Scalar(0),
    2
  );

  // Connected components on the (now possibly-split) mask.
  const ccName = `split-cc-${patchId}-${Date.now()}`;
  const ccLabels = reg.create(ccName) as any;
  const numLabels = cv.connectedComponents(mask, ccLabels, 8, cv.CV_32S);

  // numLabels includes background (0). Need >= 3 for a valid split (0 + 2 regions).
  if (numLabels < 3) {
    reg.delete(maskName);
    reg.delete(ccName);
    return {
      success: false,
      newIds: [],
      message: "Line didn't split the patch. Draw it all the way across.",
    };
  }

  // Count pixels per component and ignore single-pixel noise (< ~1% of the patch).
  const counts = new Map<number, number>();
  for (let i = 0; i < height * width; i++) {
    const l = ccLabels.data32S[i];
    if (l === 0) continue;
    counts.set(l, (counts.get(l) || 0) + 1);
  }
  const minComponent = Math.max(8, Math.floor(patchPixels * 0.01));
  const validComponents = [...counts.entries()]
    .filter(([, c]) => c >= minComponent)
    .sort((a, b) => b[1] - a[1]);
  if (validComponents.length < 2) {
    reg.delete(maskName);
    reg.delete(ccName);
    return {
      success: false,
      newIds: [],
      message: "Line didn't split the patch. Draw it all the way across.",
    };
  }

  // First component keeps the original patchId; additional components get new IDs.
  const maxId = maxPatchId(labelMat, width, height);
  const newIds: number[] = [patchId];
  const assignment = new Map<number, number>();
  assignment.set(validComponents[0][0], patchId);
  let nextId = maxId + 1;
  for (let i = 1; i < validComponents.length; i++) {
    assignment.set(validComponents[i][0], nextId);
    newIds.push(nextId);
    nextId++;
  }

  // First pass: write new IDs where ccLabels is a valid component AND the
  // original label map value was patchId.
  for (let i = 0; i < height * width; i++) {
    if (labelData[i] !== patchId) continue;
    const cc = ccLabels.data32S[i];
    const id = assignment.get(cc);
    if (id !== undefined) {
      labelData[i] = id;
    }
  }

  // Second pass: absorb the 2-px "line" pixels (ccLabels==0 in the original
  // patch region) into any adjacent sub-region. Iterate up to 4 times —
  // plenty for a 2-px wide line.
  const acceptable = new Set<number>(assignment.values());
  for (let pass = 0; pass < 4; pass++) {
    let changedThisPass = 0;
    for (let i = 0; i < height * width; i++) {
      if (labelData[i] !== patchId) continue;
      const x = i % width;
      const y = (i / width) | 0;
      const nb = nearestAcceptableNeighbour(labelData, x, y, width, height, acceptable);
      if (nb !== null) {
        labelData[i] = nb;
        changedThisPass++;
      }
    }
    if (changedThisPass === 0) break;
  }

  reg.delete(maskName);
  reg.delete(ccName);
  return { success: true, newIds };
}

function nearestAcceptableNeighbour(
  labelData: Int32Array,
  x: number,
  y: number,
  width: number,
  height: number,
  acceptable: Set<number>
): number | null {
  const offsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dx, dy] of offsets) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
    const nv = labelData[ny * width + nx];
    if (acceptable.has(nv)) return nv;
  }
  return null;
}

/**
 * Snap a draw-seam line to the nearest of {0°, 45°, 90°, 135°} if within 15°.
 */
function snapLineAngle(p0: Point, p1: Point): [Point, Point] {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return [p0, p1];

  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
  const normalized = ((angleDeg % 180) + 180) % 180; // 0..180
  const snapTargets = [0, 45, 90, 135, 180];
  let nearest = normalized;
  let bestDiff = Infinity;
  for (const t of snapTargets) {
    const diff = Math.abs(normalized - t);
    if (diff < bestDiff) {
      bestDiff = diff;
      nearest = t;
    }
  }
  if (bestDiff > 15) return [p0, p1];
  const snappedDeg = nearest % 180; // 180 == 0
  const rad = (snappedDeg * Math.PI) / 180;
  const half = length / 2;
  const cx = (p0.x + p1.x) / 2;
  const cy = (p0.y + p1.y) / 2;
  // Preserve direction (sign of original vector projection on the snapped axis).
  const sign = Math.cos(Math.atan2(dy, dx) - rad) >= 0 ? 1 : -1;
  return [
    { x: cx - sign * half * Math.cos(rad), y: cy - sign * half * Math.sin(rad) },
    { x: cx + sign * half * Math.cos(rad), y: cy + sign * half * Math.sin(rad) },
  ];
}

// ── Merge patches (Erase Seam) ──────────────────────────────────────────────

/** Every pixel with value `bId` is relabeled as `aId`. */
export function mergePatchesImpl(
  labelMat: any,
  aId: number,
  bId: number,
  width: number,
  height: number
): number {
  if (aId === bId) return 0;
  const data = labelMat.data32S as Int32Array;
  const n = width * height;
  let changed = 0;
  for (let i = 0; i < n; i++) {
    if (data[i] === bId) {
      data[i] = aId;
      changed++;
    }
  }
  return changed;
}

// ── Flood fill (reassign a single connected region) ─────────────────────────

/**
 * Reassign the connected component of pixels-with-the-current-ID at `point`
 * to `targetId`. Only the component that includes `point` is touched —
 * disconnected pieces of the same ID elsewhere are preserved.
 */
export function floodFillImpl(
  cv: any,
  reg: MatRegistry,
  labelMat: any,
  point: Point,
  targetId: number,
  width: number,
  height: number
): FloodFillResult | null {
  const px = Math.round(point.x);
  const py = Math.round(point.y);
  if (px < 0 || px >= width || py < 0 || py >= height) return null;

  const labelData = labelMat.data32S as Int32Array;
  const fromId = labelData[py * width + px];
  if (fromId === 0 || fromId === targetId) return null;

  // Build binary mask of the source ID, then connectedComponents to find the
  // specific component containing (px, py).
  const maskName = `flood-mask-${Date.now()}`;
  const mask = reg.create(maskName, height, width, cv.CV_8U) as any;
  mask.data.fill(0);
  for (let i = 0; i < height * width; i++) {
    if (labelData[i] === fromId) mask.data[i] = 255;
  }

  const ccName = `flood-cc-${Date.now()}`;
  const ccLabels = reg.create(ccName) as any;
  cv.connectedComponents(mask, ccLabels, 8, cv.CV_32S);

  const componentId = ccLabels.data32S[py * width + px];
  if (componentId === 0) {
    reg.delete(maskName);
    reg.delete(ccName);
    return null;
  }

  let changed = 0;
  for (let i = 0; i < height * width; i++) {
    if (ccLabels.data32S[i] === componentId) {
      labelData[i] = targetId;
      changed++;
    }
  }

  reg.delete(maskName);
  reg.delete(ccName);
  return { fromId, toId: targetId, pixels: changed };
}

// ── Build Patch[] for a set of IDs from the current label map ───────────────

/**
 * For each ID in `ids` still present in the label map, extract a fresh
 * contour, convert to real-world + full-image-pixel coords, run color
 * extraction, and produce a `Patch`. Returns the updated patches plus the
 * subset of `ids` that no longer exist in the map (caller treats those as
 * removals).
 */
export function rebuildPatches(
  cv: any,
  reg: MatRegistry,
  labelMat: any,
  width: number,
  height: number,
  ids: number[],
  scale: number,
  params: ProcessParams,
  correctedImage: ImageData,
  existingTemplateIds: Map<number, string>
): { patches: Patch[]; removedIds: number[] } {
  const patches: Patch[] = [];
  const removedIds: number[] = [];

  // First extract contours for all requested IDs.
  const contours: ContourData[] = [];
  for (const id of ids) {
    const c = extractPatchContour(cv, reg, labelMat, id, width, height);
    if (!c) {
      removedIds.push(id);
      continue;
    }
    contours.push(c);
  }

  if (contours.length === 0) {
    return { patches, removedIds };
  }

  // Convert pixelPoints (scaled space) → full-image-pixel space: /scale.
  // Convert points (scaled space) → real-world: pxFullImage / pixelsPerUnit.
  const converted = contours.map((c) => {
    const pixelPoints = c.pixelPoints.map((p) => ({
      x: Math.round(p.x / scale),
      y: Math.round(p.y / scale),
    }));
    const realPts = c.points.map((p) => ({
      x: Math.round((p.x / scale / params.pixelsPerUnit) * 100) / 100,
      y: Math.round((p.y / scale / params.pixelsPerUnit) * 100) / 100,
    }));
    const centroid: Point = {
      x: Math.round((c.centroid.x / scale / params.pixelsPerUnit) * 100) / 100,
      y: Math.round((c.centroid.y / scale / params.pixelsPerUnit) * 100) / 100,
    };
    return {
      patchId: c.patchId,
      points: realPts,
      pixelPoints,
      centroid,
      area: c.area,
    };
  });

  // Per-patch color extraction — uses pixelPoints in original corrected-image space.
  const colorData = extractColors(cv, reg, correctedImage, converted);

  // Recompute neighbors for the whole label map once per edit and slice out
  // the subset relevant to the changed IDs. One linear scan is cheap (~ms).
  const allNeighbors = detectNeighbors(labelMat, width, height);

  for (const c of converted) {
    const colors = colorData.get(c.patchId);
    const templateId = existingTemplateIds.get(c.patchId) ?? `custom-${c.patchId}`;
    patches.push({
      id: c.patchId,
      templateId,
      polygon: c.points,
      pixelPolygon: c.pixelPoints,
      svgPath: pointsToSvgPath(c.points),
      centroid: c.centroid,
      area: c.area,
      vertexCount: c.points.length,
      dominantColor: colors?.dominantColor ?? '#888888',
      colorPalette: colors?.colorPalette ?? ['#888888', '#888888', '#888888'],
      fabricSwatch: colors?.fabricSwatch ?? '',
      neighbors: allNeighbors.get(c.patchId) ?? [],
    });
  }

  return { patches, removedIds };
}

function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  const cmds = points.map((p) => `L ${p.x},${p.y}`);
  cmds[0] = `M ${points[0].x},${points[0].y}`;
  cmds.push('Z');
  return cmds.join(' ');
}
