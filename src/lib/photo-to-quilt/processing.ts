import {
  RGB,
  averageColors,
  colorDistance,
  kMeansQuantize,
  nearestPaletteIndex,
  rgbToHex,
} from '@/lib/photo-to-quilt/colors';

export type PatternPiece = {
  colorIndex: number;
  kind: 'square' | 'triangle-a' | 'triangle-b';
  spanW?: number;
  spanH?: number;
  isBackground?: boolean;
};

export type PatternCell = {
  x: number;
  y: number;
  pieces: PatternPiece[];
  blockId?: number;
};

export type BlockInfo = {
  blockId: number;
  blockX: number;
  blockY: number;
  isSolid: boolean;
  dominantColorIndex: number;
  pieces: { colorIndex: number; kind: string; count: number }[];
  totalPieces: number;
};

export type CutListRow = {
  colorIndex: number;
  hex: string;
  squareCount: number;
  triangleCount: number;
  totalCount: number;
};

export type PatternResult = {
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
  cells: PatternCell[];
  blocks: BlockInfo[];
  svgMarkup: string;
  backgroundFabric?: string;
};

export const BLOCK_SIZE = 3;
export const TRIANGLE_SPLIT_THRESHOLD = 14;
export const PALETTE_MERGE_THRESHOLD = 45;
export const MAX_WORKING_SIZE = 1100;

export function getCanvasImageData(
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const cvs = document.createElement('canvas');
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context failed');
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

export function sampleBorderColor(imageData: ImageData): RGB {
  const { width, height, data } = imageData;
  const samples: RGB[] = [];
  const add = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  };
  const stepX = Math.max(1, Math.floor(width / 70));
  const stepY = Math.max(1, Math.floor(height / 70));
  for (let x = 0; x < width; x += stepX) {
    add(x, 0);
    add(x, height - 1);
  }
  for (let y = 0; y < height; y += stepY) {
    add(0, y);
    add(width - 1, y);
  }
  return averageColors(samples);
}

function improveMask(
  mask: Uint8Array,
  width: number,
  height: number,
) {
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

function dilateMask(
  mask: Uint8Array,
  w: number,
  h: number,
  passes = 1,
) {
  let cur = new Uint8Array(mask);
  for (let p = 0; p < passes; p++) {
    const nxt = new Uint8Array(cur);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (cur[y * w + x]) continue;
        let found = false;
        for (
          let yy = -1;
          yy <= 1 && !found;
          yy++
        )
          for (
            let xx = -1;
            xx <= 1 && !found;
            xx++
          ) {
            const nx = x + xx,
              ny = y + yy;
            if (
              nx >= 0 &&
              nx < w &&
              ny >= 0 &&
              ny < h &&
              cur[ny * w + nx]
            )
              found = true;
          }
        if (found) nxt[y * w + x] = 1;
      }
    }
    cur = nxt;
  }
  return cur;
}

function erodeMask(
  mask: Uint8Array,
  w: number,
  h: number,
  passes = 1,
) {
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

export function refineAiMask(
  mask: Uint8Array,
  w: number,
  h: number,
) {
  return closeMask(improveMask(mask, w, h), w, h);
}

export function loadHtmlImage(
  url: string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error('Failed to load image'));
    img.src = url;
  });
}

export function createMaskFromAlpha(imageData: ImageData) {
  const { width, height, data } = imageData;
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    mask[i] = data[i * 4 + 3] > 6 ? 1 : 0;
  }
  return mask;
}

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function findSubjectCrop(
  mask: Uint8Array,
  w: number,
  h: number,
): CropBox {
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0,
    count = 0;
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
  if (count === 0)
    return { x: 0, y: 0, width: w, height: h };
  const subW = maxX - minX + 1,
    subH = maxY - minY + 1;
  const padX = Math.round(subW * 0.18),
    padY = Math.round(subH * 0.18);
  return {
    x: Math.max(0, minX - padX),
    y: Math.max(0, minY - padY),
    width:
      Math.min(w, maxX + padX) -
      Math.max(0, minX - padX),
    height:
      Math.min(h, maxY + padY) -
      Math.max(0, minY - padY),
  };
}

function adjustColor(
  col: RGB,
  contrast: number,
  saturation: number,
  brightness: number,
): RGB {
  let { r, g, b } = col;
  const bF = brightness / 100;
  r *= bF;
  g *= bF;
  b *= bF;
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

function consolidatePalette(
  paletteRgb: RGB[],
  threshold: number,
): { palette: RGB[]; mapping: number[] } {
  const n = paletteRgb.length;
  if (n <= 1)
    return {
      palette: paletteRgb,
      mapping: paletteRgb.map((_, i) => i),
    };
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a),
      rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (
        colorDistance(paletteRgb[i], paletteRgb[j]) <
        threshold
      ) {
        union(i, j);
      }
    }
  }
  const rootSet = [...new Set(parent.map(find))];
  const newPalette = rootSet.map((root) => {
    const members = paletteRgb.filter(
      (_, i) => find(i) === root,
    );
    return averageColors(members);
  });
  const mapping = parent.map(
    (p) => rootSet.indexOf(find(p)),
  );
  return { palette: newPalette, mapping };
}

export function posterizeImageData(
  imgData: ImageData,
  mask: Uint8Array,
  contrast: number,
  saturation: number,
  brightness: number,
  colorCount: number,
): { posterized: ImageData; palette: RGB[] } {
  const { width, height, data } = imgData;
  const subjectPixels: RGB[] = [];
  const pixelIndices: number[] = [];
  for (let i = 0; i < width * height; i++) {
    if (!mask[i]) continue;
    const di = i * 4;
    if (data[di + 3] < 10) continue;
    const col: RGB = {
      r: data[di],
      g: data[di + 1],
      b: data[di + 2],
    };
    const adjusted = adjustColor(
      col,
      contrast,
      saturation,
      brightness,
    );
    subjectPixels.push(adjusted);
    pixelIndices.push(i);
  }

  if (subjectPixels.length === 0)
    return { posterized: imgData, palette: [] };

  const MAX_KMEANS_SAMPLES = 8000;
  let kmeansInput: RGB[];
  if (subjectPixels.length > MAX_KMEANS_SAMPLES) {
    const stride = Math.ceil(
      subjectPixels.length / MAX_KMEANS_SAMPLES,
    );
    kmeansInput = [];
    for (let i = 0; i < subjectPixels.length; i += stride) {
      kmeansInput.push(subjectPixels[i]);
    }
  } else {
    kmeansInput = subjectPixels;
  }

  let centroids = kMeansQuantize(kmeansInput, colorCount);
  const { palette: consolidated } = consolidatePalette(
    centroids,
    PALETTE_MERGE_THRESHOLD,
  );
  centroids = consolidated;

  const result = new ImageData(
    new Uint8ClampedArray(data),
    width,
    height,
  );

  for (let p = 0; p < subjectPixels.length; p++) {
    const idx = pixelIndices[p];
    const nearest = nearestPaletteIndex(
      subjectPixels[p],
      centroids,
    );
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
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  palette: RGB[],
): {
  dominant: RGB;
  dominantIdx: number;
  variance: number;
  coverage: number;
} | null {
  const { width, height, data } = imgData;
  const counts = new Map<number, number>();
  let totalValid = 0;
  let totalTested = 0;
  const minX = Math.max(0, Math.floor(startX)),
    maxX = Math.min(width - 1, Math.ceil(endX));
  const minY = Math.max(0, Math.floor(startY)),
    maxY = Math.min(height - 1, Math.ceil(endY));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      totalTested++;
      const pi = y * width + x;
      if (!mask[pi]) continue;
      const di = pi * 4;
      if (data[di + 3] < 10) continue;
      totalValid++;
      const col: RGB = {
        r: data[di],
        g: data[di + 1],
        b: data[di + 2],
      };
      const idx = nearestPaletteIndex(col, palette);
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
  }

  if (totalValid === 0) return null;

  let bestIdx = 0,
    bestCount = 0;
  counts.forEach((cnt, idx) => {
    if (cnt > bestCount) {
      bestCount = cnt;
      bestIdx = idx;
    }
  });

  const dominantColor = palette[bestIdx];
  let variance = 0;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const pi = y * width + x;
      if (!mask[pi]) continue;
      const di = pi * 4;
      if (data[di + 3] < 10) continue;
      const col: RGB = {
        r: data[di],
        g: data[di + 1],
        b: data[di + 2],
      };
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
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  triangle: 'a' | 'b',
  palette: RGB[],
): number | null {
  const { width, height, data } = imgData;
  const counts = new Map<number, number>();
  let totalValid = 0,
    tested = 0;
  const minX = Math.max(0, Math.floor(startX)),
    maxX = Math.min(width - 1, Math.ceil(endX));
  const minY = Math.max(0, Math.floor(startY)),
    maxY = Math.min(height - 1, Math.ceil(endY));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const nx =
        (x - startX) / (endX - startX);
      const ny =
        (y - startY) / (endY - startY);
      if (triangle === 'a' && nx + ny > 1) continue;
      if (triangle === 'b' && nx + ny <= 1) continue;
      tested++;
      const pi = y * width + x;
      if (!mask[pi]) continue;
      const di = pi * 4;
      if (data[di + 3] < 10) continue;
      const col: RGB = {
        r: data[di],
        g: data[di + 1],
        b: data[di + 2],
      };
      const idx = nearestPaletteIndex(col, palette);
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
      totalValid++;
    }
  }
  if (tested === 0 || totalValid / tested < 0.08)
    return null;
  let bestIdx = 0,
    bestCount = 0;
  counts.forEach((cnt, idx) => {
    if (cnt > bestCount) {
      bestCount = cnt;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

export function buildSvg(
  cells: PatternCell[],
  cols: number,
  rows: number,
  blockSize: number,
  blockCols: number,
  blockRows: number,
  palette: string[],
  showGrid: boolean,
) {
  const cellPx = 20;
  const w = cols * cellPx,
    h = rows * cellPx;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fff"/>`;
  for (const cell of cells) {
    const x = cell.x * cellPx,
      y = cell.y * cellPx;
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
      if (y <= h)
        svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`;
    }
    for (let bx = 0; bx <= blockCols; bx++) {
      const x = bx * blockSize * cellPx;
      if (x <= w)
        svg += `<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`;
    }
    svg += `</g>`;
    svg += `<g fill="none" stroke="rgba(54,49,45,0.18)" stroke-width="0.8">`;
    for (const cell of cells) {
      const x = cell.x * cellPx,
        y = cell.y * cellPx;
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

export function normalizeCells(
  cells: PatternCell[],
): PatternCell[] {
  const result: PatternCell[] = [];
  for (const cell of cells) {
    for (const piece of cell.pieces) {
      const w = piece.spanW ?? 1;
      const h = piece.spanH ?? 1;
      if (
        piece.kind !== 'square' ||
        (w === 1 && h === 1)
      ) {
        result.push({
          ...cell,
          pieces: [
            { ...piece, spanW: 1, spanH: 1 },
          ],
        });
        continue;
      }
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          result.push({
            x: cell.x + dx,
            y: cell.y + dy,
            blockId: cell.blockId,
            pieces: [
              {
                colorIndex: piece.colorIndex,
                kind: 'square' as const,
                spanW: 1,
                spanH: 1,
                isBackground: piece.isBackground,
              },
            ],
          });
        }
      }
    }
  }
  return result;
}

function mergeCellTriangles(
  cells: PatternCell[],
): PatternCell[] {
  return cells.map((cell) => {
    if (cell.pieces.length !== 2) return cell;
    const a = cell.pieces.find(
      (p) => p.kind === 'triangle-a',
    );
    const b = cell.pieces.find(
      (p) => p.kind === 'triangle-b',
    );
    if (!a || !b) return cell;
    if (a.isBackground && b.isBackground) {
      return {
        ...cell,
        pieces: [
          {
            colorIndex: a.colorIndex,
            kind: 'square' as const,
            spanW: 1,
            spanH: 1,
            isBackground: true,
          },
        ],
      };
    }
    if (a.isBackground || b.isBackground) return cell;
    if (a.colorIndex === b.colorIndex) {
      return {
        ...cell,
        pieces: [
          {
            colorIndex: a.colorIndex,
            kind: 'square' as const,
            spanW: 1,
            spanH: 1,
          },
        ],
      };
    }
    return cell;
  });
}

function mergeAdjacentSquares(
  cells: PatternCell[],
  cols: number,
  rows: number,
): PatternCell[] {
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
      if (
        !cell ||
        cell.pieces.length !== 1 ||
        cell.pieces[0].kind !== 'square' ||
        cell.pieces[0].isBackground
      ) {
        if (cell) merged.push(cell);
        visited.add(key);
        continue;
      }

      const colorIdx = cell.pieces[0].colorIndex;
      let maxW = 1;
      while (x + maxW < cols) {
        const nextKey = `${x + maxW},${y}`;
        const nextCell = grid.get(nextKey);
        if (
          !nextCell ||
          nextCell.pieces.length !== 1 ||
          nextCell.pieces[0].kind !== 'square' ||
          nextCell.pieces[0].isBackground ||
          nextCell.pieces[0].colorIndex !== colorIdx ||
          visited.has(nextKey)
        ) {
          break;
        }
        maxW++;
      }

      let maxH = 1;
      outer: while (y + maxH < rows) {
        for (let dx = 0; dx < maxW; dx++) {
          const nextKey = `${x + dx},${y + maxH}`;
          const nextCell = grid.get(nextKey);
          if (
            !nextCell ||
            nextCell.pieces.length !== 1 ||
            nextCell.pieces[0].kind !== 'square' ||
            nextCell.pieces[0].isBackground ||
            nextCell.pieces[0].colorIndex !== colorIdx ||
            visited.has(nextKey)
          ) {
            break outer;
          }
        }
        maxH++;
      }

      merged.push({
        x,
        y,
        blockId: cell.blockId,
        pieces: [
          {
            colorIndex: colorIdx,
            kind: 'square',
            spanW: maxW,
            spanH: maxH,
          },
        ],
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
  return (
    cell.pieces.length === 0 ||
    cell.pieces.every((p) => p.isBackground)
  );
}

export function recomputeResult(
  prev: PatternResult,
  newCells: PatternCell[],
): PatternResult {
  let cells = mergeCellTriangles(newCells);
  cells = mergeAdjacentSquares(
    cells,
    prev.cols,
    prev.rows,
  );

  const bCols = prev.cols / prev.blockSize;
  const bRows = prev.rows / prev.blockSize;
  let blockId = 0;
  const blocks: BlockInfo[] = [];

  for (let by = 0; by < bRows; by++) {
    for (let bx = 0; bx < bCols; bx++) {
      const blockCells = cells.filter(
        (c) =>
          c.x >= bx * prev.blockSize &&
          c.x < (bx + 1) * prev.blockSize &&
          c.y >= by * prev.blockSize &&
          c.y < (by + 1) * prev.blockSize,
      );
      const currentBlockId = blockId++;
      for (const c of blockCells) c.blockId = currentBlockId;

      if (blockCells.every(isCellBackground)) {
        blocks.push({
          blockId: currentBlockId,
          blockX: bx,
          blockY: by,
          isSolid: true,
          dominantColorIndex: -1,
          pieces: [],
          totalPieces: 0,
        });
        continue;
      }

      const pieceMap = new Map<
        string,
        {
          colorIndex: number;
          kind: string;
          count: number;
        }
      >();
      for (const c of blockCells) {
        for (const p of c.pieces) {
          if (p.isBackground) continue;
          if (p.kind === 'square') {
            const key = `${p.colorIndex}-sq-${p.spanW ?? 1}x${p.spanH ?? 1}`;
            const existing = pieceMap.get(key);
            if (existing) existing.count++;
            else
              pieceMap.set(key, {
                colorIndex: p.colorIndex,
                kind: `${p.spanW ?? 1}\u00d7${p.spanH ?? 1} square`,
                count: 1,
              });
          } else {
            const key = `${p.colorIndex}-tri`;
            const existing = pieceMap.get(key);
            if (existing) existing.count++;
            else
              pieceMap.set(key, {
                colorIndex: p.colorIndex,
                kind: 'Half-square triangle',
                count: 1,
              });
          }
        }
      }

      const nonBgCells = blockCells.filter(
        (c) => !isCellBackground(c),
      );
      const colorCounts = new Map<number, number>();
      for (const c of nonBgCells) {
        for (const p of c.pieces) {
          if (p.isBackground) continue;
          colorCounts.set(
            p.colorIndex,
            (colorCounts.get(p.colorIndex) ?? 0) + 1,
          );
        }
      }
      let dominantIdx = -1,
        dominantCount = 0;
      colorCounts.forEach((cnt, idx) => {
        if (cnt > dominantCount) {
          dominantCount = cnt;
          dominantIdx = idx;
        }
      });

      const allSameSquare =
        nonBgCells.length === 1 &&
        nonBgCells[0].pieces.length === 1 &&
        nonBgCells[0].pieces[0].kind === 'square' &&
        (nonBgCells[0].pieces[0].spanW ?? 1) ===
          prev.blockSize &&
        (nonBgCells[0].pieces[0].spanH ?? 1) ===
          prev.blockSize;

      blocks.push({
        blockId: currentBlockId,
        blockX: bx,
        blockY: by,
        isSolid: allSameSquare,
        dominantColorIndex: dominantIdx,
        pieces: [...pieceMap.values()],
        totalPieces: [...pieceMap.values()].reduce(
          (s, p) => s + p.count,
          0,
        ),
      });
    }
  }

  const cutCounts = prev.palette.map(() => ({
    sq: 0,
    tri: 0,
  }));
  for (const c of cells) {
    for (const p of c.pieces) {
      if (p.isBackground) continue;
      const row = cutCounts[p.colorIndex];
      if (p.kind === 'square') row.sq++;
      else row.tri++;
    }
  }
  const cutList: CutListRow[] = prev.palette.map(
    (hex, i) => {
      const { sq, tri } = cutCounts[i];
      return {
        colorIndex: i,
        hex,
        squareCount: sq,
        triangleCount: tri,
        totalCount: sq + tri,
      };
    },
  );

  const nonBgBlocks = blocks.filter(
    (b) =>
      !b.pieces.every((p) => p.count === 0) &&
      b.totalPieces > 0,
  );
  const solidBlocks = nonBgBlocks.filter(
    (b) => b.isSolid,
  ).length;
  const totalPieces = cutList.reduce(
    (s, r) => s + r.totalCount,
    0,
  );

  return {
    ...prev,
    cells,
    blocks,
    cutList,
    totalPieces,
    totalBlocks: nonBgBlocks.length,
    solidBlocks,
    piecedBlocks: nonBgBlocks.length - solidBlocks,
    svgMarkup: buildSvg(
      cells,
      prev.cols,
      prev.rows,
      prev.blockSize,
      prev.blockCols,
      prev.blockRows,
      prev.palette,
      true,
    ),
  };
}

export function findClickedPiece(
  cx: number,
  cy: number,
  cellPx: number,
  cell: PatternCell,
): {
  pieceIndex: number;
  newKind?: 'triangle-a' | 'triangle-b';
} | null {
  const relX = cx - cell.x * cellPx;
  const relY = cy - cell.y * cellPx;
  const nx = relX / cellPx;
  const ny = relY / cellPx;

  if (
    cell.pieces.length === 1 &&
    cell.pieces[0].kind === 'square'
  ) {
    return {
      pieceIndex: 0,
      newKind:
        nx + ny <= 1 ? 'triangle-a' : 'triangle-b',
    };
  }

  if (nx + ny <= 1) {
    const idx = cell.pieces.findIndex(
      (p) => p.kind === 'triangle-a',
    );
    return idx >= 0 ? { pieceIndex: idx } : null;
  }
  const idx = cell.pieces.findIndex(
    (p) => p.kind === 'triangle-b',
  );
  return idx >= 0 ? { pieceIndex: idx } : null;
}

export function autoCreateMask(imageData: ImageData) {
  const { width, height, data } = imageData;
  const total = width * height;
  const bg = new Uint8Array(total);
  const visited = new Uint8Array(total);
  const mask = new Uint8Array(total);
  const bgColor = sampleBorderColor(imageData);
  const tolerance = 64;
  const queue: number[] = [];
  const enqueue = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height)
      return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const dIdx = idx * 4;
    const alpha = data[dIdx + 3];
    const col = {
      r: data[dIdx],
      g: data[dIdx + 1],
      b: data[dIdx + 2],
    };
    if (
      alpha < 10 ||
      colorDistance(col, bgColor) <= tolerance
    ) {
      visited[idx] = 1;
      bg[idx] = 1;
      queue.push(idx);
    }
  };
  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }
  while (queue.length) {
    const idx = queue.shift()!;
    const x = idx % width,
      y = Math.floor(idx / width);
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }
  for (let i = 0; i < total; i++) {
    mask[i] = data[i * 4 + 3] > 10 && !bg[i] ? 1 : 0;
  }
  return dilateMask(
    improveMask(mask, width, height),
    width,
    height,
    1,
  );
}

export function generatePatternResult(
  image: HTMLImageElement,
  mask: Uint8Array,
  workingSize: { width: number; height: number },
  pieceSizeInches: number,
  colorCount: number,
  enhance: number,
  showGrid: boolean,
  imageAspect: number | null,
): PatternResult {
  const contrast = 100 + enhance * 0.2;
  const saturation = 100 + enhance * 0.3;
  const brightness = 100 + enhance * 0.08;

  const rawImgData = getCanvasImageData(
    image,
    workingSize.width,
    workingSize.height,
  );
  const crop = findSubjectCrop(
    mask,
    workingSize.width,
    workingSize.height,
  );

  const maxCols = Math.floor(
    workingSize.width / pieceSizeInches,
  );
  const maxRows = Math.floor(
    workingSize.height / pieceSizeInches,
  );
  let rawCols: number;
  let rawRows: number;
  if (imageAspect != null) {
    const maxByWidth = maxCols;
    const maxByHeight = Math.floor(
      maxCols / imageAspect,
    );
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
  const gridCols = Math.max(
    BLOCK_SIZE,
    Math.floor(rawCols / BLOCK_SIZE) * BLOCK_SIZE,
  );
  const gridRows = Math.max(
    BLOCK_SIZE,
    Math.floor(rawRows / BLOCK_SIZE) * BLOCK_SIZE,
  );

  const cellW = crop.width / gridCols;
  const cellH = crop.height / gridRows;

  const { posterized, palette: paletteRgb } =
    posterizeImageData(
      rawImgData,
      mask,
      contrast,
      saturation,
      brightness,
      colorCount,
    );

  if (paletteRgb.length === 0) {
    throw new Error('No subject detail found.');
  }

  let palette = paletteRgb.map(rgbToHex);
  palette = [...palette, '#FFFFFF'];

  const cellIdx: (number | null)[][] = Array.from(
    { length: gridRows },
    () => Array(gridCols).fill(null),
  );
  const cellVariance: number[][] = Array.from(
    { length: gridRows },
    () => Array(gridCols).fill(0),
  );

  for (let y = 0; y < gridRows; y++) {
    for (let x = 0; x < gridCols; x++) {
      const sx = crop.x + x * cellW,
        ex = crop.x + (x + 1) * cellW;
      const sy = crop.y + y * cellH,
        ey = crop.y + (y + 1) * cellH;
      const stat = sampleDominant(
        posterized,
        mask,
        sx,
        ex,
        sy,
        ey,
        paletteRgb,
      );
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
          const idx =
            cellIdx[baseY + dy][baseX + dx];
          if (idx == null) {
            hasNull = true;
            continue;
          }
          if (firstIdx == null) firstIdx = idx;
          else if (idx !== firstIdx) allSame = false;
        }
      }

      if (hasNull) allSame = false;
      const currentBlockId = blockId++;

      if (allSame && firstIdx != null) {
        cells.push({
          x: baseX,
          y: baseY,
          blockId: currentBlockId,
          pieces: [
            {
              colorIndex: firstIdx,
              kind: 'square',
              spanW: BLOCK_SIZE,
              spanH: BLOCK_SIZE,
            },
          ],
        });
        blocks.push({
          blockId: currentBlockId,
          blockX: bx,
          blockY: by,
          isSolid: true,
          dominantColorIndex: firstIdx,
          pieces: [
            {
              colorIndex: firstIdx,
              kind: '3\u00d73 square',
              count: 1,
            },
          ],
          totalPieces: 1,
        });
      } else {
        const pieceMap = new Map<
          string,
          {
            colorIndex: number;
            kind: string;
            count: number;
          }
        >();

        for (let dy = 0; dy < BLOCK_SIZE; dy++) {
          for (let dx = 0; dx < BLOCK_SIZE; dx++) {
            const cy = baseY + dy;
            const cx = baseX + dx;
            const idx = cellIdx[cy][cx];
            if (idx == null) continue;

            const sx = crop.x + cx * cellW,
              ex = crop.x + (cx + 1) * cellW;
            const sy = crop.y + cy * cellH,
              ey = crop.y + (cy + 1) * cellH;

            const triA = sampleTriangleRegion(
              posterized,
              mask,
              sx,
              ex,
              sy,
              ey,
              'a',
              paletteRgb,
            );
            const triB = sampleTriangleRegion(
              posterized,
              mask,
              sx,
              ex,
              sy,
              ey,
              'b',
              paletteRgb,
            );

            let split = false;
            if (triA != null && triB != null) {
              if (
                triA !== triB ||
                cellVariance[cy][cx] > triThreshold
              ) {
                cells.push({
                  x: cx,
                  y: cy,
                  blockId: currentBlockId,
                  pieces: [
                    {
                      colorIndex: triA,
                      kind: 'triangle-a',
                    },
                    {
                      colorIndex: triB,
                      kind: 'triangle-b',
                    },
                  ],
                });

                const keyA = `${triA}-tri`;
                const pA = pieceMap.get(keyA);
                if (pA) pA.count++;
                else
                  pieceMap.set(keyA, {
                    colorIndex: triA,
                    kind: 'Half-square triangle',
                    count: 1,
                  });
                const keyB = `${triB}-tri`;
                const pB = pieceMap.get(keyB);
                if (pB) pB.count++;
                else
                  pieceMap.set(keyB, {
                    colorIndex: triB,
                    kind: 'Half-square triangle',
                    count: 1,
                  });

                split = true;
              }
            }

            if (!split) {
              cells.push({
                x: cx,
                y: cy,
                blockId: currentBlockId,
                pieces: [
                  {
                    colorIndex: idx,
                    kind: 'square',
                    spanW: 1,
                    spanH: 1,
                  },
                ],
              });
              const key = `${idx}-sq`;
              const p = pieceMap.get(key);
              if (p) p.count++;
              else
                pieceMap.set(key, {
                  colorIndex: idx,
                  kind: '1\u00d71 square',
                  count: 1,
                });
            }
          }
        }

        const colorCounts = new Map<number, number>();
        for (let dy = 0; dy < BLOCK_SIZE; dy++) {
          for (let dx = 0; dx < BLOCK_SIZE; dx++) {
            const idx =
              cellIdx[baseY + dy]?.[baseX + dx];
            if (idx != null)
              colorCounts.set(
                idx,
                (colorCounts.get(idx) ?? 0) + 1,
              );
          }
        }
        let dominantIdx = 0,
          dominantCount = 0;
        colorCounts.forEach((cnt, idx) => {
          if (cnt > dominantCount) {
            dominantCount = cnt;
            dominantIdx = idx;
          }
        });

        blocks.push({
          blockId: currentBlockId,
          blockX: bx,
          blockY: by,
          isSolid: false,
          dominantColorIndex: dominantIdx,
          pieces: [...pieceMap.values()],
          totalPieces: [...pieceMap.values()].reduce(
            (s, p) => s + p.count,
            0,
          ),
        });
      }
    }
  }

  const cutCounts = palette.map(() => ({
    sq: 0,
    tri: 0,
  }));
  for (const c of cells) {
    for (const p of c.pieces) {
      const row = cutCounts[p.colorIndex];
      if (p.kind === 'square') row.sq++;
      else row.tri++;
    }
  }
  const cutList: CutListRow[] = palette.map(
    (hex, i) => {
      const { sq, tri } = cutCounts[i];
      return {
        colorIndex: i,
        hex,
        squareCount: sq,
        triangleCount: tri,
        totalCount: sq + tri,
      };
    },
  );
  const totalPieces = cutList.reduce(
    (s, r) => s + r.totalCount,
    0,
  );
  const nonBgBlocks = blocks.filter(
    (b) => b.totalPieces > 0,
  );
  const totalBlocks = nonBgBlocks.length;
  const solidBlocks = nonBgBlocks.filter(
    (b) => b.isSolid,
  ).length;
  const piecedBlocks = totalBlocks - solidBlocks;

  const normalizedCells = normalizeCells(cells);
  const mergedCells =
    mergeCellTriangles(normalizedCells);

  return {
    cols: gridCols,
    rows: gridRows,
    blockSize: BLOCK_SIZE,
    blockCols: bCols,
    blockRows: bRows,
    pieceSizeInches,
    palette,
    cutList,
    totalPieces,
    totalBlocks,
    solidBlocks,
    piecedBlocks,
    cells: mergedCells,
    blocks,
    svgMarkup: buildSvg(
      mergedCells,
      gridCols,
      gridRows,
      BLOCK_SIZE,
      bCols,
      bRows,
      palette,
      showGrid,
    ),
  };
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export function downloadDataUrl(
  dataUrl: string,
  filename: string,
) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadText(
  text: string,
  filename: string,
  mime = 'text/plain',
) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}
