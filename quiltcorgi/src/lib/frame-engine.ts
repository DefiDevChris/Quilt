/**
 * Frame Engine — Pure computation for decorative frame overlays on blocks.
 *
 * Generates frame geometry as separate polygon layers around block bounding box.
 * All functions are pure and immutable. No React, no Fabric.js, no DOM dependencies.
 */

export type FrameStyle =
  | 'simple-border'
  | 'double-border'
  | 'sawtooth'
  | 'flying-geese'
  | 'piano-keys'
  | 'cornerstone';

export interface FrameConfig {
  style: FrameStyle;
  width: number; // in inches
  color?: string;
  fabricId?: string;
  cornerTreatment: 'mitered' | 'square' | 'rounded';
}

export interface Point2D {
  x: number;
  y: number;
}

export interface FrameGeometry {
  paths: Point2D[][];
  style: FrameStyle;
  color?: string;
  fabricId?: string;
}

export interface FramedBlockResult {
  originalBlock: Point2D[][];
  frameGeometry: FrameGeometry[];
  boundingBox: { width: number; height: number; x: number; y: number };
}

/**
 * Apply decorative frame to block geometry.
 */
export function applyFrame(blockGeometry: Point2D[][], config: FrameConfig): FramedBlockResult {
  const bbox = calculateBoundingBox(blockGeometry);
  const frameGeometry = generateFrameGeometry(bbox, config);

  return {
    originalBlock: blockGeometry,
    frameGeometry,
    boundingBox: bbox,
  };
}

/**
 * Calculate bounding box of polygon paths.
 */
function calculateBoundingBox(paths: Point2D[][]): {
  width: number;
  height: number;
  x: number;
  y: number;
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const path of paths) {
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
 * Generate frame geometry based on style and configuration.
 */
function generateFrameGeometry(
  bbox: { width: number; height: number; x: number; y: number },
  config: FrameConfig
): FrameGeometry[] {
  const { style, width, color, fabricId } = config;
  const pixelWidth = width * 96; // Convert inches to pixels (96 DPI)

  switch (style) {
    case 'simple-border':
      return [generateSimpleBorder(bbox, pixelWidth, color, fabricId)];
    case 'double-border':
      return generateDoubleBorder(bbox, pixelWidth, color, fabricId);
    case 'sawtooth':
      return [generateSawtoothBorder(bbox, pixelWidth, color, fabricId)];
    case 'flying-geese':
      return [generateFlyingGeeseBorder(bbox, pixelWidth, color, fabricId)];
    case 'piano-keys':
      return [generatePianoKeysBorder(bbox, pixelWidth, color, fabricId)];
    case 'cornerstone':
      return generateCornerstoneBorder(bbox, pixelWidth, color, fabricId);
    default:
      return [];
  }
}

/**
 * Generate simple border frame.
 */
function generateSimpleBorder(
  bbox: { width: number; height: number; x: number; y: number },
  width: number,
  color?: string,
  fabricId?: string
): FrameGeometry {
  const outer = [
    { x: bbox.x - width, y: bbox.y - width },
    { x: bbox.x + bbox.width + width, y: bbox.y - width },
    { x: bbox.x + bbox.width + width, y: bbox.y + bbox.height + width },
    { x: bbox.x - width, y: bbox.y + bbox.height + width },
  ];

  const inner = [
    { x: bbox.x, y: bbox.y },
    { x: bbox.x + bbox.width, y: bbox.y },
    { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
    { x: bbox.x, y: bbox.y + bbox.height },
  ];

  return {
    paths: [outer, inner],
    style: 'simple-border',
    color,
    fabricId,
  };
}

/**
 * Generate double border frame.
 */
function generateDoubleBorder(
  bbox: { width: number; height: number; x: number; y: number },
  width: number,
  color?: string,
  fabricId?: string
): FrameGeometry[] {
  const innerWidth = width * 0.4;
  const gap = width * 0.2;
  const outerWidth = width * 0.4;

  const innerFrame = generateSimpleBorder(bbox, innerWidth, color, fabricId);
  const outerBbox = {
    x: bbox.x - innerWidth - gap,
    y: bbox.y - innerWidth - gap,
    width: bbox.width + 2 * (innerWidth + gap),
    height: bbox.height + 2 * (innerWidth + gap),
  };
  const outerFrame = generateSimpleBorder(outerBbox, outerWidth, color, fabricId);

  return [innerFrame, outerFrame];
}

/**
 * Generate sawtooth border frame.
 */
function generateSawtoothBorder(
  bbox: { width: number; height: number; x: number; y: number },
  width: number,
  color?: string,
  fabricId?: string
): FrameGeometry {
  const toothSize = width * 0.5;
  const teethPerSide = Math.max(4, Math.floor(Math.min(bbox.width, bbox.height) / toothSize));
  const actualToothSize = Math.min(bbox.width, bbox.height) / teethPerSide;

  const path: Point2D[] = [];

  // Top edge with teeth
  for (let i = 0; i <= teethPerSide; i++) {
    const x = bbox.x + (i * bbox.width) / teethPerSide;
    path.push({ x, y: bbox.y - width });
    if (i < teethPerSide) {
      path.push({ x: x + actualToothSize / 2, y: bbox.y - width + actualToothSize });
    }
  }

  // Right edge
  path.push({ x: bbox.x + bbox.width + width, y: bbox.y });
  path.push({ x: bbox.x + bbox.width + width, y: bbox.y + bbox.height });

  // Bottom edge
  path.push({ x: bbox.x + bbox.width, y: bbox.y + bbox.height + width });
  path.push({ x: bbox.x, y: bbox.y + bbox.height + width });

  // Left edge
  path.push({ x: bbox.x - width, y: bbox.y + bbox.height });
  path.push({ x: bbox.x - width, y: bbox.y });

  return {
    paths: [path],
    style: 'sawtooth',
    color,
    fabricId,
  };
}

/**
 * Generate flying geese border frame.
 */
function generateFlyingGeeseBorder(
  bbox: { width: number; height: number; x: number; y: number },
  width: number,
  color?: string,
  fabricId?: string
): FrameGeometry {
  const geeseCount = Math.max(4, Math.floor(bbox.width / width));
  const geeseWidth = bbox.width / geeseCount;

  const path: Point2D[] = [];

  // Top edge with flying geese
  for (let i = 0; i < geeseCount; i++) {
    const x = bbox.x + i * geeseWidth;
    path.push({ x, y: bbox.y - width });
    path.push({ x: x + geeseWidth / 2, y: bbox.y });
    path.push({ x: x + geeseWidth, y: bbox.y - width });
  }

  // Complete the frame
  path.push({ x: bbox.x + bbox.width + width, y: bbox.y });
  path.push({ x: bbox.x + bbox.width + width, y: bbox.y + bbox.height + width });
  path.push({ x: bbox.x - width, y: bbox.y + bbox.height + width });
  path.push({ x: bbox.x - width, y: bbox.y });

  return {
    paths: [path],
    style: 'flying-geese',
    color,
    fabricId,
  };
}

/**
 * Generate piano keys border frame.
 */
function generatePianoKeysBorder(
  bbox: { width: number; height: number; x: number; y: number },
  width: number,
  color?: string,
  fabricId?: string
): FrameGeometry {
  const keyCount = Math.max(6, Math.floor(bbox.width / (width * 0.5)));
  const keyWidth = bbox.width / keyCount;

  const paths: Point2D[][] = [];

  // Alternating rectangles around perimeter
  for (let i = 0; i < keyCount; i++) {
    if (i % 2 === 0) {
      const x = bbox.x + i * keyWidth;
      paths.push([
        { x, y: bbox.y - width },
        { x: x + keyWidth, y: bbox.y - width },
        { x: x + keyWidth, y: bbox.y },
        { x, y: bbox.y },
      ]);
    }
  }

  return {
    paths,
    style: 'piano-keys',
    color,
    fabricId,
  };
}

/**
 * Generate cornerstone border frame.
 */
function generateCornerstoneBorder(
  bbox: { width: number; height: number; x: number; y: number },
  width: number,
  color?: string,
  fabricId?: string
): FrameGeometry[] {
  const borderFrame = generateSimpleBorder(bbox, width, color, fabricId);
  const cornerSize = width * 0.8;

  const corners: FrameGeometry = {
    paths: [
      // Top-left corner
      [
        { x: bbox.x - width, y: bbox.y - width },
        { x: bbox.x - width + cornerSize, y: bbox.y - width },
        { x: bbox.x - width + cornerSize, y: bbox.y - width + cornerSize },
        { x: bbox.x - width, y: bbox.y - width + cornerSize },
      ],
      // Top-right corner
      [
        { x: bbox.x + bbox.width + width - cornerSize, y: bbox.y - width },
        { x: bbox.x + bbox.width + width, y: bbox.y - width },
        { x: bbox.x + bbox.width + width, y: bbox.y - width + cornerSize },
        { x: bbox.x + bbox.width + width - cornerSize, y: bbox.y - width + cornerSize },
      ],
      // Bottom-right corner
      [
        {
          x: bbox.x + bbox.width + width - cornerSize,
          y: bbox.y + bbox.height + width - cornerSize,
        },
        { x: bbox.x + bbox.width + width, y: bbox.y + bbox.height + width - cornerSize },
        { x: bbox.x + bbox.width + width, y: bbox.y + bbox.height + width },
        { x: bbox.x + bbox.width + width - cornerSize, y: bbox.y + bbox.height + width },
      ],
      // Bottom-left corner
      [
        { x: bbox.x - width, y: bbox.y + bbox.height + width - cornerSize },
        { x: bbox.x - width + cornerSize, y: bbox.y + bbox.height + width - cornerSize },
        { x: bbox.x - width + cornerSize, y: bbox.y + bbox.height + width },
        { x: bbox.x - width, y: bbox.y + bbox.height + width },
      ],
    ],
    style: 'cornerstone',
    color: color === '#000000' ? '#ffffff' : '#000000', // Contrasting color
    fabricId,
  };

  return [borderFrame, corners];
}

/**
 * Convert frame geometry to SVG path string.
 */
export function frameToSvgPath(geometry: FrameGeometry): string {
  return geometry.paths
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
