import { describe, it, expect } from 'vitest';
import {
  computeCalibration,
  ppiToScaleFactor,
  applyCalibrationToFabricScale,
  type CalibrationInput,
} from '@/lib/fabric-calibration';

describe('fabric-calibration', () => {
  describe('computeCalibration', () => {
    describe('manual-dpi method', () => {
      it('returns PPI equal to the manual DPI value', () => {
        const input: CalibrationInput = { method: 'manual-dpi', manualDpi: 300 };
        const result = computeCalibration(input);
        expect(result).not.toBeNull();
        expect(result!.ppi).toBe(300);
      });

      it('computes scale factor relative to 96 DPI', () => {
        const input: CalibrationInput = { method: 'manual-dpi', manualDpi: 300 };
        const result = computeCalibration(input);
        expect(result!.scaleFactorAt96Dpi).toBeCloseTo(300 / 96, 4);
      });

      it('returns null for DPI below minimum (72)', () => {
        const input: CalibrationInput = { method: 'manual-dpi', manualDpi: 50 };
        expect(computeCalibration(input)).toBeNull();
      });

      it('returns null for DPI above maximum (1200)', () => {
        const input: CalibrationInput = { method: 'manual-dpi', manualDpi: 1500 };
        expect(computeCalibration(input)).toBeNull();
      });

      it('accepts minimum DPI boundary (72)', () => {
        const input: CalibrationInput = { method: 'manual-dpi', manualDpi: 72 };
        const result = computeCalibration(input);
        expect(result).not.toBeNull();
        expect(result!.ppi).toBe(72);
      });

      it('accepts maximum DPI boundary (1200)', () => {
        const input: CalibrationInput = { method: 'manual-dpi', manualDpi: 1200 };
        const result = computeCalibration(input);
        expect(result).not.toBeNull();
        expect(result!.ppi).toBe(1200);
      });
    });

    describe('ruler-reference method', () => {
      it('calculates PPI from pixel and inch measurements', () => {
        const input: CalibrationInput = {
          method: 'ruler-reference',
          rulerLengthPixels: 1800,
          rulerLengthInches: 6,
        };
        const result = computeCalibration(input);
        expect(result).not.toBeNull();
        expect(result!.ppi).toBe(300);
      });

      it('handles fractional inch measurements', () => {
        const input: CalibrationInput = {
          method: 'ruler-reference',
          rulerLengthPixels: 450,
          rulerLengthInches: 1.5,
        };
        const result = computeCalibration(input);
        expect(result).not.toBeNull();
        expect(result!.ppi).toBe(300);
      });

      it('returns null when ruler length in inches is zero', () => {
        const input: CalibrationInput = {
          method: 'ruler-reference',
          rulerLengthPixels: 300,
          rulerLengthInches: 0,
        };
        expect(computeCalibration(input)).toBeNull();
      });

      it('returns null when ruler length in inches is negative', () => {
        const input: CalibrationInput = {
          method: 'ruler-reference',
          rulerLengthPixels: 300,
          rulerLengthInches: -2,
        };
        expect(computeCalibration(input)).toBeNull();
      });

      it('returns null when pixel length is zero', () => {
        const input: CalibrationInput = {
          method: 'ruler-reference',
          rulerLengthPixels: 0,
          rulerLengthInches: 6,
        };
        expect(computeCalibration(input)).toBeNull();
      });

      it('returns null when calculated PPI is out of range', () => {
        const input: CalibrationInput = {
          method: 'ruler-reference',
          rulerLengthPixels: 10,
          rulerLengthInches: 6,
        };
        // 10 / 6 ≈ 1.67 PPI — below minimum
        expect(computeCalibration(input)).toBeNull();
      });
    });

    describe('scanner-preset method', () => {
      it('returns 150 PPI for 150 preset', () => {
        const input: CalibrationInput = { method: 'scanner-preset', scannerPreset: '150' };
        const result = computeCalibration(input);
        expect(result).not.toBeNull();
        expect(result!.ppi).toBe(150);
      });

      it('returns 300 PPI for 300 preset', () => {
        const input: CalibrationInput = { method: 'scanner-preset', scannerPreset: '300' };
        const result = computeCalibration(input);
        expect(result!.ppi).toBe(300);
      });

      it('returns 600 PPI for 600 preset', () => {
        const input: CalibrationInput = { method: 'scanner-preset', scannerPreset: '600' };
        const result = computeCalibration(input);
        expect(result!.ppi).toBe(600);
      });

      it('returns correct scale factor for 300 DPI', () => {
        const input: CalibrationInput = { method: 'scanner-preset', scannerPreset: '300' };
        const result = computeCalibration(input);
        expect(result!.scaleFactorAt96Dpi).toBeCloseTo(3.125, 3);
      });
    });
  });

  describe('ppiToScaleFactor', () => {
    it('returns 1.0 for 96 PPI (screen resolution)', () => {
      expect(ppiToScaleFactor(96, 96)).toBe(1.0);
    });

    it('returns correct factor for 300 PPI at 96 target', () => {
      expect(ppiToScaleFactor(300, 96)).toBeCloseTo(3.125, 4);
    });

    it('returns correct factor for 150 PPI at 72 target (PDF)', () => {
      expect(ppiToScaleFactor(150, 72)).toBeCloseTo(150 / 72, 4);
    });

    it('returns correct factor for 600 PPI at 96 target', () => {
      expect(ppiToScaleFactor(600, 96)).toBeCloseTo(6.25, 4);
    });
  });

  describe('applyCalibrationToFabricScale', () => {
    it('returns scale of 1 for 96 PPI fabric on 96 DPI canvas', () => {
      expect(applyCalibrationToFabricScale(96)).toBe(1.0);
    });

    it('scales down high-PPI fabric to match canvas resolution', () => {
      // 300 PPI fabric on 96 DPI canvas: scale = 96/300 = 0.32
      const scale = applyCalibrationToFabricScale(300);
      expect(scale).toBeCloseTo(96 / 300, 4);
    });

    it('scales up low-PPI fabric to match canvas resolution', () => {
      // 72 PPI fabric on 96 DPI canvas: scale = 96/72 = 1.333
      const scale = applyCalibrationToFabricScale(72);
      expect(scale).toBeCloseTo(96 / 72, 4);
    });
  });
});
