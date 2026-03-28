/**
 * Foundation Paper Piecing (FPP) Template Generator
 *
 * Parses SVG blocks into patches, determines sewing order via adjacency-based
 * topological sort, mirrors the design (FPP is sewn from the back), and
 * generates numbered templates.
 *
 * Pure computation — no React or Fabric.js dependency.
 */

import type { Point } from '@/lib/seam-allowance';

// ── Types ──────────────────────────────────────────────────────────

export interface FppPatch {
  readonly id: number;
  readonly vertices: Point[];
  readonly color: string;
  readonly sewingOrder: number;
  readonly adjacentPatches: number[];
}

export interface FppBlock {
  readonly name: string;
  readonly patches: FppPatch[];
  readonly width: number;
  readonly height: number;
}

export interface FppTemplateOptions {
  readonly paperSize: 'letter' | 'a4';
  readonly seamAllowance: number;
  readonly showColors: boolean;
  readonly showNumbers: boolean;
  readonly mirrorDesign: boolean;
}

// ── SVG Parsing ────────────────────────────────────────────────────

function parsePolygonPoints(pointsStr: string): Point[] {
  return pointsStr
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return { x, y };
    });
}

function parseRectToVertices(attrs: Record<string, string>): Point[] {
  const x = parseFloat(attrs.x ?? '0');
  const y = parseFloat(attrs.y ?? '0');
  const w = parseFloat(attrs.width ?? '0');
  const h = parseFloat(attrs.height ?? '0');
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
}

const DANGEROUS_ATTRS = new Set([
  'onload',
  'onerror',
  'onclick',
  'onmouseover',
  'onfocus',
  'onblur',
  'onmouseout',
  'onmousedown',
  'onmouseup',
  'onkeydown',
  'onkeyup',
  'onkeypress',
  'onsubmit',
  'onreset',
  'onchange',
  'oninput',
]);

function extractAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)="([^"]*?)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(tag)) !== null) {
    if (DANGEROUS_ATTRS.has(match[1].toLowerCase())) continue;
    if (match[2].toLowerCase().trimStart().startsWith('javascript:')) continue;
    attrs[match[1]] = match[2];
  }
  return attrs;
}

/**
 * Parse an SVG string into an array of FPP patches.
 * Extracts polygon and rect elements as individual patches.
 */
export function parseSvgToPatches(svgData: string): FppPatch[] {
  const patches: FppPatch[] = [];
  let id = 1;

  // Extract polygon elements
  const polygonRegex = /<polygon\s+([^>]*?)\/?\s*>/gi;
  let match: RegExpExecArray | null;

  while ((match = polygonRegex.exec(svgData)) !== null) {
    const attrs = extractAttributes(match[1]);
    const pointsStr = attrs.points;
    if (!pointsStr) continue;

    const vertices = parsePolygonPoints(pointsStr);
    const color = attrs.fill ?? '#888888';

    patches.push({
      id,
      vertices,
      color,
      sewingOrder: 0,
      adjacentPatches: [],
    });
    id++;
  }

  // Extract rect elements
  const rectRegex = /<rect\s+([^>]*?)\/?\s*>/gi;
  while ((match = rectRegex.exec(svgData)) !== null) {
    const attrs = extractAttributes(match[1]);
    const vertices = parseRectToVertices(attrs);
    const color = attrs.fill ?? '#888888';

    // Skip viewBox-level rects (background)
    if (vertices.every((v) => v.x === 0 || v.y === 0)) {
      const w = parseFloat(attrs.width ?? '0');
      const h = parseFloat(attrs.height ?? '0');
      if (
        w >= 100 &&
        h >= 100 &&
        parseFloat(attrs.x ?? '0') === 0 &&
        parseFloat(attrs.y ?? '0') === 0
      ) {
        continue;
      }
    }

    patches.push({
      id,
      vertices,
      color,
      sewingOrder: 0,
      adjacentPatches: [],
    });
    id++;
  }

  return patches;
}

// ── Adjacency Detection ────────────────────────────────────────────

const ADJACENCY_THRESHOLD = 2.0; // Pixels

function edgesFromVertices(vertices: Point[]): Array<[Point, Point]> {
  const edges: Array<[Point, Point]> = [];
  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    edges.push([vertices[i], vertices[next]]);
  }
  return edges;
}

function edgesOverlap(e1: [Point, Point], e2: [Point, Point], threshold: number): boolean {
  // Check if two edges share a significant portion of their length
  // Simplified: check if endpoints of one edge are close to the other edge's line
  const dist1 = pointToSegmentDistance(e1[0], e2[0], e2[1]);
  const dist2 = pointToSegmentDistance(e1[1], e2[0], e2[1]);
  const dist3 = pointToSegmentDistance(e2[0], e1[0], e1[1]);
  const dist4 = pointToSegmentDistance(e2[1], e1[0], e1[1]);

  return (
    (dist1 < threshold && dist2 < threshold) ||
    (dist3 < threshold && dist4 < threshold) ||
    (dist1 < threshold && dist3 < threshold) ||
    (dist2 < threshold && dist4 < threshold)
  );
}

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  }

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;

  return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
}

function buildAdjacencyGraph(patches: FppPatch[]): Map<number, Set<number>> {
  const graph = new Map<number, Set<number>>();

  for (const patch of patches) {
    graph.set(patch.id, new Set());
  }

  for (let i = 0; i < patches.length; i++) {
    const edgesA = edgesFromVertices(patches[i].vertices);
    for (let j = i + 1; j < patches.length; j++) {
      const edgesB = edgesFromVertices(patches[j].vertices);

      let adjacent = false;
      for (const eA of edgesA) {
        for (const eB of edgesB) {
          if (edgesOverlap(eA, eB, ADJACENCY_THRESHOLD)) {
            adjacent = true;
            break;
          }
        }
        if (adjacent) break;
      }

      if (adjacent) {
        graph.get(patches[i].id)!.add(patches[j].id);
        graph.get(patches[j].id)!.add(patches[i].id);
      }
    }
  }

  return graph;
}

// ── Sewing Order (BFS from largest patch) ──────────────────────────

function patchArea(vertices: Point[]): number {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Determine sewing order for FPP patches using BFS from the largest patch.
 * Each new patch must share an edge with the already-sewn group.
 */
export function computeSewingOrder(patches: FppPatch[]): FppPatch[] {
  if (patches.length === 0) return [];
  if (patches.length === 1) {
    return [{ ...patches[0], sewingOrder: 1, adjacentPatches: [] }];
  }

  const graph = buildAdjacencyGraph(patches);

  // Start from the largest patch
  let startId = patches[0].id;
  let maxArea = 0;
  for (const patch of patches) {
    const area = patchArea(patch.vertices);
    if (area > maxArea) {
      maxArea = area;
      startId = patch.id;
    }
  }

  // BFS for sewing order
  const visited = new Set<number>();
  const queue: number[] = [startId];
  visited.add(startId);
  const orderMap = new Map<number, number>();
  let order = 1;

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    orderMap.set(currentId, order++);

    const neighbors = graph.get(currentId) ?? new Set();
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
  }

  // Handle disconnected patches (assign remaining orders)
  for (const patch of patches) {
    if (!orderMap.has(patch.id)) {
      orderMap.set(patch.id, order++);
    }
  }

  return patches.map((patch) => ({
    ...patch,
    sewingOrder: orderMap.get(patch.id) ?? patch.id,
    adjacentPatches: Array.from(graph.get(patch.id) ?? []),
  }));
}

// ── Mirror ─────────────────────────────────────────────────────────

/**
 * Mirror all patches horizontally for FPP (sewing on the back).
 * Creates new objects without mutating originals.
 */
export function mirrorPatches(patches: FppPatch[], blockWidth: number): FppPatch[] {
  return patches.map((patch) => ({
    ...patch,
    vertices: patch.vertices.map((v) => ({
      x: blockWidth - v.x,
      y: v.y,
    })),
  }));
}
