/**
 * Post-A: Grid detection.
 *
 * Analyzes the label map to determine whether the quilt follows a regular
 * repeating grid (rectangular, triangular, hexagonal) or is freeform (none).
 *
 * Algorithm:
 *  1. Extract boundary segments between patches.
 *  2. Build angle histogram → find dominant angles.
 *  3. Project boundary segments onto perpendicular axes → find grid line positions.
 *  4. Check regularity of spacing (CV = std/mean < 0.15).
 *  5. Compute confidence (fraction of boundary length near detected grid lines).
 *  6. Classify grid type.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { DetectedGrid } from '@/types/photo-to-design';
import type { MatRegistry } from './mat-registry';

/**
 * Detect grid structure from a label map.
 *
 * @param cv       — OpenCV runtime
 * @param reg      — MatRegistry
 * @param labelMat — label map (CV_32S, h×w)
 * @param width    — image width
 * @param height   — image height
 * @returns DetectedGrid
 */
export function detectGrid(
  cv: any,
  reg: MatRegistry,
  labelMat: any,
  width: number,
  height: number
): DetectedGrid {
  // Step 1: Extract boundary segments
  const segments = extractBoundarySegments(labelMat, width, height);

  if (segments.length < 10) {
    return { type: 'none', dominantAngles: [], spacings: [], confidence: 0 };
  }

  // Step 2: Angle histogram → dominant angles
  const dominantAngles = findDominantAngles(segments);

  if (dominantAngles.length < 2) {
    return {
      type: 'none',
      dominantAngles: dominantAngles.map((a) => a.angle * (180 / Math.PI)),
      spacings: [],
      confidence: 0,
    };
  }

  // Step 3: Grid line positions and regularity
  const spacings = computeGridSpacings(segments, dominantAngles, width, height);

  // Step 4: Check regularity (CV < 0.15)
  const regularSpacings = spacings.filter((s) => {
    if (s.spacings.length < 3) return false;
    const mean = s.spacings.reduce((a, b) => a + b, 0) / s.spacings.length;
    if (mean === 0) return false;
    const variance = s.spacings.reduce((sum, sp) => sum + (sp - mean) ** 2, 0) / s.spacings.length;
    const std = Math.sqrt(variance);
    return std / mean < 0.15;
  });

  // Step 5: Confidence
  const confidence = computeConfidence(segments, regularSpacings, width, height);

  // Step 6: Classify
  let gridType: DetectedGrid['type'] = 'none';

  if (confidence > 0.5 && regularSpacings.length >= 2) {
    const angles = regularSpacings.map((s) => s.angle * (180 / Math.PI));
    const diff = angleDiff(angles[0], angles[1]);

    if (diff > 80 && diff < 100) {
      gridType = 'rectangular';
    } else if (diff > 50 && diff < 70) {
      gridType = 'triangular';
    } else if (diff > 110 && diff < 130) {
      gridType = 'hexagonal';
    }
  }

  return {
    type: gridType,
    dominantAngles: dominantAngles.map((a) => a.angle * (180 / Math.PI)),
    spacings: regularSpacings.map((s) => ({
      angle: s.angle * (180 / Math.PI),
      spacing: s.meanSpacing,
    })),
    confidence,
  };
}

// ── Boundary segment extraction ─────────────────────────────────────────────

interface BoundarySegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
  length: number;
}

function extractBoundarySegments(labelMat: any, width: number, height: number): BoundarySegment[] {
  const segments: BoundarySegment[] = [];

  // Walk label map: find pixels where neighbor has different ID
  // We'll group connected boundary pixels into segments
  const visited = new Uint8Array(width * height);

  // Horizontal boundaries (x, y) vs (x+1, y)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idx = y * width + x;
      if (labelMat.data32S[idx] !== labelMat.data32S[idx + 1]) {
        if (!visited[idx]) {
          const segment = growBoundarySegment(labelMat, visited, width, height, x, y, 'horizontal');
          if (segment && segment.length > 3) {
            segments.push(segment);
          }
        }
      }
    }
  }

  // Vertical boundaries (x, y) vs (x, y+1)
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (labelMat.data32S[idx] !== labelMat.data32S[idx + width]) {
        if (!visited[idx]) {
          const segment = growBoundarySegment(labelMat, visited, width, height, x, y, 'vertical');
          if (segment && segment.length > 3) {
            segments.push(segment);
          }
        }
      }
    }
  }

  return segments;
}

function growBoundarySegment(
  labelMat: any,
  visited: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
  _direction: 'horizontal' | 'vertical'
): BoundarySegment | null {
  const points: Array<{ x: number; y: number }> = [];
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  // BFS limited to connected boundary pixels
  const maxPoints = 200;
  while (queue.length > 0 && points.length < maxPoints) {
    const { x, y } = queue.shift()!;
    const idx = y * width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;
    points.push({ x, y });

    // Check 4-connected neighbors that are also boundaries
    const neighbors = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];

    for (const n of neighbors) {
      if (n.x < 0 || n.x >= width || n.y < 0 || n.y >= height) continue;
      const nIdx = n.y * width + n.x;
      if (visited[nIdx]) continue;

      // Check if this is also a boundary
      const isBoundary =
        (n.x < width - 1 && labelMat.data32S[nIdx] !== labelMat.data32S[nIdx + 1]) ||
        (n.x > 0 && labelMat.data32S[nIdx] !== labelMat.data32S[nIdx - 1]) ||
        (n.y < height - 1 && labelMat.data32S[nIdx] !== labelMat.data32S[nIdx + width]) ||
        (n.y > 0 && labelMat.data32S[nIdx] !== labelMat.data32S[nIdx - width]);

      if (isBoundary) {
        queue.push(n);
      }
    }
  }

  if (points.length < 3) return null;

  // Compute segment angle (PCA-like: direction of maximum variance)
  let sumX = 0,
    sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }
  const cx = sumX / points.length;
  const cy = sumY / points.length;

  // Covariance matrix
  let covXX = 0,
    covXY = 0,
    covYY = 0;
  for (const p of points) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    covXX += dx * dx;
    covXY += dx * dy;
    covYY += dy * dy;
  }

  // Principal eigenvector
  const trace = covXX + covYY;
  const det = covXX * covYY - covXY * covXY;
  const disc = Math.sqrt(Math.max(0, (trace / 2) ** 2 - det));
  const lambda1 = trace / 2 + disc;

  const dirX = lambda1 - covYY;
  const dirY = covXY;
  const len = Math.sqrt(dirX * dirX + dirY * dirY);

  if (len < 0.001) return null;

  const angle = Math.atan2(dirY, dirX);
  // Normalize to [0, PI)
  const normalizedAngle = angle < 0 ? angle + Math.PI : angle;

  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));

  return {
    x1: cx,
    y1: cy,
    x2: cx + dirX,
    y2: cy + dirY,
    angle: normalizedAngle,
    length: Math.hypot(maxX - minX, maxY - minY),
  };
}

// ── Dominant angle detection ────────────────────────────────────────────────

interface AnglePeak {
  angle: number;
  weight: number;
}

function findDominantAngles(segments: BoundarySegment[]): AnglePeak[] {
  // Build angle histogram (180 bins, 0°..179°)
  const bins = 180;
  const histogram = new Float64Array(bins);

  for (const seg of segments) {
    const deg = seg.angle * (180 / Math.PI);
    const bin = Math.round(deg) % bins;
    histogram[bin] += seg.length;
  }

  // Smooth with Gaussian σ=2°
  const smoothed = gaussianSmooth(histogram, 2);

  // Find peaks
  const peaks: AnglePeak[] = [];
  for (let i = 1; i < bins - 1; i++) {
    if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1] && smoothed[i] > 0) {
      peaks.push({ angle: (i * Math.PI) / 180, weight: smoothed[i] });
    }
  }

  // Sort by weight, take top peaks
  peaks.sort((a, b) => b.weight - a.weight);

  // Filter peaks that are too close (< 10° apart)
  const filtered: AnglePeak[] = [];
  for (const peak of peaks) {
    const tooClose = filtered.some((f) => {
      const diff = angleDiff(peak.angle, f.angle);
      return diff < 10 * (Math.PI / 180);
    });
    if (!tooClose) {
      filtered.push(peak);
    }
  }

  return filtered.slice(0, 4);
}

function gaussianSmooth(data: Float64Array, sigma: number): Float64Array {
  const result = new Float64Array(data.length);
  const radius = Math.ceil(sigma * 3);

  // Precompute Gaussian kernel
  const kernel: number[] = [];
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const g = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(g);
    sum += g;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

  for (let i = 0; i < data.length; i++) {
    let val = 0;
    for (let j = 0; j < kernel.length; j++) {
      const idx = i + j - radius;
      const wrapped = ((idx % data.length) + data.length) % data.length;
      val += data[wrapped] * kernel[j];
    }
    result[i] = val;
  }

  return result;
}

// ── Grid spacing computation ────────────────────────────────────────────────

interface GridSpacing {
  angle: number;
  spacings: number[];
  meanSpacing: number;
}

function computeGridSpacings(
  segments: BoundarySegment[],
  dominantAngles: AnglePeak[],
  width: number,
  _height: number
): GridSpacing[] {
  const results: GridSpacing[] = [];

  for (const anglePeak of dominantAngles) {
    // Project boundary segments onto perpendicular axis
    const perpAngle = anglePeak.angle + Math.PI / 2;
    const cos = Math.cos(perpAngle);
    const sin = Math.sin(perpAngle);

    const projections: number[] = [];
    for (const seg of segments) {
      // Check if segment angle is close to the dominant angle
      const diff = angleDiff(seg.angle, anglePeak.angle);
      if (diff > 15 * (Math.PI / 180)) continue;

      // Project midpoint onto perpendicular axis
      const proj = seg.x1 * cos + seg.y1 * sin;
      projections.push(proj);
    }

    if (projections.length < 3) continue;

    // Build histogram of projections
    projections.sort((a, b) => a - b);
    const min = projections[0];
    const max = projections[projections.length - 1];
    const range = max - min;
    if (range < 1) continue;

    const binSize = Math.max(5, range / 50);
    const numBins = Math.ceil(range / binSize) + 1;
    const projHist = new Float64Array(numBins);

    for (const p of projections) {
      const bin = Math.floor((p - min) / binSize);
      if (bin >= 0 && bin < numBins) {
        projHist[bin]++;
      }
    }

    // Find peaks in projection histogram
    const peakPositions: number[] = [];
    for (let i = 1; i < numBins - 1; i++) {
      if (projHist[i] > projHist[i - 1] && projHist[i] > projHist[i + 1] && projHist[i] > 2) {
        peakPositions.push(min + i * binSize);
      }
    }

    if (peakPositions.length < 3) continue;

    // Compute spacings between adjacent peaks
    peakPositions.sort((a, b) => a - b);
    const spacings: number[] = [];
    for (let i = 1; i < peakPositions.length; i++) {
      spacings.push(peakPositions[i] - peakPositions[i - 1]);
    }

    const meanSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;

    results.push({ angle: anglePeak.angle, spacings, meanSpacing });
  }

  return results;
}

// ── Confidence computation ──────────────────────────────────────────────────

function computeConfidence(
  segments: BoundarySegment[],
  regularSpacings: GridSpacing[],
  width: number,
  height: number
): number {
  if (regularSpacings.length === 0) return 0;

  // What fraction of total boundary length falls within tolerance of a grid line?
  const tolerance = Math.min(width, height) * 0.03; // 3% of image size
  let nearGridLength = 0;
  let totalLength = 0;

  for (const seg of segments) {
    totalLength += seg.length;

    for (const gs of regularSpacings) {
      // Check if segment angle is close to grid angle
      const angleDiffVal = angleDiff(seg.angle, gs.angle);
      if (angleDiffVal > 15 * (Math.PI / 180)) continue;

      // Segment is aligned with grid — count it
      nearGridLength += seg.length;
      break;
    }
  }

  return totalLength > 0 ? nearGridLength / totalLength : 0;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Smallest angle difference between two angles in [0, PI). */
function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % Math.PI;
  if (diff > Math.PI / 2) diff = Math.PI - diff;
  return diff;
}
