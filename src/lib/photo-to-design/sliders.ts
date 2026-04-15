import type { ProcessParams } from '@/types/photo-to-design';

export interface SliderValues {
  lighting: number;
  smoothing: number;
  heavyPrints: boolean;
  colors: number;
  minPatchSize: number;
  edgeEnhance: boolean;
  edgeSensitivity: number;
  gridSnap: number;
  pixelsPerUnit: number;
  unit: 'in' | 'cm';
}

/**
 * Convert slider values to ProcessParams for the CV pipeline.
 * Matches the spec formula exactly.
 */
export function slidersToProcessParams(
  sliders: SliderValues,
  totalPixels: number,
  pixelsPerUnit: number,
  unit: 'in' | 'cm'
): ProcessParams {
  return {
    claheClipLimit: 1.0 + (sliders.lighting / 100) * 7.0,
    claheGridSize: 8,

    gaussianBlurSize: sliders.heavyPrints ? (sliders.smoothing > 50 ? 7 : 5) : 0,

    bilateralD: (() => {
      const d = Math.round(3 + (sliders.smoothing / 100) * 18);
      return d % 2 === 0 ? d + 1 : d;
    })(),
    bilateralSigmaColor: 20 + (sliders.smoothing / 100) * 130,
    bilateralSigmaSpace: 20 + (sliders.smoothing / 100) * 130,

    kColors: sliders.colors === 0 ? 0 : Math.round(2 + (sliders.colors / 100) * 28),

    minPatchArea: Math.round((0.0001 + (sliders.minPatchSize / 100) * 0.05) * totalPixels),

    edgeEnhance: sliders.edgeEnhance,
    cannyLow: Math.round(10 + (1 - sliders.edgeSensitivity / 100) * 90),
    cannyHigh: Math.round(30 + (1 - sliders.edgeSensitivity / 100) * 200),

    gridSnapEnabled: sliders.gridSnap > 5,
    gridSnapTolerance: Math.round(2 + (sliders.gridSnap / 100) * 20),

    pixelsPerUnit,
    unit,
  };
}

/**
 * Legacy overload: convert slider values to ProcessParams without
 * totalPixels/pixelsPerUnit context. Uses defaults.
 */
export function slidersToProcessParamsSimple(sliders: SliderValues): ProcessParams {
  return slidersToProcessParams(sliders, 1_000_000, 1, 'in');
}

/**
 * Default ProcessParams when no calibration has been done yet.
 */
export function defaultProcessParams(): ProcessParams {
  return slidersToProcessParamsSimple({
    lighting: 30,
    smoothing: 50,
    heavyPrints: false,
    colors: 0,
    minPatchSize: 30,
    edgeEnhance: false,
    edgeSensitivity: 50,
    gridSnap: 50,
    pixelsPerUnit: 1,
    unit: 'in',
  });
}
