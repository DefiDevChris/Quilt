import { describe, it, expect } from 'vitest';
import { hexToRgb, type RGB } from '@/lib/color-math';

describe('hexToRgb', () => {
  it('parses 6-digit hex with hash', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 6-digit hex without hash', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('parses 3-digit hex with hash', () => {
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('expands 3-digit hex correctly', () => {
    expect(hexToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('is case-insensitive', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('parses white', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns black for empty string', () => {
    expect(hexToRgb('')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns black for non-string', () => {
    expect(hexToRgb(null as unknown as string)).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb(undefined as unknown as string)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns black for invalid hex characters', () => {
    expect(hexToRgb('#gg0000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('xyz123')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns black for wrong length', () => {
    expect(hexToRgb('#12')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#12345')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#1234567')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('handles 3-digit hex with invalid characters', () => {
    expect(hexToRgb('#ggg')).toEqual({ r: 0, g: 0, b: 0 });
  });
});
