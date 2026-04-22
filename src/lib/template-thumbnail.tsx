/**
 * Template Thumbnail Renderer
 *
 * Deterministic SVG render of template previews for the TemplatesPanel.
 * Uses the layout thumbnail generator for the underlying layout config.
 */

import type { QuiltTemplate } from '@/lib/templates';
import { QUILT_TEMPLATES } from '@/lib/templates';

interface TemplateThumbnailProps {
  template: QuiltTemplate;
  className?: string;
}

function generateLayoutSvg(
  type: 'grid' | 'sashing' | 'on-point' | 'strippy' | 'medallion' | 'free-form',
  rows: number,
  cols: number,
  blockSize: number,
  sashingWidth: number,
  showSashing: boolean
): string {
  const viewBox = 120;
  const padding = 4;
  const availableSize = viewBox - padding * 2;

  switch (type) {
    case 'grid': {
      const cellSize = availableSize / cols;
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">`;
      svg += `<rect x="${padding}" y="${padding}" width="${availableSize}" height="${availableSize}" rx="2" fill="#DBEAFE" opacity="0.2"/>`;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = padding + c * cellSize + 2;
          const y = padding + r * cellSize + 2;
          const w = cellSize - 4;
          svg += `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="1" fill="#DBEAFE" stroke="#93C5FD" stroke-width="0.5"/>`;
        }
      }
      svg += `</svg>`;
      return svg;
    }
    case 'sashing': {
      const sashingRatio = sashingWidth > 0 ? Math.min(sashingWidth / 10, 0.2) : 0;
      const cellSize = (availableSize * (1 - sashingRatio)) / cols;
      const sashingSize = availableSize * sashingRatio / (cols + 1);
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">`;
      svg += `<rect x="${padding}" y="${padding}" width="${availableSize}" height="${availableSize}" rx="2" fill="#D1FAE5" opacity="0.2"/>`;
      const totalCellAndSash = cellSize + sashingSize;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = padding + c * totalCellAndSash + sashingSize / 2;
          const y = padding + r * totalCellAndSash + sashingSize / 2;
          svg += `<rect x="${x}" y="${y}" width="${cellSize - 2}" height="${cellSize - 2}" rx="1" fill="#DBEAFE" stroke="#93C5FD" stroke-width="0.5"/>`;
        }
      }
      svg += `</svg>`;
      return svg;
    }
    case 'on-point': {
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">`;
      svg += `<rect x="${padding}" y="${padding}" width="${availableSize}" height="${availableSize}" rx="2" fill="#FEF3C7" opacity="0.2"/>`;
      const cellSize = availableSize / Math.max(rows, cols) * 0.7;
      const spacing = availableSize / (cols + 1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = padding + spacing * (c + 1);
          const cy = padding + spacing * (r + 1);
          svg += `<g transform="translate(${cx} ${cy}) rotate(45)">`;
          svg += `<rect x="${-cellSize / 2}" y="${-cellSize / 2}" width="${cellSize}" height="${cellSize}" rx="1" fill="#DBEAFE" stroke="#93C5FD" stroke-width="0.5"/>`;
          svg += `</g>`;
        }
      }
      svg += `</svg>`;
      return svg;
    }
    case 'strippy': {
      const stripRatio = Math.min(sashingWidth / 15, 0.25);
      const blockCellSize = (availableSize * (1 - stripRatio)) / cols;
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">`;
      const totalBlockWidth = blockCellSize * ((cols + 1) / 2);
      const stripWidth = availableSize * stripRatio / (cols + 1);
      for (let r = 0; r < rows; r++) {
        let x = padding;
        let isBlock = true;
        while (x < padding + availableSize) {
          if (isBlock) {
            svg += `<rect x="${x}" y="${padding + r * blockCellSize + 1}" width="${blockCellSize - 1}" height="${blockCellSize - 2}" rx="1" fill="#DBEAFE" stroke="#93C5FD" stroke-width="0.5"/>`;
            x += blockCellSize;
          } else {
            svg += `<rect x="${x}" y="${padding}" width="${stripWidth}" height="${rows * blockCellSize}" rx="1" fill="#C4B5FD" opacity="0.4"/>`;
            x += stripWidth;
          }
          isBlock = !isBlock;
        }
      }
      svg += `</svg>`;
      return svg;
    }
    case 'medallion': {
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">`;
      svg += `<rect x="${padding}" y="${padding}" width="${availableSize}" height="${availableSize}" rx="3" fill="#C5DFF3" opacity="0.3" stroke="#7CB9E8" stroke-width="0.8"/>`;
      svg += `<rect x="${padding + 8}" y="${padding + 8}" width="${availableSize - 16}" height="${availableSize - 16}" rx="2" fill="#FBCFE8" opacity="0.3" stroke="#EC4899" stroke-width="0.8"/>`;
      svg += `<rect x="${padding + 20}" y="${padding + 20}" width="${availableSize - 40}" height="${availableSize - 40}" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1.2"/>`;
      svg += `</svg>`;
      return svg;
    }
    default: {
      const cellSize = availableSize / cols;
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">`;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = padding + c * cellSize + 2;
          const y = padding + r * cellSize + 2;
          const w = cellSize - 4;
          svg += `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="1" fill="#DBEAFE" stroke="#93C5FD" stroke-width="0.5"/>`;
        }
      }
      svg += `</svg>`;
      return svg;
    }
  }
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
