/**
 * Bezier curve utilities for the bend tool and future path operations.
 *
 * Provides helpers to generate SVG path strings with quadratic/cubic Bezier
 * commands, enabling smoother curves than polygon point subdivision.
 */

type Pt = { x: number; y: number };

/**
 * Generate an SVG path string for a polygon where one edge is replaced
 * with a quadratic Bezier curve.
 *
 * @param points - Original polygon points
 * @param edgeIndex - Index of the edge to bend (from points[edgeIndex] to points[edgeIndex+1])
 * @param controlPoint - Bezier control point for the curve
 * @returns SVG path data string with Q command for the bent edge
 */
export function buildBezierPathString(
  points: Pt[],
  edgeIndex: number,
  controlPoint: Pt
): string {
  if (points.length < 2) return '';

  const parts: string[] = [];
  parts.push(`M ${points[0].x} ${points[0].y}`);

  for (let i = 0; i < points.length; i++) {
    const nextIdx = (i + 1) % points.length;
    if (i === edgeIndex) {
      // Replace this edge with a quadratic Bezier curve
      parts.push(`Q ${controlPoint.x} ${controlPoint.y} ${points[nextIdx].x} ${points[nextIdx].y}`);
    } else if (nextIdx !== 0) {
      // Regular line segment
      parts.push(`L ${points[nextIdx].x} ${points[nextIdx].y}`);
    }
  }

  parts.push('Z');
  return parts.join(' ');
}

/**
 * Evaluate a quadratic Bezier curve at parameter t.
 * P(t) = (1-t)^2 * A + 2(1-t)t * C + t^2 * B
 */
export function quadraticBezierPoint(A: Pt, C: Pt, B: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * A.x + 2 * u * t * C.x + t * t * B.x,
    y: u * u * A.y + 2 * u * t * C.y + t * t * B.y,
  };
}

/**
 * Subdivide a quadratic Bezier into N line segments.
 * Returns intermediate points (excludes start and end).
 */
export function subdivideBezier(A: Pt, C: Pt, B: Pt, subdivisions: number): Pt[] {
  const points: Pt[] = [];
  for (let i = 1; i < subdivisions; i++) {
    const t = i / subdivisions;
    points.push(quadraticBezierPoint(A, C, B, t));
  }
  return points;
}

/**
 * Snap path data points to grid.
 * Processes an array of SVG path commands (as parsed by fabric.js)
 * and snaps numeric coordinates to the nearest grid position.
 */
export function snapPathPoints(
  pathData: Array<Array<string | number>>,
  snapFn: (val: number) => number
): Array<Array<string | number>> {
  return pathData.map((cmd) => {
    const result = [cmd[0]];
    for (let i = 1; i < cmd.length; i++) {
      result.push(typeof cmd[i] === 'number' ? snapFn(cmd[i] as number) : cmd[i]);
    }
    return result;
  });
}
