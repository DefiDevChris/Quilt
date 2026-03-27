/**
 * Grid/structure detection for quilt photos.
 * Hough transform + line clustering → grid extraction.
 */

import type { GrayscaleBuffer } from '@/lib/ocr/image-preprocess';
import type {
  DetectedLine,
  DetectedGrid,
  GridIntersection,
  LayoutClassification,
} from '@/types/quilt-ocr';

// --- Hough transform for line detection ---

export function houghTransform(
  edges: GrayscaleBuffer,
  threshold: number = 80,
  thetaResolution: number = 1
): readonly DetectedLine[] {
  const { width, height, data } = edges;
  const maxRho = Math.ceil(Math.sqrt(width * width + height * height));
  const thetaSteps = Math.ceil(180 / thetaResolution);
  const accumulator = new Uint32Array(2 * maxRho * thetaSteps);

  // Pre-compute sin/cos tables
  const sinTable = new Float64Array(thetaSteps);
  const cosTable = new Float64Array(thetaSteps);
  for (let t = 0; t < thetaSteps; t++) {
    const theta = (t * Math.PI) / thetaSteps;
    sinTable[t] = Math.sin(theta);
    cosTable[t] = Math.cos(theta);
  }

  // Vote for each edge pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] === 0) continue;

      for (let t = 0; t < thetaSteps; t++) {
        const rho = Math.round(x * cosTable[t] + y * sinTable[t]);
        const rhoIndex = rho + maxRho;
        accumulator[rhoIndex * thetaSteps + t]++;
      }
    }
  }

  // Extract lines above threshold
  const lines: DetectedLine[] = [];
  for (let r = 0; r < 2 * maxRho; r++) {
    for (let t = 0; t < thetaSteps; t++) {
      const votes = accumulator[r * thetaSteps + t];
      if (votes >= threshold) {
        lines.push({
          rho: r - maxRho,
          theta: (t * Math.PI) / thetaSteps,
          votes,
        });
      }
    }
  }

  // Sort by votes descending
  return [...lines].sort((a, b) => b.votes - a.votes);
}

// --- Line clustering ---

export function clusterLines(
  lines: readonly DetectedLine[],
  rhoTolerance: number = 15,
  thetaTolerance: number = 0.1
): readonly DetectedLine[] {
  if (lines.length === 0) return [];

  const clusters: { lines: DetectedLine[]; avgRho: number; avgTheta: number }[] = [];

  for (const line of lines) {
    let merged = false;
    for (const cluster of clusters) {
      if (
        Math.abs(line.rho - cluster.avgRho) < rhoTolerance &&
        Math.abs(line.theta - cluster.avgTheta) < thetaTolerance
      ) {
        cluster.lines.push(line);
        const totalVotes = cluster.lines.reduce((sum, l) => sum + l.votes, 0);
        cluster.avgRho = cluster.lines.reduce((sum, l) => sum + l.rho * l.votes, 0) / totalVotes;
        cluster.avgTheta =
          cluster.lines.reduce((sum, l) => sum + l.theta * l.votes, 0) / totalVotes;
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push({
        lines: [line],
        avgRho: line.rho,
        avgTheta: line.theta,
      });
    }
  }

  return clusters.map((c) => ({
    rho: c.avgRho,
    theta: c.avgTheta,
    votes: c.lines.reduce((sum, l) => sum + l.votes, 0),
  }));
}

// --- Separate horizontal and vertical lines ---

export function separateLines(lines: readonly DetectedLine[]): {
  readonly horizontal: readonly DetectedLine[];
  readonly vertical: readonly DetectedLine[];
} {
  const horizontal: DetectedLine[] = [];
  const vertical: DetectedLine[] = [];

  for (const line of lines) {
    // Near-horizontal: theta ≈ π/2 (±15°)
    if (Math.abs(line.theta - Math.PI / 2) < Math.PI / 12) {
      horizontal.push(line);
    }
    // Near-vertical: theta ≈ 0 or π (±15°)
    else if (line.theta < Math.PI / 12 || line.theta > (11 * Math.PI) / 12) {
      vertical.push(line);
    }
  }

  return {
    horizontal: [...horizontal].sort((a, b) => a.rho - b.rho),
    vertical: [...vertical].sort((a, b) => a.rho - b.rho),
  };
}

// --- Compute grid intersections ---

export function computeIntersections(
  horizontalRhos: readonly number[],
  verticalRhos: readonly number[]
): readonly GridIntersection[] {
  const intersections: GridIntersection[] = [];

  for (const hRho of horizontalRhos) {
    for (const vRho of verticalRhos) {
      intersections.push({ x: vRho, y: hRho });
    }
  }

  return intersections;
}

// --- Detect uniform grid spacing ---

function computeSpacing(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const gaps: number[] = [];
  for (let i = 1; i < values.length; i++) {
    gaps.push(values[i] - values[i - 1]);
  }
  return gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
}

function spacingVariance(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const avg = computeSpacing(values);
  const gaps: number[] = [];
  for (let i = 1; i < values.length; i++) {
    gaps.push(values[i] - values[i - 1]);
  }
  const variance = gaps.reduce((sum, g) => sum + (g - avg) * (g - avg), 0) / gaps.length;
  return Math.sqrt(variance);
}

// --- Classify layout type ---

export function classifyLayout(
  horizontalRhos: readonly number[],
  verticalRhos: readonly number[],
  _imageWidth: number,
  _imageHeight: number
): LayoutClassification {
  const hSpacing = computeSpacing(horizontalRhos);
  const vSpacing = computeSpacing(verticalRhos);
  const hVariance = spacingVariance(horizontalRhos);
  const vVariance = spacingVariance(verticalRhos);

  // If very few lines detected, likely free-form
  if (horizontalRhos.length < 2 || verticalRhos.length < 2) {
    return 'free-form';
  }

  // Check if spacing is uniform (low variance relative to mean)
  const hUniform = hVariance / (hSpacing || 1) < 0.2;
  const vUniform = vVariance / (vSpacing || 1) < 0.2;

  // Check if grid is rotated (on-point)
  const aspectRatio = hSpacing / (vSpacing || 1);
  const isSquareGrid = Math.abs(aspectRatio - 1.0) < 0.15;

  // Check for sashing (alternating wide/narrow spacing)
  const hasAlternatingH = hasAlternatingSpacing(horizontalRhos);
  const hasAlternatingV = hasAlternatingSpacing(verticalRhos);

  if (hasAlternatingH || hasAlternatingV) {
    return 'sashing';
  }

  if (hUniform && vUniform && isSquareGrid) {
    return 'grid';
  }

  if (hUniform && vUniform) {
    return 'grid';
  }

  return 'free-form';
}

function hasAlternatingSpacing(values: readonly number[]): boolean {
  if (values.length < 4) return false;
  const gaps: number[] = [];
  for (let i = 1; i < values.length; i++) {
    gaps.push(values[i] - values[i - 1]);
  }

  // Check if gaps alternate between two values
  const evenGaps = gaps.filter((_, i) => i % 2 === 0);
  const oddGaps = gaps.filter((_, i) => i % 2 === 1);

  if (evenGaps.length === 0 || oddGaps.length === 0) return false;

  const evenAvg = evenGaps.reduce((s, g) => s + g, 0) / evenGaps.length;
  const oddAvg = oddGaps.reduce((s, g) => s + g, 0) / oddGaps.length;

  // Different average spacing AND each set is internally consistent
  const ratio = Math.abs(evenAvg - oddAvg) / Math.max(evenAvg, oddAvg);
  return ratio > 0.3;
}

// --- Build complete grid from detected lines ---

export function buildGrid(
  edges: GrayscaleBuffer,
  houghThreshold: number = 80,
  minLineGap: number = 10
): DetectedGrid {
  const rawLines = houghTransform(edges, houghThreshold);
  const clustered = clusterLines(rawLines, minLineGap);
  const { horizontal, vertical } = separateLines(clustered);

  const horizontalRhos = horizontal.map((l) => l.rho);
  const verticalRhos = vertical.map((l) => l.rho);

  const layoutType = classifyLayout(horizontalRhos, verticalRhos, edges.width, edges.height);

  const intersections = computeIntersections(horizontalRhos, verticalRhos);

  const rows = Math.max(0, horizontalRhos.length - 1);
  const cols = Math.max(0, verticalRhos.length - 1);
  const cellWidth = cols > 0 ? computeSpacing(verticalRhos) : 0;
  const cellHeight = rows > 0 ? computeSpacing(horizontalRhos) : 0;

  // Confidence based on grid regularity
  const hVar = spacingVariance(horizontalRhos);
  const vVar = spacingVariance(verticalRhos);
  const avgSpacing = (cellWidth + cellHeight) / 2;
  const avgVar = (hVar + vVar) / 2;
  const confidence = avgSpacing > 0 ? Math.max(0, Math.min(1, 1 - avgVar / avgSpacing)) : 0;

  return {
    rows,
    cols,
    cellWidth,
    cellHeight,
    horizontalLines: horizontalRhos,
    verticalLines: verticalRhos,
    intersections,
    layoutType,
    confidence,
  };
}
