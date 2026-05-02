import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '@/lib/constants/canvas';

const MIN_PIECE_SIZE = 2;
const QUARTER_INCH = 0.25;

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
    (ps) => quiltWidth % ps === 0 && quiltHeight % ps === 0,
  );
  if (valid.length > 0) return valid[0];
  for (let ps = MIN_PIECE_SIZE; ps <= Math.max(quiltWidth, quiltHeight); ps += QUARTER_INCH) {
    const wCells = Math.floor(quiltWidth / ps);
    const hCells = Math.floor(quiltHeight / ps);
    if (wCells >= 3 && hCells >= 3) return Math.round(ps * 4) / 4;
  }
  return MIN_PIECE_SIZE;
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
