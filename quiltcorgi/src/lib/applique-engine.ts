/**
 * Applique Engine — Pure computation functions for applique block creation
 * with layered shapes.
 *
 * No React, no Fabric.js, no DOM dependencies.
 * All functions are pure and all data structures are treated as immutable.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ShapeType = 'circle' | 'oval' | 'heart' | 'leaf' | 'teardrop' | 'freeform';

export interface AppliqueLayer {
  id: string;
  shapeType: ShapeType;
  pathData: string;
  fill: string;
  zIndex: number;
  transform: {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
}

export interface AppliqueBlock {
  layers: AppliqueLayer[];
  backgroundFill: string;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Path generators — individual shape types
// ---------------------------------------------------------------------------

/**
 * SVG path for a circle centered at (cx, cy) with the given radius.
 * Uses two arc commands to trace the full circle.
 */
export function circlePath(cx: number, cy: number, radius: number): string {
  const left = cx - radius;
  const right = cx + radius;
  return (
    `M ${left} ${cy} ` +
    `A ${radius} ${radius} 0 1 0 ${right} ${cy} ` +
    `A ${radius} ${radius} 0 1 0 ${left} ${cy} Z`
  );
}

/**
 * SVG path for an oval (ellipse) centered at (cx, cy) with rx and ry radii.
 * When rx === ry this produces the same output as circlePath.
 */
export function ovalPath(cx: number, cy: number, rx: number, ry: number): string {
  const left = cx - rx;
  const right = cx + rx;
  return (
    `M ${left} ${cy} ` +
    `A ${rx} ${ry} 0 1 0 ${right} ${cy} ` +
    `A ${rx} ${ry} 0 1 0 ${left} ${cy} Z`
  );
}

/**
 * SVG path for a heart shape centered at (cx, cy) with the given size.
 * Uses cubic bezier curves for the characteristic lobes and pointed bottom.
 */
export function heartPath(cx: number, cy: number, size: number): string {
  const s = size / 2;

  // Start at the bottom point of the heart
  const bx = cx;
  const by = cy + s;

  // Left lobe control points
  const lx1 = cx - s * 1.2;
  const ly1 = cy - s * 0.3;
  const lx2 = cx - s * 0.5;
  const ly2 = cy - s * 1.2;
  const leftTopX = cx - s * 0.5;
  const leftTopY = cy - s * 0.5;

  // Right lobe control points
  const rx1 = cx + s * 0.5;
  const ry1 = cy - s * 1.2;
  const rx2 = cx + s * 1.2;
  const ry2 = cy - s * 0.3;
  const rightTopX = cx + s * 0.5;
  const rightTopY = cy - s * 0.5;

  return (
    `M ${bx} ${by} ` +
    `C ${lx1} ${ly1} ${lx2} ${ly2} ${leftTopX} ${leftTopY} ` +
    `C ${cx - s * 0.5} ${cy - s * 0.9} ${cx} ${cy - s * 0.5} ${cx} ${cy} ` +
    `C ${cx} ${cy - s * 0.5} ${rightTopX} ${cy - s * 0.9} ${rightTopX} ${rightTopY} ` +
    `C ${rx1} ${ry1} ${rx2} ${ry2} ${bx} ${by} Z`
  );
}

/**
 * SVG path for a leaf shape centered at (cx, cy) with the given size.
 * Uses quadratic bezier curves to produce the two mirrored arcs of a leaf.
 */
export function leafPath(cx: number, cy: number, size: number): string {
  const halfW = size * 0.4;
  const halfH = size / 2;

  // Top point, bottom point, and side control points
  const topX = cx;
  const topY = cy - halfH;
  const bottomX = cx;
  const bottomY = cy + halfH;
  const leftCtrlX = cx - halfW;
  const leftCtrlY = cy;
  const rightCtrlX = cx + halfW;
  const rightCtrlY = cy;

  return (
    `M ${topX} ${topY} ` +
    `Q ${rightCtrlX} ${rightCtrlY} ${bottomX} ${bottomY} ` +
    `Q ${leftCtrlX} ${leftCtrlY} ${topX} ${topY} Z`
  );
}

/**
 * SVG path for a teardrop shape centered at (cx, cy) with the given size.
 * The round end is at the top, the pointed end at the bottom.
 */
export function teardropPath(cx: number, cy: number, size: number): string {
  const r = size * 0.3;
  const pointY = cy + size / 2;
  const circleTopY = cy - size * 0.2;

  return (
    `M ${cx} ${pointY} ` +
    `C ${cx - r * 1.6} ${cy} ${cx - r} ${circleTopY} ${cx} ${circleTopY - r} ` +
    `A ${r} ${r} 0 1 1 ${cx} ${circleTopY - r} ` +
    `C ${cx + r} ${circleTopY} ${cx + r * 1.6} ${cy} ${cx} ${pointY} Z`
  );
}

// ---------------------------------------------------------------------------
// generateShapePath — dispatcher
// ---------------------------------------------------------------------------

/**
 * Returns SVG path data for the given shape type, centered at (cx, cy)
 * with the given size.  Dispatches to the appropriate shape generator.
 * For 'freeform', returns an empty string as a placeholder.
 * 
 * Invalid sizes (NaN, negative, or zero) are clamped to a minimum value
to prevent degenerate shapes.
 */
export function generateShapePath(
  type: ShapeType,
  cx: number,
  cy: number,
  size: number
): string {
  // Validate and clamp size to prevent degenerate shapes
  const MIN_SIZE = 1;
  const validSize = !Number.isFinite(size) || size < MIN_SIZE ? MIN_SIZE : size;
  
  switch (type) {
    case 'circle':
      return circlePath(cx, cy, validSize / 2);
    case 'oval':
      return ovalPath(cx, cy, validSize / 2, validSize * 0.3);
    case 'heart':
      return heartPath(cx, cy, validSize);
    case 'leaf':
      return leafPath(cx, cy, validSize);
    case 'teardrop':
      return teardropPath(cx, cy, validSize);
    case 'freeform':
      return '';
  }
}

// ---------------------------------------------------------------------------
// Layer factory
// ---------------------------------------------------------------------------

/**
 * Factory function to create a fully initialised AppliqueLayer.
 * The transform is initialised to identity (zero translation, zero rotation,
 * unit scale).
 */
export function createLayer(
  id: string,
  shapeType: ShapeType,
  cx: number,
  cy: number,
  size: number,
  fill: string,
  zIndex: number
): AppliqueLayer {
  return {
    id,
    shapeType,
    pathData: generateShapePath(shapeType, cx, cy, size),
    fill,
    zIndex,
    transform: {
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Layer ordering helpers
// ---------------------------------------------------------------------------

/**
 * Reassign sequential zIndex values (0 … n-1) to the supplied layers in
 * array order, returning a new array without mutating the originals.
 */
function assignZIndices(layers: readonly AppliqueLayer[]): AppliqueLayer[] {
  return layers.map((layer, index) => ({ ...layer, zIndex: index }));
}

/**
 * Immutably move the element at fromIndex to toIndex, shifting the
 * remaining elements to fill the gap. zIndex values are reassigned to
 * match the new positions.
 */
export function reorderLayers(
  layers: readonly AppliqueLayer[],
  fromIndex: number,
  toIndex: number
): AppliqueLayer[] {
  if (fromIndex === toIndex) {
    return assignZIndices(layers);
  }

  const arr = [...layers];
  const [moved] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, moved);
  return assignZIndices(arr);
}

/**
 * Move the layer identified by layerId one step higher in z-order
 * (i.e. one position toward the end of the array).
 * If the layer is already at the top, the order is unchanged.
 * If the layerId is not found, returns the original order unchanged.
 */
export function bringForward(
  layers: readonly AppliqueLayer[],
  layerId: string
): AppliqueLayer[] {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index === -1 || index === layers.length - 1) {
    return assignZIndices(layers);
  }
  return reorderLayers(layers, index, index + 1);
}

/**
 * Move the layer identified by layerId one step lower in z-order
 * (i.e. one position toward the beginning of the array).
 * If the layer is already at the bottom, the order is unchanged.
 * If the layerId is not found, returns the original order unchanged.
 */
export function sendBackward(
  layers: readonly AppliqueLayer[],
  layerId: string
): AppliqueLayer[] {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index === -1 || index === 0) {
    return assignZIndices(layers);
  }
  return reorderLayers(layers, index, index - 1);
}

// ---------------------------------------------------------------------------
// Export / serialisation
// ---------------------------------------------------------------------------

/**
 * Export the block data alongside layer-ordering metadata.
 * Layers in fabricJsData are sorted ascending by zIndex.
 * layerOrder is an array of layer ids sorted ascending by zIndex.
 */
export function exportWithLayerMetadata(block: AppliqueBlock): {
  fabricJsData: Record<string, unknown>;
  layerOrder: string[];
} {
  const sortedLayers = [...block.layers].sort((a, b) => a.zIndex - b.zIndex);

  const layerOrder = sortedLayers.map((l) => l.id);

  const fabricJsData: Record<string, unknown> = {
    width: block.width,
    height: block.height,
    backgroundFill: block.backgroundFill,
    layers: sortedLayers.map((layer) => ({
      id: layer.id,
      shapeType: layer.shapeType,
      pathData: layer.pathData,
      fill: layer.fill,
      zIndex: layer.zIndex,
      transform: { ...layer.transform },
    })),
  };

  return { fabricJsData, layerOrder };
}

// ---------------------------------------------------------------------------
// Background layer
// ---------------------------------------------------------------------------

/**
 * Create the non-deletable background layer that covers the full block.
 * Always has id "background" and zIndex 0.
 */
export function createBackgroundLayer(
  width: number,
  height: number,
  fill: string
): AppliqueLayer {
  const pathData = `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;

  return {
    id: 'background',
    shapeType: 'freeform',
    pathData,
    fill,
    zIndex: 0,
    transform: {
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
  };
}
