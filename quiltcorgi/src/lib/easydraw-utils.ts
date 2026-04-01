/**
 * EasyDraw Engine — Planar graph face traversal for quilt block seam-line drawing.
 *
 * Given a set of seam-line segments within a rectangular grid, computes all closed
 * regions (patches) using a half-edge data structure and face traversal algorithm.
 * Pure logic — no React, Fabric.js, or DOM dependencies.
 */

import { gcd } from './math-utils';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GridPoint {
  readonly row: number;
  readonly col: number;
}

export interface Segment {
  readonly from: GridPoint;
  readonly to: GridPoint;
}

export interface ArcSegment {
  readonly from: GridPoint;
  readonly to: GridPoint;
  readonly center: GridPoint;
  readonly clockwise: boolean;
}

export type DrawSegment = Segment | ArcSegment;

export interface Patch {
  readonly id: string;
  readonly vertices: readonly { x: number; y: number }[];
  readonly path: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function pointKey(p: GridPoint): string {
  return `${p.row},${p.col}`;
}

function comparePoints(a: GridPoint, b: GridPoint): number {
  return a.row !== b.row ? a.row - b.row : a.col - b.col;
}

// ─── Segment utilities ──────────────────────────────────────────────────────

export function normalizeSegment(seg: Segment): Segment {
  const cmp = comparePoints(seg.from, seg.to);
  if (cmp <= 0) return { from: { ...seg.from }, to: { ...seg.to } };
  return { from: { ...seg.to }, to: { ...seg.from } };
}

export function segmentsEqual(a: Segment, b: Segment): boolean {
  const na = normalizeSegment(a);
  const nb = normalizeSegment(b);
  return (
    na.from.row === nb.from.row &&
    na.from.col === nb.from.col &&
    na.to.row === nb.to.row &&
    na.to.col === nb.to.col
  );
}

// ─── Boundary generation ────────────────────────────────────────────────────

export function addBoundarySegments(gridCols: number, gridRows: number): Segment[] {
  // Validate inputs
  if (!Number.isFinite(gridCols) || !Number.isFinite(gridRows)) {
    throw new Error('gridCols and gridRows must be finite numbers');
  }
  if (gridCols <= 0 || gridRows <= 0) {
    return [];
  }

  const segments: Segment[] = [];

  // Top edge
  for (let c = 0; c < gridCols; c++) {
    segments.push({ from: { row: 0, col: c }, to: { row: 0, col: c + 1 } });
  }
  // Bottom edge
  for (let c = 0; c < gridCols; c++) {
    segments.push({ from: { row: gridRows, col: c }, to: { row: gridRows, col: c + 1 } });
  }
  // Left edge
  for (let r = 0; r < gridRows; r++) {
    segments.push({ from: { row: r, col: 0 }, to: { row: r + 1, col: 0 } });
  }
  // Right edge
  for (let r = 0; r < gridRows; r++) {
    segments.push({ from: { row: r, col: gridCols }, to: { row: r + 1, col: gridCols } });
  }

  return segments;
}

// ─── Coordinate conversion ──────────────────────────────────────────────────

export function gridPointToPixel(gp: GridPoint, gridSize: number): { x: number; y: number } {
  return { x: gp.col * gridSize, y: gp.row * gridSize };
}

// ─── Area computation (shoelace formula) ────────────────────────────────────

export function patchArea(patch: Patch): number {
  const verts = patch.vertices;
  const n = verts.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += verts[i].x * verts[j].y;
    area -= verts[j].x * verts[i].y;
  }
  return Math.abs(area) / 2;
}

// ─── Signed area (for winding detection) ────────────────────────────────────

function signedArea(vertices: { x: number; y: number }[]): number {
  const n = vertices.length;
  if (n < 3) return 0;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return area / 2;
}

// ─── Arc SVG path ───────────────────────────────────────────────────────────

export function arcToPath(arc: ArcSegment, gridSize: number): string {
  const start = gridPointToPixel(arc.from, gridSize);
  const end = gridPointToPixel(arc.to, gridSize);
  const center = gridPointToPixel(arc.center, gridSize);

  const dx = start.x - center.x;
  const dy = start.y - center.y;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const sweepFlag = arc.clockwise ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${end.x} ${end.y}`;
}

// ─── Half-edge face traversal ───────────────────────────────────────────────

interface HalfEdge {
  readonly from: string; // pointKey
  readonly to: string; // pointKey
}

/**
 * Build a planar subdivision from segments and extract all faces (patches).
 *
 * Algorithm:
 * 1. Split segments that cross intermediate grid points
 * 2. Combine with boundary segments
 * 3. Deduplicate
 * 4. Build half-edge structure (each undirected edge → 2 directed half-edges)
 * 5. At each vertex, sort outgoing half-edges by angle
 * 6. For each unvisited half-edge, follow the "turn right" rule to trace a face
 * 7. Discard the outer (infinite) face
 */
export function detectPatches(
  segments: readonly DrawSegment[],
  gridCols: number,
  gridRows: number
): Patch[] {
  // Collect all line segments (splitting longer ones at grid intersections)
  const allSegments: Segment[] = [];

  for (const seg of segments) {
    if ('center' in seg) {
      // Arc segments contribute their endpoints as a straight connection for face detection
      allSegments.push({ from: seg.from, to: seg.to });
    } else {
      // Split segment at intermediate grid points
      const split = splitSegmentAtGridPoints(seg);
      allSegments.push(...split);
    }
  }

  // Add boundary segments
  const boundaries = addBoundarySegments(gridCols, gridRows);
  allSegments.push(...boundaries);

  // Deduplicate
  const unique = deduplicateSegments(allSegments);

  // Build adjacency: vertex → sorted list of neighbor vertices
  const adj = buildAdjacency(unique, gridCols, gridRows);

  // Build half-edges
  const halfEdges: HalfEdge[] = [];
  const halfEdgeMap = new Map<string, HalfEdge>();

  for (const seg of unique) {
    const fk = pointKey(seg.from);
    const tk = pointKey(seg.to);
    const forward: HalfEdge = { from: fk, to: tk };
    const backward: HalfEdge = { from: tk, to: fk };
    halfEdges.push(forward, backward);
    halfEdgeMap.set(`${fk}->${tk}`, forward);
    halfEdgeMap.set(`${tk}->${fk}`, backward);
  }

  // Sort neighbors at each vertex by angle
  const sortedNeighbors = new Map<string, string[]>();
  for (const [vertex, neighbors] of adj.entries()) {
    const vp = parseKey(vertex);
    const sorted = [...neighbors].sort((a, b) => {
      const ap = parseKey(a);
      const bp = parseKey(b);
      const angleA = Math.atan2(ap.y - vp.y, ap.x - vp.x);
      const angleB = Math.atan2(bp.y - vp.y, bp.x - vp.x);
      return angleA - angleB;
    });
    sortedNeighbors.set(vertex, sorted);
  }

  // Trace faces — use a Set instead of mutable visited flag
  const faces: string[][] = [];
  const visited = new Set<string>();

  function edgeKey(he: HalfEdge): string {
    return `${he.from}->${he.to}`;
  }

  for (const he of halfEdges) {
    if (visited.has(edgeKey(he))) continue;

    const face: string[] = [];
    let current = he;

    while (!visited.has(edgeKey(current))) {
      visited.add(edgeKey(current));
      face.push(current.from);

      // Find next half-edge: at current.to, find the incoming edge reversed,
      // then pick the next edge clockwise (the one after the reverse in sorted order)
      const atVertex = sortedNeighbors.get(current.to);
      if (!atVertex || atVertex.length === 0) break;

      // The reverse of current is: current.to -> current.from
      // Find its index in the sorted neighbors of current.to
      const reverseIdx = atVertex.indexOf(current.from);
      if (reverseIdx === -1) break;

      // Next clockwise neighbor is the one AFTER the reverse in the sorted list
      const nextIdx = (reverseIdx + 1) % atVertex.length;
      const nextTo = atVertex[nextIdx];

      const nextKey = `${current.to}->${nextTo}`;
      const nextHe = halfEdgeMap.get(nextKey);
      if (!nextHe) break;

      current = nextHe;
    }

    if (face.length >= 3) {
      faces.push(face);
    }
  }

  // Convert face vertex keys to pixel coordinates
  const patches: Patch[] = [];
  let maxArea = -1;
  let maxAreaIdx = -1;

  for (let i = 0; i < faces.length; i++) {
    const face = faces[i];
    const vertices = face.map((key) => parseKey(key));

    const area = signedArea(vertices);
    const absArea = Math.abs(area);

    if (absArea > maxArea) {
      maxArea = absArea;
      maxAreaIdx = i;
    }

    patches.push({
      id: `patch-${i}`,
      vertices,
      path: verticesToPath(vertices),
    });
  }

  // Remove the outer face (largest area)
  if (maxAreaIdx >= 0 && patches.length > 1) {
    return [...patches.slice(0, maxAreaIdx), ...patches.slice(maxAreaIdx + 1)];
  }

  return patches;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function parseKey(key: string): { x: number; y: number } {
  const [rowStr, colStr] = key.split(',');
  const x = Number(colStr);
  const y = Number(rowStr);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`Invalid grid point key: ${key}`);
  }
  return { x, y };
}

function verticesToPath(vertices: { x: number; y: number }[]): string {
  if (vertices.length === 0) return '';
  const parts = [`M ${vertices[0].x} ${vertices[0].y}`];
  for (let i = 1; i < vertices.length; i++) {
    parts.push(`L ${vertices[i].x} ${vertices[i].y}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

/**
 * Split a segment at all intermediate grid intersection points.
 * Uses Bresenham-like walking along the line to find grid crossings.
 */
function splitSegmentAtGridPoints(seg: Segment): Segment[] {
  const { from, to } = seg;

  // Find all grid points that lie on this segment
  const points: GridPoint[] = [from];

  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));

  if (steps <= 1) {
    return [{ from, to }];
  }

  // Use GCD to find step size for integer grid crossings
  const g = gcd(Math.abs(dr), Math.abs(dc));
  const stepR = dr / g;
  const stepC = dc / g;

  for (let i = 1; i < g; i++) {
    const r = from.row + stepR * i;
    const c = from.col + stepC * i;
    // Only include if they are integer grid points
    if (Number.isInteger(r) && Number.isInteger(c)) {
      points.push({ row: r, col: c });
    }
  }
  points.push(to);

  // Create segments between consecutive points
  const result: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    result.push({ from: points[i], to: points[i + 1] });
  }
  return result;
}

function deduplicateSegments(segments: Segment[]): Segment[] {
  const seen = new Set<string>();
  const result: Segment[] = [];

  for (const seg of segments) {
    const n = normalizeSegment(seg);
    const key = `${pointKey(n.from)}-${pointKey(n.to)}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(n);
    }
  }

  return result;
}

function buildAdjacency(
  segments: Segment[],
  _gridCols: number,
  _gridRows: number
): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  const adjSets = new Map<string, Set<string>>();

  function addEdge(a: string, b: string) {
    let set = adjSets.get(a);
    if (!set) {
      set = new Set<string>();
      adjSets.set(a, set);
    }
    set.add(b);
  }

  for (const seg of segments) {
    const fk = pointKey(seg.from);
    const tk = pointKey(seg.to);
    addEdge(fk, tk);
    addEdge(tk, fk);
  }

  for (const [key, set] of adjSets.entries()) {
    adj.set(key, [...set]);
  }

  return adj;
}
