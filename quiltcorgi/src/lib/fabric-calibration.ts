/**
 * Fabric Scanner Calibration — Pure computation for fabric image scale calibration.
 *
 * Calculates pixels-per-inch (PPI) from user input (manual DPI, ruler reference,
 * or scanner preset) and provides scale factors for accurate fabric rendering.
 */

import { PIXELS_PER_INCH } from '@/lib/constants';

export const MIN_PPI = 72;
export const MAX_PPI = 1200;
export const SCANNER_PRESETS = ['150', '200', '300', '600'] as const;

export type CalibrationMethod = 'manual-dpi' | 'ruler-reference' | 'scanner-preset';
export type ScannerPreset = (typeof SCANNER_PRESETS)[number];

export interface CalibrationInput {
  readonly method: CalibrationMethod;
  readonly manualDpi?: number;
  readonly rulerLengthInches?: number;
  readonly rulerLengthPixels?: number;
  readonly scannerPreset?: ScannerPreset;
}

export interface CalibrationResult {
  readonly ppi: number;
  readonly scaleFactorAt96Dpi: number;
}

/**
 * Compute calibration result from user input.
 * Returns null if input is invalid or calculated PPI is out of range.
 */
export function computeCalibration(input: CalibrationInput): CalibrationResult | null {
  const ppi = calculatePpi(input);
  if (ppi === null || ppi < MIN_PPI || ppi > MAX_PPI) {
    return null;
  }
  return {
    ppi,
    scaleFactorAt96Dpi: ppi / PIXELS_PER_INCH,
  };
}

function calculatePpi(input: CalibrationInput): number | null {
  switch (input.method) {
    case 'manual-dpi': {
      const dpi = input.manualDpi;
      if (dpi === undefined || dpi === null) return null;
      // Reject NaN and Infinity
      if (!Number.isFinite(dpi)) return null;
      return dpi;
    }

    case 'ruler-reference': {
      const inches = input.rulerLengthInches;
      const pixels = input.rulerLengthPixels;
      if (inches == null || pixels == null || inches <= 0 || pixels <= 0) {
        return null;
      }
      return pixels / inches;
    }

    case 'scanner-preset':
      return input.scannerPreset != null ? parseInt(input.scannerPreset, 10) : null;

    default:
      return null;
  }
}

/**
 * Convert a PPI value to a scale factor relative to a target DPI.
 * Default target is PIXELS_PER_INCH (96).
 */
export function ppiToScaleFactor(ppi: number, targetDpi: number = PIXELS_PER_INCH): number {
  return ppi / targetDpi;
}

/**
 * Calculate the fabric pattern fill scale factor for a calibrated image.
 * A 300 PPI scan on a 96 DPI canvas needs to be scaled to 96/300 = 0.32
 * so each pixel represents the correct physical size.
 */
export function applyCalibrationToFabricScale(ppi: number): number {
  return PIXELS_PER_INCH / ppi;
}
