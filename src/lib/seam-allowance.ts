/**
 * Seam Allowance Engine
 * Converts SVG paths to polylines and computes offset polygons
 * using Clipper.js for seam allowance outlines.
 *
 * Pure computation — no React or Fabric.js dependency.
 */

import ClipperLib from 'clipper-lib';
import type { Point } from '@/types/geometry';

export type { Point };

const CLIPPER_SCALE = 1000;
const CLIPPER_MITER_LIMIT = 0.25 * CLIPPER_SCALE;
const CURVE_SAMPLES = 16;

/**
 * Miter limit controls how sharp corners can get before they're clipped.
 * 0.25 * CLIPPER_SCALE = 250 units; higher = sharper corners allowed.
 */

export interface SeamResult {
  /** Original shape polyline points */
  cutLine: Point[];
  /** Offset shape polyline points (seam allowance) */
  seamLine: Point[];
}

// ── SVG Path Parsing ──────────────────────────────────────────────

interface PathCommand {
  type: string;
  args: number[];
}

function tokenizeSvgPath(d: string): PathCommand[] {
  const commands: PathCommand[] = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])\s*([-\d.,eE\s]*)/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(d)) !== null) {
    const type = match[1];
    const argStr = match[2].trim();
    const args =
      argStr.length > 0
        ? argStr
            .split(/[\s,]+/)
            .map(Number)
            .filter((n) => !isNaN(n))
        : [];
    commands.push({ type, args });
  }
  return commands;
}

function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
}

function quadBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  const u2 = u * u;
  const t2 = t * t;
  return {
    x: u2 * p0.x + 2 * u * t * p1.x + t2 * p2.x,
    y: u2 * p0.y + 2 * u * t * p1.y + t2 * p2.y,
  };
}

/**
 * Convert an SVG path `d` string to a list of polyline points.
 * Curves are approximated by sampling CURVE_SAMPLES points.
 */
export function svgPathToPolyline(d: string): Point[] {
  const commands = tokenizeSvgPath(d);
  const points: Point[] = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let lastCpX = 0;
  let lastCpY = 0;

  for (const cmd of commands) {
    const { type, args } = cmd;
    const isRelative = type === type.toLowerCase();

    switch (type.toUpperCase()) {
      case 'M': {
        for (let i = 0; i < args.length; i += 2) {
          cx = isRelative ? cx + args[i] : args[i];
          cy = isRelative ? cy + args[i + 1] : args[i + 1];
          if (i === 0) {
            startX = cx;
            startY = cy;
          }
          points.push({ x: cx, y: cy });
        }
        lastCpX = cx;
        lastCpY = cy;
        break;
      }
      case 'L': {
        for (let i = 0; i < args.length; i += 2) {
          cx = isRelative ? cx + args[i] : args[i];
          cy = isRelative ? cy + args[i + 1] : args[i + 1];
          points.push({ x: cx, y: cy });
        }
        lastCpX = cx;
        lastCpY = cy;
        break;
      }
      case 'H': {
        for (const a of args) {
          cx = isRelative ? cx + a : a;
          points.push({ x: cx, y: cy });
        }
        lastCpX = cx;
        lastCpY = cy;
        break;
      }
      case 'V': {
        for (const a of args) {
          cy = isRelative ? cy + a : a;
          points.push({ x: cx, y: cy });
        }
        lastCpX = cx;
        lastCpY = cy;
        break;
      }
      case 'C': {
        for (let i = 0; i < args.length; i += 6) {
          const p0: Point = { x: cx, y: cy };
          const p1x = isRelative ? cx + args[i] : args[i];
          const p1y = isRelative ? cy + args[i + 1] : args[i + 1];
          const p2x = isRelative ? cx + args[i + 2] : args[i + 2];
          const p2y = isRelative ? cy + args[i + 3] : args[i + 3];
          const p3x = isRelative ? cx + args[i + 4] : args[i + 4];
          const p3y = isRelative ? cy + args[i + 5] : args[i + 5];
          const p1: Point = { x: p1x, y: p1y };
          const p2: Point = { x: p2x, y: p2y };
          const p3: Point = { x: p3x, y: p3y };

          for (let t = 1; t <= CURVE_SAMPLES; t++) {
            points.push(cubicBezier(p0, p1, p2, p3, t / CURVE_SAMPLES));
          }
          cx = p3x;
          cy = p3y;
          lastCpX = p2x;
          lastCpY = p2y;
        }
        break;
      }
      case 'S': {
        for (let i = 0; i < args.length; i += 4) {
          const p0: Point = { x: cx, y: cy };
          const p1: Point = { x: 2 * cx - lastCpX, y: 2 * cy - lastCpY };
          const p2x = isRelative ? cx + args[i] : args[i];
          const p2y = isRelative ? cy + args[i + 1] : args[i + 1];
          const p3x = isRelative ? cx + args[i + 2] : args[i + 2];
          const p3y = isRelative ? cy + args[i + 3] : args[i + 3];
          const p2: Point = { x: p2x, y: p2y };
          const p3: Point = { x: p3x, y: p3y };

          for (let t = 1; t <= CURVE_SAMPLES; t++) {
            points.push(cubicBezier(p0, p1, p2, p3, t / CURVE_SAMPLES));
          }
          cx = p3x;
          cy = p3y;
          lastCpX = p2x;
          lastCpY = p2y;
        }
        break;
      }
      case 'Q': {
        for (let i = 0; i < args.length; i += 4) {
          const p0: Point = { x: cx, y: cy };
          const p1x = isRelative ? cx + args[i] : args[i];
          const p1y = isRelative ? cy + args[i + 1] : args[i + 1];
          const p2x = isRelative ? cx + args[i + 2] : args[i + 2];
          const p2y = isRelative ? cy + args[i + 3] : args[i + 3];
          const p1: Point = { x: p1x, y: p1y };
          const p2: Point = { x: p2x, y: p2y };

          for (let t = 1; t <= CURVE_SAMPLES; t++) {
            points.push(quadBezier(p0, p1, p2, t / CURVE_SAMPLES));
          }
          cx = p2x;
          cy = p2y;
          lastCpX = p1x;
          lastCpY = p1y;
        }
        break;
      }
      case 'T': {
        for (let i = 0; i < args.length; i += 2) {
          const p0: Point = { x: cx, y: cy };
          const p1: Point = { x: 2 * cx - lastCpX, y: 2 * cy - lastCpY };
          const p2x = isRelative ? cx + args[i] : args[i];
          const p2y = isRelative ? cy + args[i + 1] : args[i + 1];
          const p2: Point = { x: p2x, y: p2y };

          for (let t = 1; t <= CURVE_SAMPLES; t++) {
            points.push(quadBezier(p0, p1, p2, t / CURVE_SAMPLES));
          }
          cx = p2x;
          cy = p2y;
          lastCpX = p1.x;
          lastCpY = p1.y;
        }
        break;
      }
      case 'A': {
        for (let i = 0; i < args.length; i += 7) {
          const endX = isRelative ? cx + args[i + 5] : args[i + 5];
          const endY = isRelative ? cy + args[i + 6] : args[i + 6];
          // Approximate arc as line to endpoint
          cx = endX;
          cy = endY;
          points.push({ x: cx, y: cy });
        }
        lastCpX = cx;
        lastCpY = cy;
        break;
      }
      case 'Z': {
        cx = startX;
        cy = startY;
        points.push({ x: cx, y: cy });
        lastCpX = cx;
        lastCpY = cy;
        break;
      }
    }
  }

  return points;
}

/**
 * Extract the first `d` attribute from an SVG string.
 * Handles both full SVG elements and bare `<path d="..."/>` fragments.
 */
export function extractPathFromSvg(svg: string): string | null {
  const match = svg.match(/\bd\s*=\s*"([^"]*)"/);
  return match ? match[1] : null;
}

// ── Clipper Offset ────────────────────────────────────────────────

function pointsToClipperPath(points: Point[]): ClipperLib.Path {
  return points.map((p) => ({
    X: Math.round(p.x * CLIPPER_SCALE),
    Y: Math.round(p.y * CLIPPER_SCALE),
  }));
}

function clipperPathToPoints(path: ClipperLib.Path): Point[] {
  return path.map((p) => ({
    x: p.X / CLIPPER_SCALE,
    y: p.Y / CLIPPER_SCALE,
  }));
}

/**
 * Compute seam allowance offset for a shape.
 *
 * @param points - Shape polyline points (in inches or desired unit)
 * @param seamAllowance - Offset distance in same units as points
 * @returns The offset polygon points, or the original points if offset fails
 */
export function computeSeamOffset(points: Point[], seamAllowance: number): Point[] {
  if (points.length < 3 || seamAllowance <= 0) {
    return points;
  }

  const clipperPath = pointsToClipperPath(points);
  const co = new ClipperLib.ClipperOffset(2, CLIPPER_MITER_LIMIT);
  co.AddPath(clipperPath, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);

  const solution: ClipperLib.Paths = [];
  co.Execute(solution, seamAllowance * CLIPPER_SCALE);

  if (solution.length === 0) {
    return points;
  }

  // Return the largest offset polygon (by area)
  let largest = solution[0];
  let largestArea = Math.abs(ClipperLib.JS.AreaOfPolygon(solution[0], 1));
  for (let i = 1; i < solution.length; i++) {
    const area = Math.abs(ClipperLib.JS.AreaOfPolygon(solution[i], 1));
    if (area > largestArea) {
      largestArea = area;
      largest = solution[i];
    }
  }

  return clipperPathToPoints(largest);
}

/**
 * Full pipeline: SVG string → cut line + seam line polylines.
 *
 * @param svgData - SVG string (full element or path fragment)
 * @param seamAllowance - Seam allowance in the same units as the SVG coordinates
 * @param scaleToInches - Scale factor to convert SVG units to inches (default 1)
 * @returns Cut and seam line polylines in inches
 */
export function computeSeamAllowance(
  svgData: string,
  seamAllowance: number,
  scaleToInches = 1
): SeamResult | null {
  const pathD = extractPathFromSvg(svgData);
  if (!pathD) return null;

  const rawPoints = svgPathToPolyline(pathD);
  if (rawPoints.length < 3) return null;

  const cutLine = rawPoints.map((p) => ({
    x: p.x * scaleToInches,
    y: p.y * scaleToInches,
  }));

  const seamLine = computeSeamOffset(cutLine, seamAllowance);

  return { cutLine, seamLine };
}
