/**
 * Template Thumbnail Renderer
 *
 * Deterministic SVG render of template previews for the TemplatesPanel.
 * Uses the layout thumbnail generator for the underlying layout config.
 */

import { QUILT_TEMPLATES, type QuiltTemplate } from '@/lib/templates';
import { generateLayoutSvg } from '@/lib/layout-svg';

interface TemplateThumbnailProps {
  template: QuiltTemplate;
  className?: string;
}

export function TemplateThumbnail({ template, className }: TemplateThumbnailProps) {
  const { layoutConfig } = template;
  const svg = generateTemplateSvg(layoutConfig);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function generateTemplateSvg(config: {
  type: string;
  rows?: number;
  cols?: number;
  blockSize?: number;
  sashing?: { width?: number };
  borders?: Array<{ width?: number }>;
}): string {
  const { type, rows = 3, cols = 3, blockSize = 12, sashing, borders = [] } = config;
  const sashingWidth = sashing?.width ?? 0;

  const viewBox = 120;
  const padding = 4;
  const availableSize = viewBox - padding * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">`;
  svg += `<rect x="${padding}" y="${padding}" width="${availableSize}" height="${availableSize}" rx="3" fill="#F3F4F6" opacity="0.3"/>`;

  if (borders.length > 0) {
    const borderTotal = borders.reduce((sum, b) => sum + (b.width ?? 0), 0);
    const innerPadding = padding + borderTotal;
    const innerSize = availableSize - borderTotal * 2;
    svg += `<rect x="${innerPadding}" y="${innerPadding}" width="${innerSize}" height="${innerSize}" rx="2" fill="#FEF3C7" opacity="0.2"/>`;
  }

  const layoutSvg = generateLayoutSvg(
    type as 'grid' | 'sashing' | 'on-point' | 'strippy' | 'medallion' | 'free-form',
    rows,
    cols,
    blockSize,
    sashingWidth,
    sashingWidth > 0
  );

  svg += layoutSvg.replace(/<svg[^>]*>|<\/svg>/g, '');

  svg += `</svg>`;
  return svg;
}

export function TemplateCardThumbnail({ templateId }: { templateId: string }) {
  const template = QUILT_TEMPLATES.find((t) => t.id === templateId);

  if (!template) {
    return null;
  }

  return <TemplateThumbnail template={template} />;
}
