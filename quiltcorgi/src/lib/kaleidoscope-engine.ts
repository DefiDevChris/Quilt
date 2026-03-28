/**
 * Kaleidoscope Engine — Pure computation for kaleidoscope block generation.
 *
 * Generates kaleidoscope patterns from source geometry using radial symmetry
 * and mirror reflections within wedges. All functions are pure and immutable.
 */

export type SourceQuadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface KaleidoscopeConfig {
  foldCount: 4 | 6 | 8 | 12;
  sourceQuadrant: SourceQuadrant;
  radius?: number; // Optional radius, defaults to auto-calculate
}

export interface Point2D {
  x: number;
  y: number;
}

export interface KaleidoscopeResult {
  geometry: Point2D[][];
  centerPoint: Point2D;
  radius: number;
  wedgeAngle: number;
}

/**
 * Generate kaleidoscope pattern from source geometry.
 */
export function generateKaleidoscope(
  sourceGeometry: Point2D[][],
  config: KaleidoscopeConfig
): KaleidoscopeResult {
  const { foldCount, sourceQuadrant, radius } = config;

  // Calculate bounding box and center
  const bbox = calculateBoundingBox(sourceGeometry);
  const centerPoint = {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  };

  // Calculate radius (use provided or auto-calculate)
  const kaleidoscopeRadius = radius || Math.max(bbox.width, bbox.height) * 0.6;

  // Extract source quadrant geometry
  const quadrantGeometry = extractSourceQuadrant(sourceGeometry, bbox, sourceQuadrant);

  // Generate kaleidoscope wedges
  const wedgeAngle = 360 / foldCount;
  const allWedges: Point2D[][] = [];

  for (let i = 0; i < foldCount; i++) {
    const rotationAngle = i * wedgeAngle;
    const wedgeGeometry = generateWedge(
      quadrantGeometry,
      centerPoint,
      kaleidoscopeRadius,
      wedgeAngle,
      rotationAngle
    );
    allWedges.push(...wedgeGeometry);
  }

  // Clip to circular boundary
  const clippedGeometry = clipToCircle(allWedges, centerPoint, kaleidoscopeRadius);

  return {
    geometry: clippedGeometry,
    centerPoint,
    radius: kaleidoscopeRadius,
    wedgeAngle,
  };
}

/**
 * Calculate bounding box of geometry.
 */
function calculateBoundingBox(geometry: Point2D[][]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const path of geometry) {
    for (const point of path) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Extract geometry from specified quadrant.
 */
function extractSourceQuadrant(
  geometry: Point2D[][],
  bbox: { x: number; y: number; width: number; height: number },
  quadrant: SourceQuadrant
): Point2D[][] {
  const bounds = getQuadrantBounds(bbox, quadrant);

  return geometry.filter((polygon) => polygon.some((point) => isPointInQuadrant(point, bounds)));
}

/**
 * Get bounds for specified quadrant.
 */
function getQuadrantBounds(
  bbox: { x: number; y: number; width: number; height: number },
  quadrant: SourceQuadrant
): { minX: number; maxX: number; minY: number; maxY: number } {
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;

  switch (quadrant) {
    case 'top-left':
      return { minX: bbox.x, maxX: centerX, minY: bbox.y, maxY: centerY };
    case 'top-right':
      return { minX: centerX, maxX: bbox.x + bbox.width, minY: bbox.y, maxY: centerY };
    case 'bottom-left':
      return { minX: bbox.x, maxX: centerX, minY: centerY, maxY: bbox.y + bbox.height };
    case 'bottom-right':
      return {
        minX: centerX,
        maxX: bbox.x + bbox.width,
        minY: centerY,
        maxY: bbox.y + bbox.height,
      };
  }
}

/**
 * Check if point is within quadrant bounds.
 */
function isPointInQuadrant(
  point: Point2D,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): boolean {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  );
}

/**
 * Generate kaleidoscope wedge with mirroring.
 */
function generateWedge(
  sourceGeometry: Point2D[][],
  center: Point2D,
  _radius: number,
  wedgeAngle: number,
  rotationAngle: number
): Point2D[][] {
  const wedgeGeometry: Point2D[][] = [];

  // Create mirrored version within wedge
  const mirroredGeometry = mirrorGeometryInWedge(sourceGeometry, center, wedgeAngle);

  // Rotate the entire wedge
  const rotatedGeometry = rotateGeometry(
    [...sourceGeometry, ...mirroredGeometry],
    center,
    rotationAngle
  );

  wedgeGeometry.push(...rotatedGeometry);

  return wedgeGeometry;
}

/**
 * Mirror geometry within a wedge for kaleidoscope effect.
 */
function mirrorGeometryInWedge(
  geometry: Point2D[][],
  center: Point2D,
  wedgeAngle: number
): Point2D[][] {
  const mirrorAngle = wedgeAngle / 2;
  const mirrorRadians = (mirrorAngle * Math.PI) / 180;

  return geometry.map((path) =>
    path.map((point) => {
      // Translate to origin
      const dx = point.x - center.x;
      const dy = point.y - center.y;

      // Convert to polar coordinates
      const r = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(dy, dx);

      // Mirror across wedge center line
      const mirroredTheta = 2 * mirrorRadians - theta;

      // Convert back to cartesian
      const mirroredX = center.x + r * Math.cos(mirroredTheta);
      const mirroredY = center.y + r * Math.sin(mirroredTheta);

      return { x: mirroredX, y: mirroredY };
    })
  );
}

/**
 * Rotate geometry around center point.
 */
function rotateGeometry(geometry: Point2D[][], center: Point2D, angleDegrees: number): Point2D[][] {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return geometry.map((path) =>
    path.map((point) => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;

      return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos,
      };
    })
  );
}

/**
 * Clip geometry to circular boundary.
 */
function clipToCircle(geometry: Point2D[][], center: Point2D, radius: number): Point2D[][] {
  return geometry
    .map((path) => clipPathToCircle(path, center, radius))
    .filter((path) => path.length > 0);
}

/**
 * Clip single path to circular boundary using simple intersection.
 */
function clipPathToCircle(path: Point2D[], center: Point2D, radius: number): Point2D[] {
  if (path.length === 0) return [];

  const clippedPath: Point2D[] = [];

  for (let i = 0; i < path.length; i++) {
    const current = path[i];
    const next = path[(i + 1) % path.length];

    const currentInside = isPointInCircle(current, center, radius);
    const nextInside = isPointInCircle(next, center, radius);

    if (currentInside) {
      clippedPath.push(current);
    }

    // Check for intersection with circle boundary
    if (currentInside !== nextInside) {
      const intersection = lineCircleIntersection(current, next, center, radius);
      if (intersection) {
        clippedPath.push(intersection);
      }
    }
  }

  return clippedPath;
}

/**
 * Check if point is inside circle.
 */
function isPointInCircle(point: Point2D, center: Point2D, radius: number): boolean {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Find intersection of line segment with circle.
 */
function lineCircleIntersection(
  p1: Point2D,
  p2: Point2D,
  center: Point2D,
  radius: number
): Point2D | null {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - center.x;
  const fy = p1.y - center.y;

  const a = dx * dx + dy * dy;
  if (a === 0) return null;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;

  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return null;

  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

  // Use the intersection point that's within the line segment
  const t = t1 >= 0 && t1 <= 1 ? t1 : t2 >= 0 && t2 <= 1 ? t2 : null;

  if (t === null) return null;

  return {
    x: p1.x + t * dx,
    y: p1.y + t * dy,
  };
}

/**
 * Convert kaleidoscope geometry to SVG path string.
 */
export function kaleidoscopeToSvgPath(result: KaleidoscopeResult): string {
  return result.geometry
    .map((path) => {
      if (path.length === 0) return '';
      const commands = [`M ${path[0].x} ${path[0].y}`];
      for (let i = 1; i < path.length; i++) {
        commands.push(`L ${path[i].x} ${path[i].y}`);
      }
      commands.push('Z');
      return commands.join(' ');
    })
    .join(' ');
}
