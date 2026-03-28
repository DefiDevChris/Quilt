import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_SVG_TAGS = [
  'svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'rect', 'text', 'tspan', 'defs', 'clipPath', 'mask', 'pattern',
  'linearGradient', 'radialGradient', 'stop', 'use', 'symbol', 'title',
  'desc', 'marker', 'textPath',
];

const ALLOWED_SVG_ATTRS = [
  'viewBox', 'xmlns', 'width', 'height', 'fill', 'stroke', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
  'stroke-opacity', 'fill-opacity', 'fill-rule', 'clip-rule', 'opacity',
  'transform', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'd', 'points', 'id', 'class', 'style', 'font-size', 'font-family',
  'font-weight', 'text-anchor', 'dominant-baseline', 'dx', 'dy',
  'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform',
  'patternUnits', 'patternTransform', 'markerWidth', 'markerHeight', 'orient',
  'refX', 'refY', 'clip-path', 'mask', 'href', 'preserveAspectRatio',
  'startOffset', 'textLength',
];

/** Sanitize SVG string, removing script tags, event handlers, and other XSS vectors. */
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: ALLOWED_SVG_TAGS,
    ALLOWED_ATTR: ALLOWED_SVG_ATTRS,
    ALLOW_DATA_ATTR: false,
  });
}
