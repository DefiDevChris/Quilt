import { decimalToFraction } from '@/lib/fraction-math';

describe('decimalToFraction', () => {
  it('throws for NaN', () => {
    expect(() => decimalToFraction(NaN)).toThrow('Cannot convert NaN or Infinity to fraction');
  });

  it('throws for Infinity', () => {
    expect(() => decimalToFraction(Infinity)).toThrow('Cannot convert NaN or Infinity to fraction');
  });
});
