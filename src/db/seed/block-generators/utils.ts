/**
 * Shared SVG generation utilities for block generators.
 * All blocks use a 100x100 viewBox.
 */

import type { BlockDefinition } from '../blockDefinitions';

export function svgWrap(innerPaths: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${innerPaths}</svg>`;
}

export function rect(x: number, y: number, w: number, h: number, fill: string): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#333" stroke-width="0.5"/>`;
}

export function polygon(points: string, fill: string): string {
  return `<polygon points="${points}" fill="${fill}" stroke="#333" stroke-width="0.5"/>`;
}

export function circle(cx: number, cy: number, r: number, fill: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="#333" stroke-width="0.5"/>`;
}

export function path(d: string, fill: string): string {
  return `<path d="${d}" fill="${fill}" stroke="#333" stroke-width="0.5"/>`;
}

/** Generate points for a regular polygon centered at (cx, cy) with given radius */
export function regularPolygonPoints(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotationDeg: number = -90
): string {
  const rotRad = (rotationDeg * Math.PI) / 180;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = rotRad + (2 * Math.PI * i) / sides;
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

/** Generate an SVG arc path segment */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/** Mirror a set of SVG paths horizontally within the 100x100 viewBox */
export function mirrorHorizontal(svgContent: string): string {
  return `<g transform="translate(100,0) scale(-1,1)">${svgContent}</g>`;
}

/** Create a block definition with common defaults */
export function block(
  name: string,
  category: string,
  svgContent: string,
  tags: string[],
  subcategory: string | null = null
): BlockDefinition {
  return {
    name,
    category,
    subcategory,
    svgData: svgWrap(svgContent),
    tags,
  };
}

/** HST within a specified rectangle */
export function hst(
  x: number,
  y: number,
  w: number,
  h: number,
  topLeftFill: string,
  bottomRightFill: string
): string {
  return (
    polygon(`${x},${y} ${x + w},${y} ${x},${y + h}`, topLeftFill) +
    polygon(`${x + w},${y} ${x + w},${y + h} ${x},${y + h}`, bottomRightFill)
  );
}

/** Rotated square (diamond) centered at (cx, cy) */
export function diamond(cx: number, cy: number, size: number, fill: string): string {
  const half = size / 2;
  return polygon(
    `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`,
    fill
  );
}

/** Color palettes for procedural generation */
export const PALETTES = {
  warm: { primary: '#D4883C', secondary: '#C9A06E', bg: '#F5F0E8', accent: '#E53935' },
  cool: { primary: '#4A90D9', secondary: '#7AB8E0', bg: '#E8F0F5', accent: '#2E7D32' },
  earth: { primary: '#8B6914', secondary: '#A0522D', bg: '#F5ECD7', accent: '#6B4423' },
  jewel: { primary: '#9C27B0', secondary: '#673AB7', bg: '#F3E5F5', accent: '#E91E63' },
  neutral: { primary: '#757575', secondary: '#9E9E9E', bg: '#FAFAFA', accent: '#424242' },
  autumn: { primary: '#D84315', secondary: '#F57C00', bg: '#FFF3E0', accent: '#BF360C' },
  spring: { primary: '#66BB6A', secondary: '#AED581', bg: '#F1F8E9', accent: '#FF8A80' },
  ocean: { primary: '#0277BD', secondary: '#4FC3F7', bg: '#E1F5FE', accent: '#006064' },
} as const;

export type PaletteName = keyof typeof PALETTES;
