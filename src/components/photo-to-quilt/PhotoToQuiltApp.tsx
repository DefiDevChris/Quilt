'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload, Paintbrush, Eraser, Eye, Sparkles, Printer, Undo2, Redo2, RotateCcw, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { patternResultToFabricJson } from '@/lib/photo-to-quilt/to-fabric';
import {
  RGB,
  averageColors,
  colorDistance,
  kMeansQuantize,
  nearestPaletteIndex,
  rgbToHex,
} from '@/lib/photo-to-quilt/colors';

type PatternPiece = {
  colorIndex: number;
  kind: 'square' | 'triangle-a' | 'triangle-b';
  spanW?: number;
  spanH?: number;
  isBackground?: boolean;
};

type PatternCell = {
  x: number;
  y: number;
  pieces: PatternPiece[];
  blockId?: number;
};

type BlockInfo = {
  blockId: number;
  blockX: number;
  blockY: number;
  isSolid: boolean;
  dominantColorIndex: number;
  pieces: { colorIndex: number; kind: string; count: number }[];
  totalPieces: number;
};

type CutListRow = {
  colorIndex: number;
  hex: string;
  squareCount: number;
  triangleCount: number;
  totalCount: number;
};

type CutPieceDetail = {
  colorIndex: number;
  hex: string;
  shape: 'square' | 'hst';
  sizeLabel: string;
  count: number;
  finishedW: number;
  finishedH: number;
  cutW: number;
  cutH: number;
  hypotenuse?: number;
  cutFromSquare?: number;
};

type PatternResult = {
  cols: number;
  rows: number;
  blockSize: number;
  blockCols: number;
  blockRows: number;
  pieceSizeInches: number;
  palette: string[];
  cutList: CutListRow[];
  totalPieces: number;
  totalBlocks: number;
  solidBlocks: number;
  piecedBlocks: number;
  finishedWidth: number;
  finishedHeight: number;
  cells: PatternCell[];
  blocks: BlockInfo[];
  svgMarkup: string;
  backgroundFabric?: string;
};

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAX_WORKING_SIZE = 1100;
const BLOCK_SIZE = 3;
const TRIANGLE_SPLIT_THRESHOLD = 14;
const PALETTE_MERGE_THRESHOLD = 45;

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadText(text: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}

function getCanvasImageData(img: HTMLImageElement, w: number, h: number) {
  const cvs = document.createElement('canvas');
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context failed');
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function sampleBorderColor(imageData: ImageData): RGB {
  const { width, height, data } = imageData;
  const samples: RGB[] = [];
  const add = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  };
  const stepX = Math.max(1, Math.floor(width / 70));
  const stepY = Math.max(1, Math.floor(height / 70));
  for (let x = 0; x < width; x += stepX) { add(x, 0); add(x, height - 1); }
  for (let y = 0; y < height; y += stepY) { add(0, y); add(width - 1, y); }
  return averageColors(samples);
}

function improveMask(mask: Uint8Array, width: number, height: number) {
  const next = new Uint8Array(mask);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      let neigh = 0;
      for (let yy = -1; yy <= 1; yy++)
        for (let xx = -1; xx <= 1; xx++)
          neigh += mask[(y + yy) * width + (x + xx)];
      if (neigh >= 6) next[i] = 1;
      if (neigh <= 2) next[i] = 0;
    }
  }
  const kept = next.reduce((s, v) => s + v, 0);
  if (kept / next.length < 0.03 || kept / next.length > 0.92) {
    return new Uint8Array(width * height).fill(1);
  }
  return next;
}

function dilateMask(mask: Uint8Array, w: number, h: number, passes = 1) {
  let cur = new Uint8Array(mask);
  for (let p = 0; p < passes; p++) {
    const nxt = new Uint8Array(cur);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (cur[y * w + x]) continue;
        let found = false;
        for (let yy = -1; yy <= 1 && !found; yy++)
          for (let xx = -1; xx <= 1 && !found; xx++) {
            const nx = x + xx, ny = y + yy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && cur[ny * w + nx]) found = true;
          }
        if (found) nxt[y * w + x] = 1;
      }
    }
    cur = nxt;
  }
  return cur;
}

function erodeMask(mask: Uint8Array, w: number, h: number, passes = 1) {
  let cur = new Uint8Array(mask);
  for (let p = 0; p < passes; p++) {
    const nxt = new Uint8Array(cur);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let all = true;
        for (let yy = -1; yy <= 1; yy++)
          for (let xx = -1; xx <= 1; xx++)
            if (!cur[(y + yy) * w + (x + xx)]) all = false;
        nxt[y * w + x] = all ? 1 : 0;
      }
    }
    cur = nxt;
  }
  return cur;
}

function closeMask(mask: Uint8Array, w: number, h: number) {
  const filled = erodeMask(dilateMask(mask, w, h, 1), w, h, 1);
  return dilateMask(filled, w, h, 1);
}

function refineAiMask(mask: Uint8Array, w: number, h: number) {
  return closeMask(improveMask(mask, w, h), w, h);
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

function autoCreateMask(imageData: ImageData) {
  const { width, height, data } = imageData;
  const total = width * height;
  const bg = new Uint8Array(total);
  const visited = new Uint8Array(total);
  const mask = new Uint8Array(total);
  const bgColor = sampleBorderColor(imageData);
  const tolerance = 64;
  const queue: number[] = [];
  const enqueue = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const dIdx = idx * 4;
    const alpha = data[dIdx + 3];
    const col = { r: data[dIdx], g: data[dIdx + 1], b: data[dIdx + 2] };
    if (alpha < 10 || colorDistance(col, bgColor) <= tolerance) {
      visited[idx] = 1; bg[idx] = 1; queue.push(idx);
    }
  };
  for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
  for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }
  while (queue.length) {
    const idx = queue.shift()!;
    const x = idx % width, y = Math.floor(idx / width);
    enqueue(x + 1, y); enqueue(x - 1, y);
    enqueue(x, y + 1); enqueue(x, y - 1);
  }
  for (let i = 0; i < total; i++) {
    mask[i] = data[i * 4 + 3] > 10 && !bg[i] ? 1 : 0;
  }
  return dilateMask(improveMask(mask, width, height), width, height, 1);
}

function createMaskFromAlpha(imageData: ImageData) {
  const { width, height, data } = imageData;
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    mask[i] = data[i * 4 + 3] > 6 ? 1 : 0;
  }
  return mask;
}

function findSubjectCrop(mask: Uint8Array, w: number, h: number): CropBox {
  let minX = w, minY = h, maxX = 0, maxY = 0, count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      count++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (count === 0) return { x: 0, y: 0, width: w, height: h };
  const subW = maxX - minX + 1, subH = maxY - minY + 1;
  const padX = Math.round(subW * 0.18), padY = Math.round(subH * 0.18);
  return {
    x: Math.max(0, minX - padX),
    y: Math.max(0, minY - padY),
    width: Math.min(w, maxX + padX) - Math.max(0, minX - padX),
    height: Math.min(h, maxY + padY) - Math.max(0, minY - padY),
  };
}

function adjustColor(col: RGB, contrast: number, saturation: number, brightness: number): RGB {
  let { r, g, b } = col;
  const bF = brightness / 100;
  r *= bF; g *= bF; b *= bF;
  const cF = contrast / 100;
  r = ((r / 255 - 0.5) * cF + 0.5) * 255;
  g = ((g / 255 - 0.5) * cF + 0.5) * 255;
  b = ((b / 255 - 0.5) * cF + 0.5) * 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const sF = saturation / 100;
  r = lum + (r - lum) * sF;
  g = lum + (g - lum) * sF;
  b = lum + (b - lum) * sF;
  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
  };
}

function posterizeImageData(
  imgData: ImageData,
  mask: Uint8Array,
  contrast: number,
  saturation: number,
  brightness: number,
  colorCount: number
): { posterized: ImageData; palette: RGB[] } {
  const { width, height, data } = imgData;

  const subjectPixels: RGB[] = [];
  const pixelIndices: number[] = [];
  for (let i = 0; i < width * height; i++) {
    if (!mask[i]) continue;
    const di = i * 4;
    if (data[di + 3] < 10) continue;
    const col: RGB = { r: data[di], g: data[di + 1], b: data[di + 2] };
    const adjusted = adjustColor(col, contrast, saturation, brightness);
    subjectPixels.push(adjusted);
    pixelIndices.push(i);
  }

  if (subjectPixels.length === 0) return { posterized: imgData, palette: [] };

  const MAX_KMEANS_SAMPLES = 8000;
  let kmeansInput: RGB[];
  if (subjectPixels.length > MAX_KMEANS_SAMPLES) {
    const stride = Math.ceil(subjectPixels.length / MAX_KMEANS_SAMPLES);
    kmeansInput = [];
    for (let i = 0; i < subjectPixels.length; i += stride) {
      kmeansInput.push(subjectPixels[i]);
    }
  } else {
    kmeansInput = subjectPixels;
  }

  let centroids = kMeansQuantize(kmeansInput, colorCount);

  const { palette: consolidated } = consolidatePalette(centroids, PALETTE_MERGE_THRESHOLD);
  centroids = consolidated;

  const result = new ImageData(
    new Uint8ClampedArray(data),
    width,
    height
  );

  for (let p = 0; p < subjectPixels.length; p++) {
    const idx = pixelIndices[p];
    const nearest = nearestPaletteIndex(subjectPixels[p], centroids);
    const snapped = centroids[nearest];
    const di = idx * 4;
    result.data[di] = snapped.r;
    result.data[di + 1] = snapped.g;
    result.data[di + 2] = snapped.b;
  }

  return { posterized: result, palette: centroids };
}

function sampleDominant(
  imgData: ImageData,
  mask: Uint8Array,
  startX: number, endX: number,
  startY: number, endY: number,
  palette: RGB[]
): { dominant: RGB; dominantIdx: number; variance: number; coverage: number } | null {
  const { width, height, data } = imgData;
  const counts = new Map<number, number>();
  let totalValid = 0;
  let totalTested = 0;
  const minX = Math.max(0, Math.floor(startX)), maxX = Math.min(width - 1, Math.ceil(endX));
  const minY = Math.max(0, Math.floor(startY)), maxY = Math.min(height - 1, Math.ceil(endY));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      totalTested++;
      const pi = y * width + x;
      if (!mask[pi]) continue;
      const di = pi * 4;
      if (data[di + 3] < 10) continue;
      totalValid++;
      const col: RGB = { r: data[di], g: data[di + 1], b: data[di + 2] };
      const idx = nearestPaletteIndex(col, palette);
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
  }

  if (totalValid === 0) return null;

  let bestIdx = 0, bestCount = 0;
  counts.forEach((cnt, idx) => { if (cnt > bestCount) { bestCount = cnt; bestIdx = idx; } });

  const dominantColor = palette[bestIdx];
  let variance = 0;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const pi = y * width + x;
      if (!mask[pi]) continue;
      const di = pi * 4;
      if (data[di + 3] < 10) continue;
      const col: RGB = { r: data[di], g: data[di + 1], b: data[di + 2] };
      variance += colorDistance(col, dominantColor);
    }
  }
  variance /= totalValid;

  return {
    dominant: dominantColor,
    dominantIdx: bestIdx,
    variance,
    coverage: totalValid / totalTested,
  };
}

function sampleTriangleRegion(
  imgData: ImageData,
  mask: Uint8Array,
  startX: number, endX: number,
  startY: number, endY: number,
  triangle: 'a' | 'b',
  palette: RGB[]
): number | null {
  const { width, height, data } = imgData;
  const counts = new Map<number, number>();
  let totalValid = 0, tested = 0;
  const minX = Math.max(0, Math.floor(startX)), maxX = Math.min(width - 1, Math.ceil(endX));
  const minY = Math.max(0, Math.floor(startY)), maxY = Math.min(height - 1, Math.ceil(endY));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const nx = (x - startX) / (endX - startX);
      const ny = (y - startY) / (endY - startY);
      if (triangle === 'a' && nx + ny > 1) continue;
      if (triangle === 'b' && nx + ny <= 1) continue;
      tested++;
      const pi = y * width + x;
      if (!mask[pi]) continue;
      const di = pi * 4;
      if (data[di + 3] < 10) continue;
      const col: RGB = { r: data[di], g: data[di + 1], b: data[di + 2] };
      const idx = nearestPaletteIndex(col, palette);
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
      totalValid++;
    }
  }
  if (tested === 0 || totalValid / tested < 0.08) return null;
  let bestIdx = 0, bestCount = 0;
  counts.forEach((cnt, idx) => { if (cnt > bestCount) { bestCount = cnt; bestIdx = idx; } });
  return bestIdx;
}

function consolidatePalette(
  paletteRgb: RGB[],
  threshold: number
): { palette: RGB[]; mapping: number[] } {
  const n = paletteRgb.length;
  if (n <= 1) return { palette: paletteRgb, mapping: paletteRgb.map((_, i) => i) };
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (colorDistance(paletteRgb[i], paletteRgb[j]) < threshold) {
        union(i, j);
      }
    }
  }
  const rootSet = [...new Set(parent.map(find))];
  const newPalette = rootSet.map(root => {
    const members = paletteRgb.filter((_, i) => find(i) === root);
    return averageColors(members);
  });
  const mapping = parent.map(p => rootSet.indexOf(find(p)));
  return { palette: newPalette, mapping };
}

function buildSvg(
  cells: PatternCell[],
  cols: number,
  rows: number,
  blockSize: number,
  blockCols: number,
  blockRows: number,
  palette: string[],
  showGrid: boolean
) {
  const cellPx = 20;
  const w = cols * cellPx, h = rows * cellPx;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fff"/>`;
  for (const cell of cells) {
    const x = cell.x * cellPx, y = cell.y * cellPx;
    for (const p of cell.pieces) {
      if (p.isBackground) continue;
      const fill = palette[p.colorIndex];
      const strokeFix = `stroke="${fill}" stroke-width="0.5" stroke-linejoin="miter"`;
      if (p.kind === 'square') {
        svg += `<rect x="${x}" y="${y}" width="${cellPx * (p.spanW ?? 1)}" height="${cellPx * (p.spanH ?? 1)}" fill="${fill}" ${strokeFix}/>`;
      } else if (p.kind === 'triangle-a') {
        svg += `<polygon points="${x},${y} ${x + cellPx},${y} ${x},${y + cellPx}" fill="${fill}" ${strokeFix}/>`;
      } else if (p.kind === 'triangle-b') {
        svg += `<polygon points="${x + cellPx},${y} ${x + cellPx},${y + cellPx} ${x},${y + cellPx}" fill="${fill}" ${strokeFix}/>`;
      }
    }
  }
  if (showGrid) {
    svg += `<g fill="none" stroke="rgba(54,49,45,0.45)" stroke-width="2.5">`;
    for (let by = 0; by <= blockRows; by++) {
      const y = by * blockSize * cellPx;
      if (y <= h) svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`;
    }
    for (let bx = 0; bx <= blockCols; bx++) {
      const x = bx * blockSize * cellPx;
      if (x <= w) svg += `<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`;
    }
    svg += `</g>`;
    svg += `<g fill="none" stroke="rgba(54,49,45,0.18)" stroke-width="0.8">`;
    for (const cell of cells) {
      const x = cell.x * cellPx, y = cell.y * cellPx;
      for (const p of cell.pieces) {
        if (p.isBackground) continue;
        if (p.kind === 'square') {
          svg += `<rect x="${x}" y="${y}" width="${cellPx * (p.spanW ?? 1)}" height="${cellPx * (p.spanH ?? 1)}"/>`;
        } else if (p.kind === 'triangle-a') {
          svg += `<polygon points="${x},${y} ${x + cellPx},${y} ${x},${y + cellPx}"/>`;
        } else if (p.kind === 'triangle-b') {
          svg += `<polygon points="${x + cellPx},${y} ${x + cellPx},${y + cellPx} ${x},${y + cellPx}"/>`;
        }
      }
    }
    svg += `</g>`;
  }
  svg += `</svg>`;
  return svg;
}

function normalizeCells(cells: PatternCell[]): PatternCell[] {
  const result: PatternCell[] = [];
  for (const cell of cells) {
    for (const piece of cell.pieces) {
      const w = piece.spanW ?? 1;
      const h = piece.spanH ?? 1;
      if (piece.kind !== 'square' || (w === 1 && h === 1)) {
        result.push({ ...cell, pieces: [{ ...piece, spanW: 1, spanH: 1 }] });
        continue;
      }
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          result.push({
            x: cell.x + dx,
            y: cell.y + dy,
            blockId: cell.blockId,
            pieces: [{ colorIndex: piece.colorIndex, kind: 'square' as const, spanW: 1, spanH: 1, isBackground: piece.isBackground }],
          });
        }
      }
    }
  }
  return result;
}

function mergeCellTriangles(cells: PatternCell[]): PatternCell[] {
  return cells.map(cell => {
    if (cell.pieces.length !== 2) return cell;
    const a = cell.pieces.find(p => p.kind === 'triangle-a');
    const b = cell.pieces.find(p => p.kind === 'triangle-b');
    if (!a || !b) return cell;
    if (a.isBackground && b.isBackground) {
      return { ...cell, pieces: [{ colorIndex: a.colorIndex, kind: 'square' as const, spanW: 1, spanH: 1, isBackground: true }] };
    }
    if (a.isBackground || b.isBackground) return cell;
    if (a.colorIndex === b.colorIndex) {
      return { ...cell, pieces: [{ colorIndex: a.colorIndex, kind: 'square' as const, spanW: 1, spanH: 1 }] };
    }
    return cell;
  });
}

function mergeAdjacentSquares(cells: PatternCell[], cols: number, rows: number): PatternCell[] {
  const grid = new Map<string, PatternCell>();
  for (const cell of cells) {
    grid.set(`${cell.x},${cell.y}`, cell);
  }

  const merged: PatternCell[] = [];
  const visited = new Set<string>();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;

      const cell = grid.get(key);
      if (!cell || cell.pieces.length !== 1 || cell.pieces[0].kind !== 'square' || cell.pieces[0].isBackground) {
        if (cell) merged.push(cell);
        visited.add(key);
        continue;
      }

      const colorIdx = cell.pieces[0].colorIndex;
      let maxW = 1;
      while (x + maxW < cols) {
        const nextKey = `${x + maxW},${y}`;
        const nextCell = grid.get(nextKey);
        if (!nextCell || nextCell.pieces.length !== 1 || nextCell.pieces[0].kind !== 'square' || nextCell.pieces[0].isBackground || nextCell.pieces[0].colorIndex !== colorIdx || visited.has(nextKey)) {
          break;
        }
        maxW++;
      }

      let maxH = 1;
      outer: while (y + maxH < rows) {
        for (let dx = 0; dx < maxW; dx++) {
          const nextKey = `${x + dx},${y + maxH}`;
          const nextCell = grid.get(nextKey);
          if (!nextCell || nextCell.pieces.length !== 1 || nextCell.pieces[0].kind !== 'square' || nextCell.pieces[0].isBackground || nextCell.pieces[0].colorIndex !== colorIdx || visited.has(nextKey)) {
            break outer;
          }
        }
        maxH++;
      }

      merged.push({
        x, y, blockId: cell.blockId,
        pieces: [{ colorIndex: colorIdx, kind: 'square', spanW: maxW, spanH: maxH }],
      });

      for (let dy = 0; dy < maxH; dy++) {
        for (let dx = 0; dx < maxW; dx++) {
          visited.add(`${x + dx},${y + dy}`);
        }
      }
    }
  }

  return merged;
}

function isCellBackground(cell: PatternCell): boolean {
  return cell.pieces.length === 0 || cell.pieces.every(p => p.isBackground);
}

function recomputeResult(prev: PatternResult, newCells: PatternCell[]): PatternResult {
  let cells = mergeCellTriangles(newCells);
  cells = mergeAdjacentSquares(cells, prev.cols, prev.rows);

  const bCols = prev.cols / prev.blockSize;
  const bRows = prev.rows / prev.blockSize;
  let blockId = 0;
  const blocks: BlockInfo[] = [];

  for (let by = 0; by < bRows; by++) {
    for (let bx = 0; bx < bCols; bx++) {
      const blockCells = cells.filter(c =>
        c.x >= bx * prev.blockSize && c.x < (bx + 1) * prev.blockSize &&
        c.y >= by * prev.blockSize && c.y < (by + 1) * prev.blockSize
      );
      const currentBlockId = blockId++;
      for (const c of blockCells) c.blockId = currentBlockId;

      if (blockCells.every(isCellBackground)) {
        blocks.push({
          blockId: currentBlockId, blockX: bx, blockY: by,
          isSolid: true, dominantColorIndex: -1,
          pieces: [], totalPieces: 0,
        });
        continue;
      }

      const pieceMap = new Map<string, { colorIndex: number; kind: string; count: number }>();
      for (const c of blockCells) {
        for (const p of c.pieces) {
          if (p.isBackground) continue;
          if (p.kind === 'square') {
            const key = `${p.colorIndex}-sq-${p.spanW ?? 1}x${p.spanH ?? 1}`;
            const existing = pieceMap.get(key);
            if (existing) existing.count++;
            else pieceMap.set(key, { colorIndex: p.colorIndex, kind: `${p.spanW ?? 1}\u00d7${p.spanH ?? 1} square`, count: 1 });
          } else {
            const key = `${p.colorIndex}-tri`;
            const existing = pieceMap.get(key);
            if (existing) existing.count++;
            else pieceMap.set(key, { colorIndex: p.colorIndex, kind: 'Half-square triangle', count: 1 });
          }
        }
      }

      const nonBgCells = blockCells.filter(c => !isCellBackground(c));
      const colorCounts = new Map<number, number>();
      for (const c of nonBgCells) {
        for (const p of c.pieces) {
          if (p.isBackground) continue;
          colorCounts.set(p.colorIndex, (colorCounts.get(p.colorIndex) ?? 0) + 1);
        }
      }
      let dominantIdx = -1, dominantCount = 0;
      colorCounts.forEach((cnt, idx) => { if (cnt > dominantCount) { dominantCount = cnt; dominantIdx = idx; } });

      const allSameSquare = nonBgCells.length === 1 && nonBgCells[0].pieces.length === 1 && nonBgCells[0].pieces[0].kind === 'square' && (nonBgCells[0].pieces[0].spanW ?? 1) === prev.blockSize && (nonBgCells[0].pieces[0].spanH ?? 1) === prev.blockSize;

      blocks.push({
        blockId: currentBlockId, blockX: bx, blockY: by,
        isSolid: allSameSquare, dominantColorIndex: dominantIdx,
        pieces: [...pieceMap.values()],
        totalPieces: [...pieceMap.values()].reduce((s, p) => s + p.count, 0),
      });
    }
  }

  const cutCounts = prev.palette.map(() => ({ sq: 0, tri: 0 }));
  for (const c of cells) {
    for (const p of c.pieces) {
      if (p.isBackground) continue;
      const row = cutCounts[p.colorIndex];
      if (p.kind === 'square') row.sq++;
      else row.tri++;
    }
  }
  const cutList: CutListRow[] = prev.palette.map((hex, i) => {
    const { sq, tri } = cutCounts[i];
    return { colorIndex: i, hex, squareCount: sq, triangleCount: tri, totalCount: sq + tri };
  });

  const nonBgBlocks = blocks.filter(b => !b.pieces.every(p => p.count === 0) && b.totalPieces > 0);
  const solidBlocks = nonBgBlocks.filter(b => b.isSolid).length;
  const totalPieces = cutList.reduce((s, r) => s + r.totalCount, 0);

  return {
    ...prev,
    cells,
    blocks,
    cutList,
    totalPieces,
    totalBlocks: nonBgBlocks.length,
    solidBlocks,
    piecedBlocks: nonBgBlocks.length - solidBlocks,
    svgMarkup: buildSvg(cells, prev.cols, prev.rows, prev.blockSize, prev.blockCols, prev.blockRows, prev.palette, true),
  };
}

function findClickedPiece(
  cx: number, cy: number,
  cellPx: number,
  cell: PatternCell
): { pieceIndex: number; newKind?: 'triangle-a' | 'triangle-b' } | null {
  const relX = cx - cell.x * cellPx;
  const relY = cy - cell.y * cellPx;
  const nx = relX / cellPx;
  const ny = relY / cellPx;

  if (cell.pieces.length === 1 && cell.pieces[0].kind === 'square') {
    return { pieceIndex: 0 };
  }

  if (nx + ny <= 1) {
    const idx = cell.pieces.findIndex(p => p.kind === 'triangle-a');
    return idx >= 0 ? { pieceIndex: idx } : null;
  }
  const idx = cell.pieces.findIndex(p => p.kind === 'triangle-b');
  return idx >= 0 ? { pieceIndex: idx } : null;
}

export default function PhotoToQuiltApp() {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorBoxRef = useRef<HTMLDivElement>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [workingSize, setWorkingSize] = useState({ width: 0, height: 0 });
  const [mask, setMask] = useState<Uint8Array | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgProgress, setBgProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [quiltWidthIn, setQuiltWidthIn] = useState(30);
  const [quiltHeightIn, setQuiltHeightIn] = useState(36);
  const [pieceSizeInches, setPieceSizeInches] = useState(1);
  const [imageAspect, setImageAspect] = useState<number | null>(null);
  const [colorCount, setColorCount] = useState(16);
  const [showGrid, setShowGrid] = useState(true);
  const [showBlockGrid, setShowBlockGrid] = useState(true);

  const [editMode, setEditMode] = useState<'view' | 'paint' | 'erase'>('view');
  const [paintColorIdx, setPaintColorIdx] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [blockPreviewBlock, setBlockPreviewBlock] = useState<BlockInfo | null>(null);
  const [cutPreviewItem, setCutPreviewItem] = useState<CutPieceDetail | null>(null);

  const [rightTab, setRightTab] = useState<'info' | 'export'>('info');

  const [history, setHistory] = useState<PatternResult[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [modalWidth, setModalWidth] = useState(30);
  const [modalHeight, setModalHeight] = useState(36);
  const [modalRemoveBg, setModalRemoveBg] = useState(true);

  const [backgroundFabric, setBackgroundFabric] = useState('#FFFFFF');

  const [enhance, setEnhance] = useState(0);
  const contrast = useMemo(() => 100 + enhance * 0.2, [enhance]);
  const saturation = useMemo(() => 100 + enhance * 0.3, [enhance]);
  const brightness = useMemo(() => 100 + enhance * 0.08, [enhance]);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<PatternResult | null>(null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const router = useRouter();

  const { cols, rows } = useMemo(() => {
    const maxCols = Math.floor(quiltWidthIn / pieceSizeInches);
    const maxRows = Math.floor(quiltHeightIn / pieceSizeInches);
    let rawCols: number;
    let rawRows: number;
    if (imageAspect != null) {
      const maxByWidth = maxCols;
      const maxByHeight = Math.floor(maxCols / imageAspect);
      if (maxByHeight <= maxRows) {
        rawCols = maxByWidth;
        rawRows = maxByHeight;
      } else {
        rawRows = maxRows;
        rawCols = Math.floor(maxRows * imageAspect);
      }
    } else {
      rawCols = maxCols;
      rawRows = maxRows;
    }
    const c = Math.max(BLOCK_SIZE, Math.floor(rawCols / BLOCK_SIZE) * BLOCK_SIZE);
    const r = Math.max(BLOCK_SIZE, Math.floor(rawRows / BLOCK_SIZE) * BLOCK_SIZE);
    return { cols: c, rows: r };
  }, [quiltWidthIn, quiltHeightIn, pieceSizeInches, imageAspect]);

  const blockCols = cols / BLOCK_SIZE;
  const blockRows = rows / BLOCK_SIZE;

  const finishedWidth = cols * pieceSizeInches;
  const finishedHeight = rows * pieceSizeInches;

  const cutPieceDetails = useMemo(() => {
    if (!result) return [];
    const details: CutPieceDetail[] = [];
    const psi = result.pieceSizeInches;

    for (const cell of result.cells) {
      for (const piece of cell.pieces) {
        if (piece.isBackground) continue;
        if (piece.kind === 'square') {
          const w = (piece.spanW ?? 1) * psi;
          const h = (piece.spanH ?? 1) * psi;
          const label = `${piece.spanW ?? 1}\u00d7${piece.spanH ?? 1}`;
          let detail = details.find(d => d.colorIndex === piece.colorIndex && d.shape === 'square' && d.sizeLabel === label);
          if (!detail) {
            detail = {
              colorIndex: piece.colorIndex,
              hex: result.palette[piece.colorIndex],
              shape: 'square',
              sizeLabel: label,
              count: 0,
              finishedW: w,
              finishedH: h,
              cutW: parseFloat((w + 0.5).toFixed(3)),
              cutH: parseFloat((h + 0.5).toFixed(3)),
            };
            details.push(detail);
          }
          detail.count++;
        } else {
          const leg = psi;
          const hyp = parseFloat((leg * Math.SQRT2).toFixed(3));
          const cutSquare = parseFloat((leg + 0.875).toFixed(3));
          let detail = details.find(d => d.colorIndex === piece.colorIndex && d.shape === 'hst');
          if (!detail) {
            detail = {
              colorIndex: piece.colorIndex,
              hex: result.palette[piece.colorIndex],
              shape: 'hst',
              sizeLabel: 'HST',
              count: 0,
              finishedW: parseFloat(leg.toFixed(3)),
              finishedH: parseFloat(leg.toFixed(3)),
              cutW: cutSquare,
              cutH: cutSquare,
              hypotenuse: hyp,
              cutFromSquare: cutSquare,
            };
            details.push(detail);
          }
          detail.count++;
        }
      }
    }

    return details.sort((a, b) => a.colorIndex - b.colorIndex || a.shape.localeCompare(b.shape));
  }, [result]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const box = editorBoxRef.current;
      if (!box) return;

      const updateSize = () => {
        const parent = box.parentElement;
        if (!parent) return;
        const style = getComputedStyle(parent);
        const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        const availW = parent.clientWidth - padX;
        const availH = parent.clientHeight - padY;

        const gridAspect = cols / rows;
        let displayW = availW;
        let displayH = displayW / gridAspect;

        if (displayH > availH) {
          displayH = availH;
          displayW = displayH * gridAspect;
        }

        box.style.width = `${Math.round(displayW)}px`;
        box.style.height = `${Math.round(displayH)}px`;
      };

      updateSize();

      const ro = new ResizeObserver(updateSize);
      if (box.parentElement) ro.observe(box.parentElement);
      window.addEventListener('resize', updateSize);

      (box as HTMLDivElement & { _cleanup?: () => void })._cleanup = () => {
        ro.disconnect();
        window.removeEventListener('resize', updateSize);
      };
    });

    return () => {
      cancelAnimationFrame(raf);
      const box = editorBoxRef.current;
      (box as HTMLDivElement & { _cleanup?: () => void })?._cleanup?.();
    };
  }, [cols, rows]);

  const renderCanvas = useCallback(
    (cells: PatternCell[], pal: string[], bgFabric: string = '#FFFFFF') => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxPx = 980;
      const cellPx = Math.max(7, Math.floor(maxPx / cols));
      canvas.width = cols * cellPx;
      canvas.height = rows * cellPx;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = bgFabric;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const cell of cells) {
        const px = cell.x * cellPx, py = cell.y * cellPx;
        for (const p of cell.pieces) {
          if (p.isBackground) continue;
          ctx.fillStyle = pal[p.colorIndex];
          ctx.strokeStyle = pal[p.colorIndex];
          ctx.lineWidth = 0.5;
          ctx.lineJoin = 'miter';

          if (p.kind === 'square') {
            const w = cellPx * (p.spanW ?? 1);
            const h = cellPx * (p.spanH ?? 1);
            ctx.fillRect(px, py, w, h);
            ctx.strokeRect(px, py, w, h);
          } else if (p.kind === 'triangle-a') {
            ctx.beginPath();
            ctx.moveTo(px, py); ctx.lineTo(px + cellPx * (p.spanW ?? 1), py);
            ctx.lineTo(px, py + cellPx * (p.spanH ?? 1));
            ctx.closePath(); ctx.fill(); ctx.stroke();
          } else if (p.kind === 'triangle-b') {
            ctx.beginPath();
            ctx.moveTo(px + cellPx * (p.spanW ?? 1), py);
            ctx.lineTo(px + cellPx * (p.spanW ?? 1), py + cellPx * (p.spanH ?? 1));
            ctx.lineTo(px, py + cellPx * (p.spanH ?? 1));
            ctx.closePath(); ctx.fill(); ctx.stroke();
          }
        }
      }

      if (showGrid) {
        if (showBlockGrid) {
          ctx.strokeStyle = 'rgba(54,49,45,0.5)';
          ctx.lineWidth = 2;
          for (let by = 0; by <= blockRows; by++) {
            const y = by * BLOCK_SIZE * cellPx;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cols * cellPx, y); ctx.stroke();
          }
          for (let bx = 0; bx <= blockCols; bx++) {
            const x = bx * BLOCK_SIZE * cellPx;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rows * cellPx); ctx.stroke();
          }
        }
        ctx.strokeStyle = 'rgba(54,49,45,0.18)';
        ctx.lineWidth = 0.8;
        for (const cell of cells) {
          const px = cell.x * cellPx, py = cell.y * cellPx;
          for (const p of cell.pieces) {
            if (p.isBackground) continue;
            if (p.kind === 'square') {
              ctx.strokeRect(px + 0.5, py + 0.5, cellPx * (p.spanW ?? 1), cellPx * (p.spanH ?? 1));
            } else if (p.kind === 'triangle-a') {
              ctx.beginPath();
              ctx.moveTo(px + 0.5, py + 0.5);
              ctx.lineTo(px + cellPx * (p.spanW ?? 1) + 0.5, py + 0.5);
              ctx.lineTo(px + 0.5, py + cellPx * (p.spanH ?? 1) + 0.5);
              ctx.stroke();
            } else if (p.kind === 'triangle-b') {
              ctx.beginPath();
              ctx.moveTo(px + cellPx * (p.spanW ?? 1) + 0.5, py + 0.5);
              ctx.lineTo(px + cellPx * (p.spanW ?? 1) + 0.5, py + cellPx * (p.spanH ?? 1) + 0.5);
              ctx.lineTo(px + 0.5, py + cellPx * (p.spanH ?? 1) + 0.5);
              ctx.stroke();
            }
          }
        }
      }
    },
    [cols, rows, blockCols, blockRows, showGrid, showBlockGrid]
  );

  useEffect(() => {
    if (result) {
      renderCanvas(result.cells, result.palette, result.backgroundFabric ?? '#FFFFFF');
      setResult((prev) => prev ? { ...prev, svgMarkup: buildSvg(prev.cells, prev.cols, prev.rows, prev.blockSize, prev.blockCols, prev.blockRows, prev.palette, showGrid) } : null);
    }
  }, [showGrid, showBlockGrid, renderCanvas, result]);

  useEffect(() => {
    if (!result || !canvasRef.current) return;

    renderCanvas(result.cells, result.palette, result.backgroundFabric ?? '#FFFFFF');

    if (selectedBlockId != null) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const maxPx = 980;
      const cellPx = Math.max(7, Math.floor(maxPx / cols));
      const block = result.blocks.find(b => b.blockId === selectedBlockId);
      if (block) {
        const x = block.blockX * BLOCK_SIZE * cellPx;
        const y = block.blockY * BLOCK_SIZE * cellPx;
        const w = BLOCK_SIZE * cellPx;
        const h = BLOCK_SIZE * cellPx;

        ctx.fillStyle = 'rgba(124, 185, 232, 0.25)';
        ctx.fillRect(x, y, w, h);

        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#5aa0d5';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
        ctx.setLineDash([]);
      }
    }
  }, [selectedBlockId, result, renderCanvas, cols]);

  const handleCanvasInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editMode === 'view' || !result) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const maxPx = 980;
    const cellPx = Math.max(7, Math.floor(maxPx / cols));
    const gridX = Math.floor(cx / cellPx);
    const gridY = Math.floor(cy / cellPx);
    if (gridX < 0 || gridX >= cols || gridY < 0 || gridY >= rows) return;

    setResult(prev => {
      if (!prev) return prev;

      // Normalize first so multi-span cells are exploded
      let newCells = normalizeCells(prev.cells);

      // Find the exact cell at this grid position
      const cellIndex = newCells.findIndex(c => c.x === gridX && c.y === gridY);
      if (cellIndex < 0) return prev;

      const cell = newCells[cellIndex];
      const clicked = findClickedPiece(cx, cy, cellPx, cell);
      if (!clicked) return prev;

      if (editMode === 'erase') {
        const newPieces = [...cell.pieces];
        newPieces[clicked.pieceIndex] = { ...newPieces[clicked.pieceIndex], isBackground: true };
        // Remove remaining background-only cells
        const filteredPieces = newPieces.filter(p => !p.isBackground);
        newCells[cellIndex] = { ...cell, pieces: filteredPieces };
      } else if (editMode === 'paint') {
        const newPieces = [...cell.pieces];
        newPieces[clicked.pieceIndex] = { ...newPieces[clicked.pieceIndex], colorIndex: paintColorIdx, isBackground: false };
        newCells[cellIndex] = { ...cell, pieces: newPieces };
      }

      const nextResult = recomputeResult(prev, newCells);
      renderCanvas(nextResult.cells, nextResult.palette, nextResult.backgroundFabric ?? '#FFFFFF');

      // Push to history
      setHistory(h => {
        const before = h.slice(0, historyIndex + 1);
        return [...before, nextResult];
      });
      setHistoryIndex(historyIndex + 1);

      return nextResult;
    });
  }, [editMode, paintColorIdx, cols, rows, result, renderCanvas, historyIndex]);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setPendingFile(file);
    setShowUploadModal(true);
  };

  const processUpload = async () => {
    const file = pendingFile;
    if (!file) return;
    setShowUploadModal(false);
    setIsRemovingBg(true);
    setBgProgress(0);
    setResult(null);
    setHistory([]);
    setHistoryIndex(-1);
    let origUrl: string | null = null, procUrl: string | null = null;
    try {
      origUrl = URL.createObjectURL(file);
      if (modalRemoveBg) {
        try {
          const { removeBackground } = await import('@imgly/background-removal');
          const blob = await removeBackground(file, {
            publicPath: 'https://unpkg.com/@imgly/background-removal@1.7.0/dist/',
            output: { format: 'image/png', quality: 1 },
            progress: (_key: string, cur: number, tot: number) => {
              if (tot) setBgProgress(Math.round((cur / tot) * 100));
            },
          });
          procUrl = URL.createObjectURL(blob);
          const img = await loadHtmlImage(procUrl);
          const scale = Math.min(1, MAX_WORKING_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
          const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
          const idata = getCanvasImageData(img, w, h);
          const am = createMaskFromAlpha(idata);
          const refined = refineAiMask(am, w, h);
          setImage(img);
          setImageName(file.name.replace(/\.[^.]+$/, ''));
          setWorkingSize({ width: w, height: h });
          setMask(refined);
          setPreviewUrl(procUrl);
          setImageAspect(w / h);
          URL.revokeObjectURL(origUrl);
        } catch {
          // Fallback: no background removal
          const img = await loadHtmlImage(origUrl!);
          const scale = Math.min(1, MAX_WORKING_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
          const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
          const idata = getCanvasImageData(img, w, h);
          const m = new Uint8Array(w * h).fill(1); // all foreground when not removing bg
          setImage(img);
          setImageName(file.name.replace(/\.[^.]+$/, ''));
          setWorkingSize({ width: w, height: h });
          setMask(m);
          setPreviewUrl(origUrl!);
          setImageAspect(w / h);
        }
      } else {
        const img = await loadHtmlImage(origUrl!);
        const scale = Math.min(1, MAX_WORKING_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
        const idata = getCanvasImageData(img, w, h);
        const m = new Uint8Array(w * h).fill(1);
        setImage(img);
        setImageName(file.name.replace(/\.[^.]+$/, ''));
        setWorkingSize({ width: w, height: h });
        setMask(m);
        setPreviewUrl(origUrl!);
        setImageAspect(w / h);
      }
    } catch {
      alert('Could not load the image.');
    } finally {
      setIsRemovingBg(false);
      setPendingFile(null);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generatePattern = () => {
    if (!image || !mask) return;
    setGenerating(true);
    requestAnimationFrame(() => {
      try {
        const rawImgData = getCanvasImageData(image, workingSize.width, workingSize.height);
        const crop = findSubjectCrop(mask, workingSize.width, workingSize.height);
        const gridCols = cols, gridRows = rows;
        const cellW = crop.width / gridCols, cellH = crop.height / gridRows;

        const { posterized, palette: paletteRgb } = posterizeImageData(
          rawImgData, mask, contrast, saturation, brightness, colorCount
        );

        if (paletteRgb.length === 0) {
          alert('No subject detail found.');
          return;
        }

        let palette = paletteRgb.map(rgbToHex);
        palette = [...palette, '#FFFFFF'];

        const cellIdx: (number | null)[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(null));
        const cellVariance: number[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));

        for (let y = 0; y < gridRows; y++) {
          for (let x = 0; x < gridCols; x++) {
            const sx = crop.x + x * cellW, ex = crop.x + (x + 1) * cellW;
            const sy = crop.y + y * cellH, ey = crop.y + (y + 1) * cellH;
            const stat = sampleDominant(posterized, mask, sx, ex, sy, ey, paletteRgb);
            if (stat && stat.coverage > 0.025) {
              cellIdx[y][x] = stat.dominantIdx;
              cellVariance[y][x] = stat.variance;
            }
          }
        }

        const cells: PatternCell[] = [];
        const blocks: BlockInfo[] = [];
        const triThreshold = TRIANGLE_SPLIT_THRESHOLD;

        const bCols = gridCols / BLOCK_SIZE;
        const bRows = gridRows / BLOCK_SIZE;
        let blockId = 0;

        for (let by = 0; by < bRows; by++) {
          for (let bx = 0; bx < bCols; bx++) {
            const baseY = by * BLOCK_SIZE;
            const baseX = bx * BLOCK_SIZE;

            let allSame = true;
            let firstIdx: number | null = null;
            let hasNull = false;

            for (let dy = 0; dy < BLOCK_SIZE; dy++) {
              for (let dx = 0; dx < BLOCK_SIZE; dx++) {
                const idx = cellIdx[baseY + dy][baseX + dx];
                if (idx == null) { hasNull = true; continue; }
                if (firstIdx == null) firstIdx = idx;
                else if (idx !== firstIdx) allSame = false;
              }
            }

            if (hasNull) allSame = false;
            const currentBlockId = blockId++;

            if (allSame && firstIdx != null) {
              cells.push({
                x: baseX, y: baseY, blockId: currentBlockId,
                pieces: [{ colorIndex: firstIdx, kind: 'square', spanW: BLOCK_SIZE, spanH: BLOCK_SIZE }],
              });
              blocks.push({
                blockId: currentBlockId, blockX: bx, blockY: by,
                isSolid: true, dominantColorIndex: firstIdx,
                pieces: [{ colorIndex: firstIdx, kind: '3\u00d73 square', count: 1 }],
                totalPieces: 1,
              });
            } else {
              const pieceMap = new Map<string, { colorIndex: number; kind: string; count: number }>();

              for (let dy = 0; dy < BLOCK_SIZE; dy++) {
                for (let dx = 0; dx < BLOCK_SIZE; dx++) {
                  const cy = baseY + dy;
                  const cx = baseX + dx;
                  const idx = cellIdx[cy][cx];
                  if (idx == null) continue;

                  const sx = crop.x + cx * cellW, ex = crop.x + (cx + 1) * cellW;
                  const sy = crop.y + cy * cellH, ey = crop.y + (cy + 1) * cellH;

                  const triA = sampleTriangleRegion(posterized, mask, sx, ex, sy, ey, 'a', paletteRgb);
                  const triB = sampleTriangleRegion(posterized, mask, sx, ex, sy, ey, 'b', paletteRgb);

                  let split = false;
                  if (triA != null && triB != null) {
                    if (triA !== triB || cellVariance[cy][cx] > triThreshold) {
                      cells.push({
                        x: cx, y: cy, blockId: currentBlockId,
                        pieces: [
                          { colorIndex: triA, kind: 'triangle-a' },
                          { colorIndex: triB, kind: 'triangle-b' },
                        ],
                      });

                      const keyA = `${triA}-tri`;
                      const pA = pieceMap.get(keyA);
                      if (pA) pA.count++; else pieceMap.set(keyA, { colorIndex: triA, kind: 'Half-square triangle', count: 1 });
                      const keyB = `${triB}-tri`;
                      const pB = pieceMap.get(keyB);
                      if (pB) pB.count++; else pieceMap.set(keyB, { colorIndex: triB, kind: 'Half-square triangle', count: 1 });

                      split = true;
                    }
                  }

                  if (!split) {
                    cells.push({
                      x: cx, y: cy, blockId: currentBlockId,
                      pieces: [{ colorIndex: idx, kind: 'square', spanW: 1, spanH: 1 }],
                    });
                    const key = `${idx}-sq`;
                    const p = pieceMap.get(key);
                    if (p) p.count++; else pieceMap.set(key, { colorIndex: idx, kind: '1\u00d71 square', count: 1 });
                  }
                }
              }

              const colorCounts = new Map<number, number>();
              for (let dy = 0; dy < BLOCK_SIZE; dy++) {
                for (let dx = 0; dx < BLOCK_SIZE; dx++) {
                  const idx = cellIdx[baseY + dy]?.[baseX + dx];
                  if (idx != null) colorCounts.set(idx, (colorCounts.get(idx) ?? 0) + 1);
                }
              }
              let dominantIdx = 0, dominantCount = 0;
              colorCounts.forEach((cnt, idx) => { if (cnt > dominantCount) { dominantCount = cnt; dominantIdx = idx; } });

              blocks.push({
                blockId: currentBlockId, blockX: bx, blockY: by,
                isSolid: false, dominantColorIndex: dominantIdx,
                pieces: [...pieceMap.values()],
                totalPieces: [...pieceMap.values()].reduce((s, p) => s + p.count, 0),
              });
            }
          }
        }

        const cutCounts = palette.map(() => ({ sq: 0, tri: 0 }));
        for (const c of cells) {
          for (const p of c.pieces) {
            const row = cutCounts[p.colorIndex];
            if (p.kind === 'square') row.sq++;
            else row.tri++;
          }
        }
        const cutList: CutListRow[] = palette.map((hex, i) => {
          const { sq, tri } = cutCounts[i];
          return { colorIndex: i, hex, squareCount: sq, triangleCount: tri, totalCount: sq + tri };
        });
        const totalPieces = cutList.reduce((s, r) => s + r.totalCount, 0);
        const totalBlocks = blocks.length;
        const solidBlocks = blocks.filter(b => b.isSolid).length;
        const piecedBlocks = totalBlocks - solidBlocks;

        // Normalize cells for editing (explode multi-span cells into 1x1)
        const normalizedCells = normalizeCells(cells);
        const mergedCells = mergeCellTriangles(normalizedCells);

        const newResult: PatternResult = {
          cols: gridCols, rows: gridRows,
          blockSize: BLOCK_SIZE, blockCols: bCols, blockRows: bRows,
          pieceSizeInches, palette, cutList, totalPieces,
          totalBlocks, solidBlocks, piecedBlocks,
          finishedWidth: gridCols * pieceSizeInches,
          finishedHeight: gridRows * pieceSizeInches,
          cells: mergedCells, blocks,
          svgMarkup: buildSvg(mergedCells, gridCols, gridRows, BLOCK_SIZE, bCols, bRows, palette, showGrid),
          backgroundFabric,
        };

        renderCanvas(mergedCells, palette, backgroundFabric);
        setResult(newResult);
        setHistory([newResult]);
        setHistoryIndex(0);
        setEditMode('view');
      } finally {
        setGenerating(false);
      }
    });
  };

  useEffect(() => {
    if (image && mask && !result && !generating) {
      const t = setTimeout(() => { generatePattern(); }, 50);
      return () => clearTimeout(t);
    }
  }, [image, mask]);

  useEffect(() => {
    if (image && mask && result && !generating) {
      const t = setTimeout(() => { generatePattern(); }, 300);
      return () => clearTimeout(t);
    }
  }, [quiltWidthIn, quiltHeightIn, pieceSizeInches, colorCount, enhance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+Z = Redo
          if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setResult(next);
            renderCanvas(next.cells, next.palette, next.backgroundFabric ?? '#FFFFFF');
            setHistoryIndex(historyIndex + 1);
          }
        } else {
          // Ctrl+Z = Undo
          if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setResult(prev);
            renderCanvas(prev.cells, prev.palette, prev.backgroundFabric ?? '#FFFFFF');
            setHistoryIndex(historyIndex - 1);
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history, historyIndex, renderCanvas]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setResult(prev);
      renderCanvas(prev.cells, prev.palette, prev.backgroundFabric ?? '#FFFFFF');
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setResult(next);
      renderCanvas(next.cells, next.palette, next.backgroundFabric ?? '#FFFFFF');
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleReset = () => {
    if (history.length > 0) {
      const base = history[0];
      setResult(base);
      renderCanvas(base.cells, base.palette, base.backgroundFabric ?? '#FFFFFF');
      setHistory([base]);
      setHistoryIndex(0);
    }
  };

  const handleBackgroundFabricChange = (color: string) => {
    setBackgroundFabric(color);
    setResult(prev => {
      if (!prev) return prev;
      const next = { ...prev, backgroundFabric: color };
      renderCanvas(next.cells, next.palette, next.backgroundFabric ?? '#FFFFFF');
      return next;
    });
  };

  const updatePaletteColor = (idx: number, next: string) => {
    setResult(prev => {
      if (!prev) return prev;
      const newPal = prev.palette.map((c, i) => i === idx ? next.toUpperCase() : c);
      const newCut = prev.cutList.map(r => r.colorIndex === idx ? { ...r, hex: next.toUpperCase() } : r);
      renderCanvas(prev.cells, newPal, prev.backgroundFabric ?? '#FFFFFF');
      return { ...prev, palette: newPal, cutList: newCut, svgMarkup: buildSvg(prev.cells, prev.cols, prev.rows, prev.blockSize, prev.blockCols, prev.blockRows, newPal, showGrid) };
    });
  };

  const handleSaveToStudio = async () => {
    if (!result) return;
    const user = useAuthStore.getState().user;
    if (!user) {
      router.push('/auth/signin?callbackUrl=/photo-to-quilt');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const canvasData = patternResultToFabricJson(result);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim() || 'Photo Quilt Design',
          mode: 'photo-to-quilt',
          unitSystem: 'imperial',
          canvasWidth: result.finishedWidth,
          canvasHeight: result.finishedHeight,
          canvasData,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save project');
      }
      const json = await res.json();
      if (!json.success || !json.data?.id) {
        throw new Error('Invalid response from server');
      }
      setShowSaveModal(false);
      setSaveName('');
      router.push(`/studio/${json.data.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const file = e.dataTransfer.files?.[0] ?? null; if (file) handleUpload(file); };

  return (
    <main className="p2q-shell">
      <input ref={fileRef} type="file" accept="image/*" className="p2q-visually-hidden"
        onChange={e => handleUpload(e.target.files?.[0] ?? null)} />

      {/* Left panel */}
      <aside className="p2q-left-panel">
        <div className="p2q-left-scroll">
          <section className="p2q-flow-card">
            <h2 style={{ fontSize: '1.05rem', marginBottom: 12, fontFamily: 'var(--font-heading)', fontWeight: 900, letterSpacing: '-0.03em' }}>Photo</h2>
            {image ? (
              <div className="p2q-photo-card" onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer', position: 'relative' }}>
                <img src={previewUrl || ''} alt="Preview" />
                <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center' }}>
                  <span style={{ background: 'white', padding: '4px 12px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', color: 'var(--color-primary-hover)' }}>Change</span>
                </div>
              </div>
            ) : (
              <div className={`p2q-photo-card p2q-photo-empty ${isDragging ? 'p2q-dragging' : ''}`}
                onClick={() => fileRef.current?.click()}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 20 }}>
                <ImagePlus strokeWidth={2} size={24} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-primary-hover)' }}>Upload Photo</span>
              </div>
            )}
          </section>

          <section className="p2q-flow-card">
            <h2 style={{ fontSize: '1.05rem', marginBottom: 16, fontFamily: 'var(--font-heading)', fontWeight: 900, letterSpacing: '-0.03em' }}>Design Settings</h2>
            <div style={{ display: 'grid', gap: 18 }}>
              <label className="p2q-range-field" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-dim)', fontSize: '0.82rem' }}>Piece Size</span>
                  <strong style={{ color: 'var(--color-primary-hover)', fontSize: '0.85rem' }}>{pieceSizeInches}&quot;</strong>
                </div>
                <input type="range" min={0.5} max={3} step={0.5} value={pieceSizeInches} onChange={e => setPieceSizeInches(Number(e.target.value))} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--color-text-dim)', marginTop: 2 }}>
                  <span>Fine</span><span>Large</span>
                </div>
              </label>

              <label className="p2q-range-field" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-dim)', fontSize: '0.82rem' }}>Fabric Palette</span>
                  <strong style={{ color: 'var(--color-primary-hover)', fontSize: '0.85rem' }}>{colorCount} colors</strong>
                </div>
                <input type="range" min={3} max={64} value={colorCount} onChange={e => setColorCount(Number(e.target.value))} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--color-text-dim)', marginTop: 2 }}>
                  <span>Simple</span><span>Detailed</span>
                </div>
              </label>

              <label className="p2q-range-field" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-dim)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={13} style={{ color: 'var(--color-primary)' }} /> Photo Enhance
                  </span>
                  <strong style={{ color: enhance === 0 ? 'var(--color-text-dim)' : 'var(--color-primary-hover)', fontSize: '0.85rem' }}>{enhance}%</strong>
                </div>
                <input type="range" min={0} max={100} value={enhance} onChange={e => setEnhance(Number(e.target.value))} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--color-text-dim)', marginTop: 2 }}>
                  <span>Original</span><span>Enhanced</span>
                </div>
              </label>

              <div style={{ height: 1, background: 'var(--color-border)' }} />

              <div className="p2q-field" style={{ marginBottom: 0 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, color: 'var(--color-text-dim)', fontSize: '0.82rem', fontWeight: 850 }}>Quilt Size (inches)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="number" min={6} max={120} value={quiltWidthIn}
                    onChange={e => setQuiltWidthIn(Math.max(6, Math.min(120, Number(e.target.value))))}
                    placeholder="Width"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}
                  />
                  <input
                    type="number" min={6} max={120} value={quiltHeightIn}
                    onChange={e => setQuiltHeightIn(Math.max(6, Math.min(120, Number(e.target.value))))}
                    placeholder="Height"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', lineHeight: 1.5, padding: '2px 0' }}>
                Grid: {cols} &times; {rows} cells &nbsp;&middot;&nbsp; {finishedWidth.toFixed(1)}&quot; &times; {finishedHeight.toFixed(1)}&quot;
                {imageAspect != null && (quiltWidthIn !== finishedWidth || quiltHeightIn !== finishedHeight) && (
                  <span style={{ display: 'block', marginTop: 2, fontSize: '0.72rem', color: 'var(--color-primary-hover)' }}>
                    Fitted to photo aspect ratio within {quiltWidthIn}&quot; &times; {quiltHeightIn}&quot;
                  </span>
                )}
              </div>

              <div style={{ height: 1, background: 'var(--color-border)' }} />

              <div className="p2q-field" style={{ marginBottom: 0 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, color: 'var(--color-text-dim)', fontSize: '0.82rem', fontWeight: 850 }}>Background Fabric</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={backgroundFabric}
                    onChange={e => handleBackgroundFabricChange(e.target.value)}
                    style={{ width: 40, height: 32, padding: 0, border: '1.5px solid var(--color-border)', borderRadius: 8, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', fontFamily: 'monospace' }}>{backgroundFabric.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>

      {/* Center: Editor canvas */}
      <section className="p2q-main-preview" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <div className="p2q-preview-topbar">
          <div>
            <strong>{result ? 'Quilt Pattern Preview' : isRemovingBg ? 'Processing Photo\u2026' : 'Ready to Create'}</strong>
            <span>{result
              ? `${result.blockCols}\u00d7${result.blockRows} blocks \u00b7 ${result.palette.length - 1} colors`
              : isRemovingBg
                ? `Removing background\u2026 ${bgProgress}%`
                : 'Drop a photo or click upload to get started'}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {result && (
              <button
                type="button"
                onClick={() => { setSaveName(''); setSaveError(null); setShowSaveModal(true); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: '1.5px solid var(--color-primary)',
                }}
              >
                <Save size={14} />
                Save to Studio
              </button>
            )}
            <label className="p2q-grid-toggle">
              <input type="checkbox" checked={showBlockGrid} onChange={e => setShowBlockGrid(e.target.checked)} />
              Block grid
            </label>
            <label className="p2q-grid-toggle">
              <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
              Piece outlines
            </label>
          </div>
        </div>

        {/* Edit toolbar */}
        {result && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', padding: '6px 12px', background: 'var(--color-surface, #f8f6f4)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setEditMode('view')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                background: editMode === 'view' ? 'var(--color-primary)' : 'transparent',
                color: editMode === 'view' ? '#fff' : 'var(--color-text)',
                border: '1.5px solid var(--color-primary)',
              }}
            >
              <Eye size={14} /> View
            </button>
            <button
              onClick={() => setEditMode('paint')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                background: editMode === 'paint' ? 'var(--color-primary)' : 'transparent',
                color: editMode === 'paint' ? '#fff' : 'var(--color-text)',
                border: '1.5px solid var(--color-primary)',
              }}
            >
              <Paintbrush size={14} /> Paint
            </button>
            <button
              onClick={() => setEditMode('erase')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                background: editMode === 'erase' ? 'var(--color-primary)' : 'transparent',
                color: editMode === 'erase' ? '#fff' : 'var(--color-text)',
                border: '1.5px solid var(--color-primary)',
              }}
            >
              <Eraser size={14} /> Erase
            </button>
            <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer', opacity: historyIndex <= 0 ? 0.4 : 1,
                background: 'transparent', color: 'var(--color-text)', border: '1.5px solid var(--color-border)',
              }}
            >
              <Undo2 size={14} /> Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer', opacity: historyIndex >= history.length - 1 ? 0.4 : 1,
                background: 'transparent', color: 'var(--color-text)', border: '1.5px solid var(--color-border)',
              }}
            >
              <Redo2 size={14} /> Redo
            </button>
            <button
              onClick={handleReset}
              disabled={history.length === 0}
              title="Reset all changes"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: history.length === 0 ? 'not-allowed' : 'pointer', opacity: history.length === 0 ? 0.4 : 1,
                background: 'transparent', color: 'var(--color-text)', border: '1.5px solid var(--color-border)',
              }}
            >
              <RotateCcw size={14} /> Reset
            </button>
            {editMode === 'paint' && result && (
              <div style={{ display: 'flex', gap: 4, marginLeft: 12, flexWrap: 'wrap' }}>
                {result.palette.filter((_, i) => i < result.palette.length - 1).map((hex, i) => (
                  <div key={i} onClick={() => setPaintColorIdx(i)}
                    style={{
                      width: 24, height: 24, borderRadius: 4, background: hex, cursor: 'pointer',
                      border: i === paintColorIdx ? '3px solid var(--color-primary-hover)' : '2px solid #ccc',
                      boxShadow: i === paintColorIdx ? '0 0 0 1px var(--color-primary)' : 'none',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p2q-canvas-stage" style={{ position: 'relative' }}>
          <div className="p2q-stage-info-card">
            <span>Finished size</span>
            <strong>
              {result
                ? `${result.finishedWidth.toFixed(1)}\u2033 \u00d7 ${result.finishedHeight.toFixed(1)}\u2033`
                : `${finishedWidth.toFixed(1)}\u2033 \u00d7 ${finishedHeight.toFixed(1)}\u2033`}
            </strong>
          </div>
          <div className="p2q-pattern-paper">
            <div className="p2q-canvas-aspect-box" ref={editorBoxRef}>
              <canvas
                ref={canvasRef}
                className="p2q-pattern-canvas"
                style={{ cursor: editMode === 'paint' ? 'crosshair' : editMode === 'erase' ? 'pointer' : 'default' }}
                onMouseDown={(e) => { setIsMouseDown(true); handleCanvasInteraction(e); }}
                onMouseMove={(e) => { if (isMouseDown) handleCanvasInteraction(e); }}
                onMouseUp={() => setIsMouseDown(false)}
                onMouseLeave={() => setIsMouseDown(false)}
              />
            </div>
            {!result && !generating && !isRemovingBg && (
              <div className={`p2q-empty-pattern ${isDragging ? 'p2q-empty-pattern-dragging' : ''}`}
                onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }}>
                <span>&#10022;</span>
                <h2>Drop a photo here</h2>
                <p>Or click to browse.</p>
                <button className="p2q-primary-action" type="button">
                  <Upload size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Upload Photo
                </button>
              </div>
            )}
            {isRemovingBg && (
              <div className="p2q-empty-pattern p2q-generating-pattern">
                <div style={{ display: 'grid', placeItems: 'center', width: 62, height: 62, borderRadius: 999, background: 'radial-gradient(circle at 35% 30%, var(--color-accent), transparent 45%), var(--color-secondary)' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                </div>
                <h2>Removing Background\u2026</h2>
                <p>{bgProgress}% complete</p>
                <div className="p2q-progress-track" style={{ width: 'min(260px, 86%)', height: 8, marginTop: 12, overflow: 'hidden', borderRadius: 999, background: 'rgba(230,225,220,0.9)' }}>
                  <div className="p2q-progress-bar" style={{ height: '100%', borderRadius: 'inherit', background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-hover))', transition: 'width 0.2s ease', width: `${bgProgress}%` }} />
                </div>
              </div>
            )}
            {generating && (
              <div className="p2q-empty-pattern p2q-generating-pattern">
                <div style={{ display: 'grid', placeItems: 'center', width: 62, height: 62, borderRadius: 999, background: 'radial-gradient(circle at 35% 30%, var(--color-accent), transparent 45%), var(--color-secondary)' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                </div>
                <h2>Generating Pattern\u2026</h2>
                <p>Filtering colors and building blocks</p>
              </div>
            )}
          </div>

          {isDragging && !isRemovingBg && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', background: 'rgba(124, 185, 232, 0.15)', backdropFilter: 'blur(4px)', border: '3px dashed var(--color-primary)', borderRadius: 22 }}>
              <div style={{ textAlign: 'center' }}>
                <Upload size={48} color="var(--color-primary)" strokeWidth={1.5} />
                <p style={{ marginTop: 8, fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary-hover)' }}>Drop your photo</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Right panel: Info + Export tabs */}
      <aside className="p2q-right-panel">
        <div className="p2q-right-tab-bar">
          <button className={`p2q-right-tab-btn ${rightTab === 'info' ? 'p2q-right-tab-active' : ''}`} onClick={() => setRightTab('info')}>
            <Eye size={13} /> Info
          </button>
          <button className={`p2q-right-tab-btn ${rightTab === 'export' ? 'p2q-right-tab-active' : ''}`} onClick={() => setRightTab('export')} disabled={!result}>
            <Printer size={13} /> Export
          </button>
        </div>

        <div className="p2q-right-scroll">
          {/* INFO TAB */}
          {rightTab === 'info' && (
            <>
              <section className="p2q-result-card">
                <h2>Pattern Summary</h2>
                {result ? (
                  <div className="p2q-summary-grid">
                    <div><span>Blocks</span><strong>{result.totalBlocks}</strong></div>
                    <div><span>Pieces</span><strong>{formatNumber(result.totalPieces)}</strong></div>
                    <div><span>Colors</span><strong>{result.palette.length - 1}</strong></div>
                    <div><span>Size</span><strong>{result.finishedWidth.toFixed(0)}\u2033 \u00d7 {result.finishedHeight.toFixed(0)}\u2033</strong></div>
                    <div><span>Solid</span><strong>{result.solidBlocks}</strong></div>
                    <div><span>Pieced</span><strong>{result.piecedBlocks}</strong></div>
                  </div>
                ) : <p className="p2q-muted">Upload a photo to see your pattern details.</p>}
              </section>

              <section className="p2q-result-card">
                <h2>Fabric Colors</h2>
                {result ? (
                  <div className="p2q-palette-editor">
                    {result.palette.filter((_, i) => i < result.palette.length - 1).map((color, i) => {
                      const row = result.cutList[i];
                      return (
                        <label className="p2q-palette-row" key={i}>
                          <input type="color" value={color} onChange={e => updatePaletteColor(i, e.target.value)} />
                          <span>
                            <strong>Color {i + 1}</strong>
                            <small>{color} \u00b7 {formatNumber(row.totalCount)} pcs</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : <p className="p2q-muted">Colors will appear after generating.</p>}
              </section>
            </>
          )}

          {/* EXPORT TAB */}
          {rightTab === 'export' && result && (
            <>
              <section className="p2q-result-card">
                <h2>Fabric Cut List</h2>
                {cutPieceDetails.length > 0 ? (
                  <div className="p2q-cutlist-scroll" style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {cutPieceDetails.filter(d => d.hex !== '#FFFFFF').map((item, idx) => {
                      const thumbW = 40, thumbH = 40;
                      let shapeSvg = `<svg width="${thumbW}" height="${thumbH}" viewBox="0 0 ${thumbW} ${thumbH}" xmlns="http://www.w3.org/2000/svg">`;
                      shapeSvg += `<rect width="${thumbW}" height="${thumbH}" fill="#f5f5f5" rx="3"/>`;
                      if (item.shape === 'square') {
                        const pad = 4;
                        shapeSvg += `<rect x="${pad}" y="${pad}" width="${thumbW - pad * 2}" height="${thumbH - pad * 2}" fill="${item.hex}" rx="2"/>`;
                      } else {
                        const pad = 4;
                        shapeSvg += `<polygon points="${pad},${pad} ${thumbW - pad},${pad} ${pad},${thumbH - pad}" fill="${item.hex}"/>`;
                        shapeSvg += `<polygon points="${thumbW - pad},${pad} ${thumbW - pad},${thumbH - pad} ${pad},${thumbH - pad}" fill="#e0e0e0"/>`;
                        shapeSvg += `<line x1="${thumbW - pad}" y1="${pad}" x2="${pad}" y2="${thumbH - pad}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>`;
                      }
                      shapeSvg += `</svg>`;

                      return (
                        <div
                          key={idx}
                          className="p2q-cutlist-row"
                          onClick={() => setCutPreviewItem(item)}
                          style={{
                            display: 'grid', gridTemplateColumns: '48px 1fr', alignItems: 'start', gap: 10, padding: '10px 10px',
                            borderRadius: 10, cursor: 'pointer', border: '1.5px solid transparent',
                            transition: 'background 0.15s, border-color 0.15s', marginBottom: 4,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124, 185, 232, 0.1)'; e.currentTarget.style.borderColor = '#7cb9e8'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                          <div dangerouslySetInnerHTML={{ __html: shapeSvg }} style={{ borderRadius: 6, overflow: 'hidden' }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <span className="p2q-swatch" style={{ backgroundColor: item.hex, width: 14, height: 14 }} />
                              <strong style={{ fontSize: '0.82rem' }}>{item.hex}</strong>
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', fontWeight: 700 }}>
                                {item.shape === 'square' ? `${item.sizeLabel} Square` : 'Half-Sq Triangle'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', lineHeight: 1.6 }}>
                              <div><strong>{item.count}</strong> pieces</div>
                              <div>Finished: {item.finishedW}\u2033 \u00d7 {item.finishedH}\u2033</div>
                              <div>Cut: {item.cutW}\u2033 \u00d7 {item.cutH}\u2033</div>
                              {item.hypotenuse != null && <div>Hypotenuse: {item.hypotenuse}\u2033</div>}
                              {item.cutFromSquare != null && <div style={{ fontStyle: 'italic' }}>Cut from {item.cutFromSquare}\u2033 square, slice diagonally</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="p2q-muted">No cut list yet.</p>}
              </section>

              <section className="p2q-result-card">
                <h2>Block List</h2>
                <div className="p2q-block-list-scroll" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {result.blocks.filter(b => b.totalPieces > 0).map(block => {
                    const blockCells = result.cells.filter(c => c.blockId === block.blockId);
                    const thumbSize = 36;
                    const thumbCellPx = thumbSize / BLOCK_SIZE;
                    let thumbSvg = `<svg width="${thumbSize}" height="${thumbSize}" viewBox="0 0 ${thumbSize} ${thumbSize}" xmlns="http://www.w3.org/2000/svg">`;
                    thumbSvg += `<rect width="${thumbSize}" height="${thumbSize}" fill="#f5f5f5"/>`;
                    for (const cell of blockCells) {
                      const cx = (cell.x % BLOCK_SIZE) * thumbCellPx;
                      const cy = (cell.y % BLOCK_SIZE) * thumbCellPx;
                      for (const p of cell.pieces) {
                        if (p.isBackground) continue;
                        const fill = result.palette[p.colorIndex];
                        if (p.kind === 'square') {
                          thumbSvg += `<rect x="${cx}" y="${cy}" width="${thumbCellPx * (p.spanW ?? 1)}" height="${thumbCellPx * (p.spanH ?? 1)}" fill="${fill}"/>`;
                        } else if (p.kind === 'triangle-a') {
                          thumbSvg += `<polygon points="${cx},${cy} ${cx + thumbCellPx},${cy} ${cx},${cy + thumbCellPx}" fill="${fill}"/>`;
                        } else if (p.kind === 'triangle-b') {
                          thumbSvg += `<polygon points="${cx + thumbCellPx},${cy} ${cx + thumbCellPx},${cy + thumbCellPx} ${cx},${cy + thumbCellPx}" fill="${fill}"/>`;
                        }
                      }
                    }
                    thumbSvg += `<g fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="0.5">`;
                    for (let i = 1; i < BLOCK_SIZE; i++) {
                      thumbSvg += `<line x1="${i * thumbCellPx}" y1="0" x2="${i * thumbCellPx}" y2="${thumbSize}"/>`;
                      thumbSvg += `<line x1="0" y1="${i * thumbCellPx}" x2="${thumbSize}" y2="${i * thumbCellPx}"/>`;
                    }
                    thumbSvg += `</g></svg>`;

                    const isSelected = selectedBlockId === block.blockId;

                    return (
                      <div
                        key={block.blockId}
                        className={`p2q-block-list-row ${isSelected ? 'p2q-block-list-row-selected' : ''}`}
                        onClick={() => {
                          setSelectedBlockId(block.blockId);
                          setBlockPreviewBlock(block);
                        }}
                        onMouseEnter={() => setSelectedBlockId(block.blockId)}
                        onMouseLeave={() => setSelectedBlockId(null)}
                        style={{
                          display: 'grid', gridTemplateColumns: '42px 1fr auto', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                          background: isSelected ? 'rgba(124, 185, 232, 0.15)' : 'transparent',
                          border: isSelected ? '1.5px solid #7cb9e8' : '1.5px solid transparent',
                          transition: 'background 0.15s, border-color 0.15s', marginBottom: 4,
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: thumbSvg }} style={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>B{block.blockId + 1} <span style={{ fontWeight: 600, color: 'var(--color-text-dim)', fontSize: '0.74rem' }}>&middot; ({block.blockX + 1}, {block.blockY + 1})</span></div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: block.isSolid ? '#E0F2D8' : '#FFF3CD', color: block.isSolid ? '#2F7A4F' : '#8F5735' }}>
                              {block.isSolid ? 'Solid' : 'Pieced'}
                            </span>
                            {block.isSolid ? (
                              <span className="p2q-fabric-cell" style={{ fontSize: '0.72rem' }}>
                                <span className="p2q-swatch" style={{ backgroundColor: result.palette[block.dominantColorIndex], width: 12, height: 12 }} />
                                3&times;3
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>{block.totalPieces} pcs</span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {block.pieces.map((p, pi) => (
                            <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                              <span className="p2q-swatch" style={{ backgroundColor: result.palette[p.colorIndex], width: 8, height: 8, minWidth: 8 }} />
                              {p.count}&times; {p.kind}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Export actions */}
        {rightTab === 'export' && (
          <div className="p2q-right-actions">
            <button type="button" className="p2q-primary-action" disabled={!result}
              onClick={() => { const canvas = canvasRef.current; if (!canvas) return; downloadDataUrl(canvas.toDataURL('image/png'), 'quiltcorgi-pattern.png'); }}>
              Download PNG
            </button>
            <button type="button" className="p2q-ghost-button" disabled={!result}
              onClick={() => { if (result) downloadText(result.svgMarkup, 'quiltcorgi-pattern.svg', 'image/svg+xml'); }}>
              Download SVG
            </button>
            <button type="button" className="p2q-ghost-button" disabled={!result}
              onClick={() => {
                if (!result) return;
                const lines = [
                  'Block,Position,Type,Piece,Color,ColorHex,Count',
                  ...result.blocks.flatMap(block =>
                    block.pieces.map(p =>
                      [`B${block.blockId + 1}`, `${block.blockX + 1},${block.blockY + 1}`, block.isSolid ? 'Solid' : 'Pieced', p.kind, `Color ${p.colorIndex + 1}`, result.palette[p.colorIndex], p.count].join(',')
                    )
                  ),
                ];
                downloadText(lines.join('\n'), 'quiltcorgi-block-list.csv', 'text/csv');
              }}>
              Block List CSV
            </button>
            <button type="button" className="p2q-ghost-button" disabled={!result}
              onClick={() => window.print()}>
              Print
            </button>
          </div>
        )}
      </aside>

      {/* Block Preview Modal */}
      {blockPreviewBlock && result && (
        <div className="p2q-modal-overlay" onClick={() => setBlockPreviewBlock(null)}>
          <div className="p2q-modal-content" onClick={e => e.stopPropagation()}>
            <div className="p2q-modal-header">
              <h3>Block B{blockPreviewBlock.blockId + 1} &mdash; {blockPreviewBlock.isSolid ? 'Solid' : 'Pieced'}</h3>
              <button className="p2q-modal-close" onClick={() => setBlockPreviewBlock(null)}>&#10005;</button>
            </div>
            <div className="p2q-modal-body" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'start' }}>
              {(() => {
                const blockCells = result.cells.filter(c => c.blockId === blockPreviewBlock.blockId);
                const previewSize = 180;
                const previewCellPx = previewSize / BLOCK_SIZE;
                let svg = `<svg width="${previewSize}" height="${previewSize}" viewBox="0 0 ${previewSize} ${previewSize}" xmlns="http://www.w3.org/2000/svg">`;
                svg += `<rect width="${previewSize}" height="${previewSize}" fill="#f8f8f8" rx="4"/>`;
                for (const cell of blockCells) {
                  const cx = (cell.x % BLOCK_SIZE) * previewCellPx;
                  const cy = (cell.y % BLOCK_SIZE) * previewCellPx;
                  for (const p of cell.pieces) {
                    if (p.isBackground) continue;
                    const fill = result.palette[p.colorIndex];
                    if (p.kind === 'square') {
                      const pw = previewCellPx * (p.spanW ?? 1);
                      const ph = previewCellPx * (p.spanH ?? 1);
                      svg += `<rect x="${cx}" y="${cy}" width="${pw}" height="${ph}" fill="${fill}" stroke="${fill}" stroke-width="1"/>`;
                    } else if (p.kind === 'triangle-a') {
                      svg += `<polygon points="${cx},${cy} ${cx + previewCellPx},${cy} ${cx},${cy + previewCellPx}" fill="${fill}" stroke="${fill}" stroke-width="1"/>`;
                    } else if (p.kind === 'triangle-b') {
                      svg += `<polygon points="${cx + previewCellPx},${cy} ${cx + previewCellPx},${cy + previewCellPx} ${cx},${cy + previewCellPx}" fill="${fill}" stroke="${fill}" stroke-width="1"/>`;
                    }
                  }
                }
                svg += `<g fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1">`;
                for (let i = 1; i < BLOCK_SIZE; i++) {
                  svg += `<line x1="${i * previewCellPx}" y1="0" x2="${i * previewCellPx}" y2="${previewSize}"/>`;
                  svg += `<line x1="0" y1="${i * previewCellPx}" x2="${previewSize}" y2="${i * previewCellPx}"/>`;
                }
                svg += `</g>`;
                svg += `<rect width="${previewSize}" height="${previewSize}" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="2" rx="4"/>`;
                svg += `</svg>`;
                return <div dangerouslySetInnerHTML={{ __html: svg }} style={{ borderRadius: 8, overflow: 'hidden', border: '2px solid var(--color-border)' }} />;
              })()}
              <div style={{ minWidth: 0 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontWeight: 700, marginBottom: 4 }}>Position</div>
                  <div style={{ fontWeight: 800 }}>Row {blockPreviewBlock.blockY + 1}, Col {blockPreviewBlock.blockX + 1}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontWeight: 700, marginBottom: 4 }}>Finished Size</div>
                  <div style={{ fontWeight: 800 }}>{(BLOCK_SIZE * result.pieceSizeInches).toFixed(1)}\u2033 \u00d7 {(BLOCK_SIZE * result.pieceSizeInches).toFixed(1)}\u2033</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontWeight: 700, marginBottom: 4 }}>Pieces ({blockPreviewBlock.totalPieces})</div>
                  {blockPreviewBlock.pieces.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, padding: '4px 8px', borderRadius: 6, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <span className="p2q-swatch" style={{ backgroundColor: result.palette[p.colorIndex], width: 18, height: 18 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{p.count}&times; {p.kind}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>{result.palette[p.colorIndex]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cut Piece Preview Modal */}
      {cutPreviewItem && (
        <div className="p2q-modal-overlay" onClick={() => setCutPreviewItem(null)}>
          <div className="p2q-modal-content" onClick={e => e.stopPropagation()}>
            <div className="p2q-modal-header">
              <h3>{cutPreviewItem.shape === 'square' ? `${cutPreviewItem.sizeLabel} Square` : 'Half-Square Triangle'} &mdash; Cutting Detail</h3>
              <button className="p2q-modal-close" onClick={() => setCutPreviewItem(null)}>&#10005;</button>
            </div>
            <div className="p2q-modal-body" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'start' }}>
              {(() => {
                const previewSize = 200;
                const pad = 20;
                const drawSize = previewSize - pad * 2;
                let svg = `<svg width="${previewSize}" height="${previewSize}" viewBox="0 0 ${previewSize} ${previewSize}" xmlns="http://www.w3.org/2000/svg">`;
                svg += `<rect width="${previewSize}" height="${previewSize}" fill="#fafafa" rx="6"/>`;

                if (cutPreviewItem.shape === 'square') {
                  svg += `<rect x="${pad}" y="${pad}" width="${drawSize}" height="${drawSize}" fill="${cutPreviewItem.hex}" rx="2" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>`;
                  svg += `<line x1="${pad}" y1="${pad + drawSize + 10}" x2="${pad + drawSize}" y2="${pad + drawSize + 10}" stroke="#5aa0d5" stroke-width="1.5"/>`;
                  svg += `<text x="${pad + drawSize / 2}" y="${pad + drawSize + 22}" text-anchor="middle" font-size="11" font-weight="700" fill="#5aa0d5">${cutPreviewItem.finishedW}\u2033</text>`;
                  svg += `<line x1="${pad + drawSize + 10}" y1="${pad}" x2="${pad + drawSize + 10}" y2="${pad + drawSize}" stroke="#5aa0d5" stroke-width="1.5"/>`;
                  svg += `<text x="${pad + drawSize + 18}" y="${pad + drawSize / 2 + 4}" font-size="11" font-weight="700" fill="#5aa0d5">${cutPreviewItem.finishedH}\u2033</text>`;
                } else {
                  svg += `<rect x="${pad}" y="${pad}" width="${drawSize}" height="${drawSize}" fill="#e8e8e8" rx="2" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>`;
                  svg += `<polygon points="${pad},${pad} ${pad + drawSize},${pad} ${pad},${pad + drawSize}" fill="${cutPreviewItem.hex}" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/>`;
                  svg += `<line x1="${pad + drawSize}" y1="${pad}" x2="${pad}" y2="${pad + drawSize}" stroke="rgba(0,0,0,0.5)" stroke-width="2" stroke-dasharray="6,3"/>`;
                  svg += `<text x="${pad + drawSize / 2}" y="${pad - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="#5aa0d5">${cutPreviewItem.finishedW}\u2033</text>`;
                  svg += `<text x="${pad - 6}" y="${pad + drawSize / 2 + 4}" text-anchor="end" font-size="11" font-weight="700" fill="#5aa0d5">${cutPreviewItem.finishedH}\u2033</text>`;
                  const midX = pad + drawSize * 0.25;
                  const midY = pad + drawSize * 0.75;
                  svg += `<text x="${midX}" y="${midY}" font-size="10" font-weight="700" fill="#8F5735" transform="rotate(-45, ${midX}, ${midY})">${cutPreviewItem.hypotenuse}\u2033</text>`;
                }

                svg += `</svg>`;
                return <div dangerouslySetInnerHTML={{ __html: svg }} style={{ borderRadius: 8, overflow: 'hidden', border: '2px solid var(--color-border)' }} />;
              })()}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className="p2q-swatch" style={{ backgroundColor: cutPreviewItem.hex, width: 28, height: 28 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{cutPreviewItem.hex}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>Color {cutPreviewItem.colorIndex + 1}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontWeight: 700, marginBottom: 4 }}>Quantity Needed</div>
                  <div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--color-primary-hover)' }}>{cutPreviewItem.count} pieces</div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontWeight: 700, marginBottom: 4 }}>Finished Size (after sewing)</div>
                  <div style={{ fontWeight: 800 }}>{cutPreviewItem.finishedW}\u2033 \u00d7 {cutPreviewItem.finishedH}\u2033</div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontWeight: 700, marginBottom: 4 }}>Cut Size (includes \u00bc\u2033 seam allowance)</div>
                  <div style={{ fontWeight: 800 }}>{cutPreviewItem.cutW}\u2033 \u00d7 {cutPreviewItem.cutH}\u2033</div>
                </div>

                {cutPreviewItem.hypotenuse != null && (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontWeight: 700, marginBottom: 4 }}>Hypotenuse</div>
                      <div style={{ fontWeight: 800 }}>{cutPreviewItem.hypotenuse}\u2033</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 10, background: '#FFF3CD', border: '1px solid #FFE08A' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8F5735', marginBottom: 4 }}>&#9986; Cutting Method</div>
                      <div style={{ fontSize: '0.78rem', color: '#8F5735', lineHeight: 1.5 }}>
                        Cut <strong>{Math.ceil(cutPreviewItem.count / 2)}</strong> square{Math.ceil(cutPreviewItem.count / 2) !== 1 ? 's' : ''} at <strong>{cutPreviewItem.cutFromSquare}\u2033 \u00d7 {cutPreviewItem.cutFromSquare}\u2033</strong>.<br />
                        Draw diagonal line on wrong side. Sew \u00bc\u2033 on each side of line. Cut on diagonal line. Press open.
                      </div>
                    </div>
                  </>
                )}

                {cutPreviewItem.shape === 'square' && (
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: '#E0F2D8', border: '1px solid #A5D6A7' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2F7A4F', marginBottom: 4 }}>&#9986; Cutting Method</div>
                    <div style={{ fontSize: '0.78rem', color: '#2F7A4F', lineHeight: 1.5 }}>
                      Cut <strong>{cutPreviewItem.count}</strong> square{cutPreviewItem.count !== 1 ? 's' : ''} at <strong>{cutPreviewItem.cutW}\u2033 \u00d7 {cutPreviewItem.cutH}\u2033</strong>.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="p2q-modal-overlay" onClick={() => { setShowUploadModal(false); setPendingFile(null); }}>
          <div className="p2q-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="p2q-modal-header">
              <h3>Import Photo</h3>
              <button className="p2q-modal-close" onClick={() => { setShowUploadModal(false); setPendingFile(null); }}>&#10005;</button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text-dim)', marginBottom: 8 }}>Quilt Size</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    { label: 'Throw', w: 30, h: 36 },
                    { label: 'Twin', w: 42, h: 60 },
                    { label: 'Queen', w: 60, h: 72 },
                    { label: 'King', w: 72, h: 84 },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => { setModalWidth(preset.w); setModalHeight(preset.h); }}
                      style={{
                        padding: '8px 6px',
                        borderRadius: 8,
                        border: modalWidth === preset.w && modalHeight === preset.h ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                        background: modalWidth === preset.w && modalHeight === preset.h ? 'rgba(124,185,232,0.1)' : 'var(--color-bg)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-dim)', marginBottom: 4 }}>Width (inches)</label>
                    <input
                      type="number" min={6} max={120} value={modalWidth}
                      onChange={e => setModalWidth(Math.max(6, Math.min(120, Number(e.target.value))))}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-dim)', marginBottom: 4 }}>Height (inches)</label>
                    <input
                      type="number" min={6} max={120} value={modalHeight}
                      onChange={e => setModalHeight(Math.max(6, Math.min(120, Number(e.target.value))))}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)' }}>
                <input
                  type="checkbox"
                  id="modal-remove-bg"
                  checked={modalRemoveBg}
                  onChange={e => setModalRemoveBg(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="modal-remove-bg" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer', flex: 1 }}>
                  Remove background automatically
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="p2q-ghost-button"
                  onClick={() => { setShowUploadModal(false); setPendingFile(null); }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  className="p2q-primary-action"
                  onClick={() => {
                    setQuiltWidthIn(modalWidth);
                    setQuiltHeightIn(modalHeight);
                    processUpload();
                  }}
                  style={{ flex: 1 }}
                >
                  Start Creating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save to Studio Modal */}
      {showSaveModal && (
        <div className="p2q-modal-overlay" onClick={() => !isSaving && setShowSaveModal(false)}>
          <div className="p2q-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="p2q-modal-header">
              <h3>Save to Studio</h3>
              <button className="p2q-modal-close" onClick={() => !isSaving && setShowSaveModal(false)}>&#10005;</button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text-dim)', marginBottom: 8 }}>Project Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="Photo Quilt Design"
                  disabled={isSaving}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 600 }}
                />
              </div>
              {saveError && (
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FFEBEE', border: '1.5px solid #EF9A9A', color: '#C62828', fontSize: '0.78rem', fontWeight: 600 }}>
                  {saveError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="p2q-ghost-button"
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  className="p2q-primary-action"
                  onClick={handleSaveToStudio}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
