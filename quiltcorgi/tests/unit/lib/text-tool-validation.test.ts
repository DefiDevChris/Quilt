import { describe, it, expect } from 'vitest';
import { validateTextConfig, clampFontSize, TEXT_FONT_OPTIONS } from '@/lib/text-tool-utils';

describe('text-tool-utils', () => {
  describe('TEXT_FONT_OPTIONS', () => {
    it('contains at least 5 font families', () => {
      expect(TEXT_FONT_OPTIONS.length).toBeGreaterThanOrEqual(5);
    });

    it('includes Manrope as first option', () => {
      expect(TEXT_FONT_OPTIONS[0]).toBe('Manrope');
    });
  });

  describe('clampFontSize', () => {
    it('returns value unchanged if within range', () => {
      expect(clampFontSize(24)).toBe(24);
    });

    it('clamps below minimum to 6', () => {
      expect(clampFontSize(2)).toBe(6);
    });

    it('clamps above maximum to 200', () => {
      expect(clampFontSize(300)).toBe(200);
    });

    it('clamps negative to 6', () => {
      expect(clampFontSize(-10)).toBe(6);
    });
  });

  describe('validateTextConfig', () => {
    const validConfig = {
      text: 'Made by Jane, 2026',
      fontFamily: 'Manrope',
      fontSize: 24,
      fill: '#383831',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
    } as Record<string, unknown>;

    it('accepts valid config', () => {
      const result = validateTextConfig(validConfig);
      expect(result).toEqual(validConfig);
    });

    it('applies defaults for missing optional fields', () => {
      const result = validateTextConfig({ text: 'Hello' } as Record<string, unknown>);
      expect(result.fontFamily).toBe('Manrope');
      expect(result.fontSize).toBe(24);
      expect(result.fill).toBe('#383831');
      expect(result.fontWeight).toBe('normal');
      expect(result.fontStyle).toBe('normal');
      expect(result.textAlign).toBe('left');
    });

    it('rejects empty text', () => {
      expect(() => validateTextConfig({ text: '' } as Record<string, unknown>)).toThrow();
    });

    it('rejects text over 500 characters', () => {
      expect(() =>
        validateTextConfig({ text: 'a'.repeat(501) } as Record<string, unknown>)
      ).toThrow();
    });

    it('accepts text at max 500 characters', () => {
      const result = validateTextConfig({ text: 'a'.repeat(500) } as Record<string, unknown>);
      expect(result.text).toHaveLength(500);
    });

    it('clamps font size in validation', () => {
      const result = validateTextConfig({ text: 'Hi', fontSize: 3 } as Record<string, unknown>);
      expect(result.fontSize).toBe(6);
    });

    it('accepts bold fontWeight', () => {
      const result = validateTextConfig({ ...validConfig, fontWeight: 'bold' } as Record<
        string,
        unknown
      >);
      expect(result.fontWeight).toBe('bold');
    });

    it('accepts italic fontStyle', () => {
      const result = validateTextConfig({ ...validConfig, fontStyle: 'italic' } as Record<
        string,
        unknown
      >);
      expect(result.fontStyle).toBe('italic');
    });

    it('accepts center and right alignment', () => {
      expect(
        validateTextConfig({ ...validConfig, textAlign: 'center' } as Record<string, unknown>)
          .textAlign
      ).toBe('center');
      expect(
        validateTextConfig({ ...validConfig, textAlign: 'right' } as Record<string, unknown>)
          .textAlign
      ).toBe('right');
    });
  });
});
