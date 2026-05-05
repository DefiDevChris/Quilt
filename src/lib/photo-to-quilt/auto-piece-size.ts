import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, QUILT_SIZE_PRESETS } from '@/lib/constants/canvas';

const MIN_PIECE_SIZE = 2;
const QUARTER_INCH = 0.25;
const MAX_CANVAS_INCHES = 200;
const FP_EPSILON = 1e-9;

function isNearlyDivisible(value: number, divisor: number): boolean {
  const remainder = value % divisor;
  return Math.abs(remainder) < FP_EPSILON || Math.abs(remainder - divisor) < FP_EPSILON;
}

function evenQuarterInches(size: number): number[] {
  const results: number[] = [];
  let v = MIN_PIECE_SIZE;
  while (v <= size) {
    results.push(v);
    v += QUARTER_INCH;
  }
  return results;
}

export function autoPieceSize(
  quiltWidth: number = DEFAULT_CANVAS_WIDTH,
  quiltHeight: number = DEFAULT_CANVAS_HEIGHT,
): number {
  const candidates = evenQuarterInches(Math.max(quiltWidth, quiltHeight));
  const valid = candidates.filter(
    (ps) => isNearlyDivisible(quiltWidth, ps) && isNearlyDivisible(quiltHeight, ps),
  );
  if (valid.length > 0) return valid[0];
  for (let ps = MIN_PIECE_SIZE; ps <= Math.max(quiltWidth, quiltHeight); ps += QUARTER_INCH) {
    const wCells = Math.floor(quiltWidth / ps);
    const hCells = Math.floor(quiltHeight / ps);
    if (wCells >= 3 && hCells >= 3) return Math.round(ps * 4) / 4;
  }
  return MIN_PIECE_SIZE;
}

export type ValidQuiltSize = {
  width: number;
  height: number;
  pieceSize: number;
  cols: number;
  rows: number;
  blockCols: number;
  blockRows: number;
  label?: string;
};

function isEvenQuarter(n: number): boolean {
  return Math.abs(Math.round(n * 4) - n * 4) < 1e-9;
}

function findPieceSizeForDims(
  quiltWidth: number,
  quiltHeight: number,
): number | null {
  const candidates = evenQuarterInches(Math.min(quiltWidth, quiltHeight));
  for (const ps of candidates) {
    const wDiv = quiltWidth / ps;
    const hDiv = quiltHeight / ps;
    if (
      Math.abs(wDiv - Math.round(wDiv)) < FP_EPSILON &&
      Math.abs(hDiv - Math.round(hDiv)) < FP_EPSILON &&
      isNearlyDivisible(Math.round(wDiv), 3) &&
      isNearlyDivisible(Math.round(hDiv), 3)
    ) {
      return ps;
    }
  }
  return null;
}

export function validQuiltSizes(imageAspect: number): ValidQuiltSize[] {
  const results: ValidQuiltSize[] = [];
  const seen = new Set<string>();

  const tryAdd = (
    width: number,
    height: number,
    label?: string,
  ) => {
    if (width > MAX_CANVAS_INCHES || height > MAX_CANVAS_INCHES) return;
    if (!isEvenQuarter(width) || !isEvenQuarter(height)) return;
    const ps = findPieceSizeForDims(width, height);
    if (ps === null) return;
    const key = `${width}x${height}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({
      width,
      height,
      pieceSize: ps,
      cols: width / ps,
      rows: height / ps,
      blockCols: (width / ps) / 3,
      blockRows: (height / ps) / 3,
      label,
    });
  };

  for (const preset of QUILT_SIZE_PRESETS) {
    tryAdd(preset.width, preset.height, preset.label);
    if (imageAspect > 0) {
      const presetAspect = preset.width / preset.height;
      if (Math.abs(presetAspect - imageAspect) > 0.05) {
        if (presetAspect > imageAspect) {
          const adjW = Math.round(preset.height * imageAspect * 4) / 4;
          tryAdd(adjW, preset.height, `${preset.label} (adj)`);
        } else {
          const adjH = Math.round(preset.width / imageAspect * 4) / 4;
          tryAdd(preset.width, adjH, `${preset.label} (adj)`);
        }
      }
    }
  }

  for (let ps = MIN_PIECE_SIZE; ps <= 6; ps += QUARTER_INCH) {
    const psR = Math.round(ps * 4) / 4;
    for (const blockCount of [3, 4, 5, 6, 8, 10, 12]) {
      const width = blockCount * 3 * psR;
      const height = Math.round((width / imageAspect) * 4) / 4;
      if (height > MAX_CANVAS_INCHES || height < MIN_PIECE_SIZE * 3) continue;
      tryAdd(width, height);
    }
  }

  results.sort((a, b) => a.width * a.height - b.width * b.height);
  return results;
}

export function sliderValueToPieceSize(slider: number): number {
  const sizes = evenQuarterInches(6);
  const idx = Math.min(Math.max(0, slider), sizes.length - 1);
  return sizes[idx];
}

export function pieceSizeToSliderValue(ps: number): number {
  const sizes = evenQuarterInches(6);
  let closest = 0;
  let minDist = Infinity;
  for (let i = 0; i < sizes.length; i++) {
    const dist = Math.abs(sizes[i] - ps);
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  }
  return closest;
}

export const PIECE_SIZE_SLIDER_MAX = evenQuarterInches(6).length - 1;
