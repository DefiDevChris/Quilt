/**
 * SVG Export Engine
 * Exports Fabric.js canvas as clean, sanitized SVG.
 * Uses Fabric.js toSVG() and sanitizes output for safe download.
 */

import { sanitizeSvg } from '@/lib/sanitize-svg';
import { sanitizeFilename } from '@/lib/string-utils';

export interface SvgExportOptions {
  projectName: string;
  includeBackground?: boolean;
  backgroundColor?: string;
}

/**
 * Check if a Fabric.js object is a grid line or overlay that should be excluded.
 */
function isNonUserObject(obj: unknown): boolean {
  const o = obj as Record<string, unknown>;
  if (o.stroke === '#E5E2DD' && o.type === 'line') return true;
  if ((o as unknown as { name?: string }).name === 'overlay-ref') return true;
  return false;
}

/**
 * Export the Fabric.js canvas as an SVG string.
 * Filters out grid lines and overlay objects from the output.
 */
export async function exportCanvasSvg(
  fabricCanvas: unknown,
  options: SvgExportOptions
): Promise<string> {
  const fabric = await import('fabric');
  const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

  const allObjects = canvas.getObjects();
  const userObjects = allObjects.filter((obj: unknown) => !isNonUserObject(obj));

  const tempCanvas = new fabric.StaticCanvas(undefined as unknown as string, {
    width: canvas.getWidth(),
    height: canvas.getHeight(),
  });

  for (const obj of userObjects) {
    const cloned = await (obj as InstanceType<typeof fabric.FabricObject>).clone();
    tempCanvas.add(cloned);
  }

  let svgString = tempCanvas.toSVG();

  if (options.includeBackground && options.backgroundColor) {
    const bgRect = `<rect width="100%" height="100%" fill="${options.backgroundColor}"/>`;
    const svgEndIndex = svgString.indexOf('>');
    svgString = svgString.slice(0, svgEndIndex + 1) + bgRect + svgString.slice(svgEndIndex + 1);
  }

  const sanitized = sanitizeSvg(svgString);

  tempCanvas.dispose();

  return sanitized;
}

/**
 * Generate a filename for SVG export.
 */
export function generateSvgFilename(projectName: string): string {
  const safeName = sanitizeFilename(projectName);
  return `${safeName}.svg`;
}

/**
 * Download an SVG string as a file.
 */
export function downloadSvg(svgString: string, filename: string) {
  if (typeof window === 'undefined') return;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
