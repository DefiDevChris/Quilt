import type { LayoutType } from './layout-utils';

const VIEWBOX = 120;
const PADDING = 4;
const AVAILABLE_SIZE = VIEWBOX - PADDING * 2;

export function generateLayoutSvg(
  type: LayoutType,
  rows: number,
  cols: number,
  _blockSize: number,
  sashingWidth: number,
  _showSashing: boolean
): string {
  const availableSize = AVAILABLE_SIZE;
  const padding = PADDING;

  switch (type) {
    case 'grid':
      return generateGridSvg(rows, cols, availableSize, padding);
    case 'sashing':
      return generateSashingSvg(rows, cols, availableSize, padding, sashingWidth);
    case 'on-point':
      return generateOnPointSvg(rows, cols, availableSize, padding);
    case 'strippy':
      return generateStrippySvg(rows, cols, availableSize, padding, sashingWidth);
    case 'medallion':
      return generateMedallionSvg(availableSize, padding);
    default:
      return generateGridSvg(rows, cols, availableSize, padding);
  }
}

function generateGridSvg(
  rows: number,
  cols: number,
  availableSize: number,
  padding: number
): string {
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

function generateSashingSvg(
  rows: number,
  cols: number,
  availableSize: number,
  padding: number,
  sashingWidth: number
): string {
  const sashingRatio = sashingWidth > 0 ? Math.min(sashingWidth / 10, 0.2) : 0;
  const cellSize = (availableSize * (1 - sashingRatio)) / cols;
  const sashingSize = (availableSize * sashingRatio) / (cols + 1);

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

  if (sashingWidth > 0) {
    for (let c = 1; c < cols; c++) {
      const x = padding + c * totalCellAndSash - sashingSize / 2;
      svg += `<rect x="${x}" y="${padding}" width="${sashingSize}" height="${availableSize}" rx="1" fill="#86EFAC" opacity="0.4"/>`;
    }
    for (let r = 1; r < rows; r++) {
      const y = padding + r * totalCellAndSash - sashingSize / 2;
      svg += `<rect x="${padding}" y="${y}" width="${availableSize}" height="${sashingSize}" rx="1" fill="#86EFAC" opacity="0.4"/>`;
    }
  }

  svg += `</svg>`;
  return svg;
}

function generateOnPointSvg(
  rows: number,
  cols: number,
  availableSize: number,
  padding: number
): string {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">`;
  svg += `<rect x="${padding}" y="${padding}" width="${availableSize}" height="${availableSize}" rx="2" fill="#FEF3C7" opacity="0.2"/>`;

  const cellSize = (availableSize / Math.max(rows, cols)) * 0.7;
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

function generateStrippySvg(
  rows: number,
  cols: number,
  availableSize: number,
  padding: number,
  sashingWidth: number
): string {
  const stripRatio = Math.min(sashingWidth / 15, 0.25);
  const blockCellSize = (availableSize * (1 - stripRatio)) / cols;
  const stripWidth = (availableSize * stripRatio) / (cols + 1);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">`;

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

function generateMedallionSvg(availableSize: number, padding: number): string {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">`;

  svg += `<rect x="${padding}" y="${padding}" width="${availableSize}" height="${availableSize}" rx="3" fill="#C5DFF3" opacity="0.3" stroke="#7CB9E8" stroke-width="0.8"/>`;
  svg += `<rect x="${padding + 8}" y="${padding + 8}" width="${availableSize - 16}" height="${availableSize - 16}" rx="2" fill="#FBCFE8" opacity="0.3" stroke="#EC4899" stroke-width="0.8"/>`;
  svg += `<rect x="${padding + 20}" y="${padding + 20}" width="${availableSize - 40}" height="${availableSize - 40}" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1.2"/>`;

  svg += `</svg>`;
  return svg;
}
