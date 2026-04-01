import { computeCalibration } from '@/lib/fabric-calibration';

describe('computeCalibration', () => {
  it('returns null for invalid method', () => {
    const input = { method: 'invalid' as any };
    expect(computeCalibration(input)).toBe(null);
  });

  it('returns null for manual-dpi with NaN', () => {
    expect(computeCalibration({ method: 'manual-dpi', manualDpi: NaN })).toBe(null);
  });

  it('returns null for ruler-reference with zero inches', () => {
    expect(computeCalibration({ method: 'ruler-reference', rulerLengthInches: 0, rulerLengthPixels: 100 })).toBe(null);
  });

  it('returns null for scanner-preset with undefined preset', () => {
    expect(computeCalibration({ method: 'scanner-preset' })).toBe(null);
  });
});
