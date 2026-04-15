import type { ProcessParams } from '@/types/photo-to-design';

/**
 * Mapping from ReviewScreen slider values (0–100) to OpenCV ProcessParams.
 *
 * Each slider controls one or more CV parameters. The ranges are chosen
 * to produce visually useful results across typical quilt photographs.
 */

export interface SliderValues {
  lighting: number;       // 0-100 → claheClipLimit 1.0-8.0
  smoothing: number;      // 0-100 → bilateral d 3-21, sigma 20-150
  heavyPrints: boolean;   // → gaussianBlurSize (off or 5)
  colors: number;         // 0-100 → kColors (0=auto, 2-30)
  minPatchSize: number;   // 0-100 → minPatchArea 100-5000 px
  edgeEnhance: boolean;   // → edgeEnhance flag
  edgeSensitivity: number;// 0-100 → cannyLow 10-100, cannyHigh 30-230
  gridSnap: number;       // 0-100 → gridSnapTolerance 2-22 px
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * (t / 100);
}

function clampOdd(value: number): number {
  return value % 2 === 0 ? value + 1 : value;
}

/**
 * Convert slider values to ProcessParams for the worker.
 */
export function slidersToProcessParams(
  sliders: SliderValues,
  pixelsPerUnit: number,
  unit: 'in' | 'cm',
): ProcessParams {
  const claheClipLimit = lerp(1.0, 8.0, sliders.lighting);
  const bilateralD = clampOdd(Math.round(lerp(3, 21, sliders.smoothing)));
  const bilateralSigmaColor = Math.round(lerp(20, 150, sliders.smoothing));
  const bilateralSigmaSpace = Math.round(lerp(20, 150, sliders.smoothing));
  const gaussianBlurSize = sliders.heavyPrints ? 5 : 0;
  const kColors = sliders.colors === 0 ? 0 : Math.round(lerp(2, 30, sliders.colors));
  const minPatchArea = Math.round(lerp(100, 5000, sliders.minPatchSize));
  const cannyLow = Math.round(lerp(10, 100, sliders.edgeSensitivity));
  const cannyHigh = Math.round(lerp(30, 230, sliders.edgeSensitivity));
  const gridSnapTolerance = Math.round(lerp(2, 22, sliders.gridSnap));

  return {
    claheClipLimit,
    claheGridSize: 8,
    gaussianBlurSize,
    bilateralD,
    bilateralSigmaColor,
    bilateralSigmaSpace,
    kColors,
    minPatchArea,
    edgeEnhance: sliders.edgeEnhance,
    cannyLow,
    cannyHigh,
    gridSnapEnabled: sliders.gridSnap > 0,
    gridSnapTolerance,
    pixelsPerUnit,
    unit,
  };
}
