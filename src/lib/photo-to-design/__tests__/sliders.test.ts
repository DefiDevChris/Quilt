import { describe, it, expect } from 'vitest';
import {
  slidersToProcessParams,
  slidersToProcessParamsSimple,
  defaultProcessParams,
  type SliderValues,
} from '../sliders';

function baseSliders(overrides: Partial<SliderValues> = {}): SliderValues {
  return {
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
    ...overrides,
  };
}

describe('slidersToProcessParams', () => {
  it('maps lighting 0..100 → claheClipLimit 1.0..8.0', () => {
    expect(slidersToProcessParamsSimple(baseSliders({ lighting: 0 })).claheClipLimit).toBe(1);
    expect(slidersToProcessParamsSimple(baseSliders({ lighting: 100 })).claheClipLimit).toBe(8);
  });

  it('always reports claheGridSize = 8', () => {
    expect(slidersToProcessParamsSimple(baseSliders({ lighting: 0 })).claheGridSize).toBe(8);
    expect(slidersToProcessParamsSimple(baseSliders({ lighting: 100 })).claheGridSize).toBe(8);
  });

  it('leaves blur at 0 unless Heavy Prints is on', () => {
    expect(
      slidersToProcessParamsSimple(baseSliders({ heavyPrints: false, smoothing: 100 })).gaussianBlurSize
    ).toBe(0);
    expect(
      slidersToProcessParamsSimple(baseSliders({ heavyPrints: true, smoothing: 20 })).gaussianBlurSize
    ).toBe(5);
    expect(
      slidersToProcessParamsSimple(baseSliders({ heavyPrints: true, smoothing: 80 })).gaussianBlurSize
    ).toBe(7);
  });

  it('always returns an odd bilateralD in the 3..21 range', () => {
    for (let s = 0; s <= 100; s += 10) {
      const d = slidersToProcessParamsSimple(baseSliders({ smoothing: s })).bilateralD;
      expect(d).toBeGreaterThanOrEqual(3);
      expect(d).toBeLessThanOrEqual(21);
      expect(d % 2).toBe(1);
    }
  });

  it('maps smoothing 0..100 → bilateralSigmaColor/Space 20..150 (linear)', () => {
    expect(slidersToProcessParamsSimple(baseSliders({ smoothing: 0 })).bilateralSigmaColor).toBe(
      20
    );
    expect(slidersToProcessParamsSimple(baseSliders({ smoothing: 100 })).bilateralSigmaColor).toBe(
      150
    );
    expect(slidersToProcessParamsSimple(baseSliders({ smoothing: 0 })).bilateralSigmaSpace).toBe(
      20
    );
    expect(slidersToProcessParamsSimple(baseSliders({ smoothing: 100 })).bilateralSigmaSpace).toBe(
      150
    );
  });

  it('treats colors=0 as auto (kColors=0); other values scale to 2..30', () => {
    expect(slidersToProcessParamsSimple(baseSliders({ colors: 0 })).kColors).toBe(0);
    // colors=1 → Math.round(2 + (1/100)*28) = Math.round(2.28) = 2
    expect(slidersToProcessParamsSimple(baseSliders({ colors: 1 })).kColors).toBe(2);
    expect(slidersToProcessParamsSimple(baseSliders({ colors: 100 })).kColors).toBe(30);
  });

  it('scales minPatchArea with totalPixels and the Min Patch Size slider', () => {
    const small = slidersToProcessParams(
      baseSliders({ minPatchSize: 0 }),
      1_000_000,
      1,
      'in'
    ).minPatchArea;
    const large = slidersToProcessParams(
      baseSliders({ minPatchSize: 100 }),
      1_000_000,
      1,
      'in'
    ).minPatchArea;
    expect(small).toBeLessThan(large);
    // 0.0001 × 1M = 100 at minPatchSize=0.
    expect(small).toBe(100);
    // (0.0001 + 0.05) × 1M = 50_100 at minPatchSize=100.
    expect(large).toBe(50_100);
  });

  it('propagates edgeEnhance toggle and inverts edgeSensitivity onto Canny thresholds', () => {
    const off = slidersToProcessParamsSimple(
      baseSliders({ edgeEnhance: false, edgeSensitivity: 50 })
    );
    expect(off.edgeEnhance).toBe(false);

    const high = slidersToProcessParamsSimple(
      baseSliders({ edgeEnhance: true, edgeSensitivity: 100 })
    );
    expect(high.edgeEnhance).toBe(true);
    // high sensitivity → low thresholds (inverted)
    expect(high.cannyLow).toBe(10);
    expect(high.cannyHigh).toBe(30);

    const low = slidersToProcessParamsSimple(
      baseSliders({ edgeEnhance: true, edgeSensitivity: 0 })
    );
    expect(low.cannyLow).toBe(100);
    expect(low.cannyHigh).toBe(230);
  });

  it('enables grid snap above slider=5 and scales tolerance 2..22', () => {
    expect(slidersToProcessParamsSimple(baseSliders({ gridSnap: 0 })).gridSnapEnabled).toBe(false);
    expect(slidersToProcessParamsSimple(baseSliders({ gridSnap: 6 })).gridSnapEnabled).toBe(true);
    expect(slidersToProcessParamsSimple(baseSliders({ gridSnap: 0 })).gridSnapTolerance).toBe(2);
    expect(slidersToProcessParamsSimple(baseSliders({ gridSnap: 100 })).gridSnapTolerance).toBe(22);
  });

  it('forwards pixelsPerUnit and unit verbatim', () => {
    const p = slidersToProcessParams(baseSliders(), 100, 72.5, 'cm');
    expect(p.pixelsPerUnit).toBe(72.5);
    expect(p.unit).toBe('cm');
  });
});

describe('defaultProcessParams', () => {
  it('matches the spec defaults and is Auto-K', () => {
    const p = defaultProcessParams();
    expect(p.kColors).toBe(0);
    expect(p.edgeEnhance).toBe(false);
    expect(p.gridSnapEnabled).toBe(true);
    expect(p.unit).toBe('in');
    expect(p.pixelsPerUnit).toBe(1);
  });
});
