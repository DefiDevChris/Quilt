import { describe, it, expect } from 'vitest';
import { stripBranding, stripLayoutName, stripDesignerName } from '@/lib/layout-branding-strip';

describe('layout-branding-strip', () => {
  describe('stripBranding', () => {
    it('removes "ANDOVER FABRICS" (all caps)', () => {
      const input = 'ANDOVER FABRICS\nCut (4) squares 2.5"';
      const result = stripBranding(input);
      expect(result).not.toContain('ANDOVER FABRICS');
      expect(result).toContain('Cut (4) squares 2.5"');
    });

    it('removes "Andover Fabrics" (mixed case)', () => {
      const input = 'Andover Fabrics\nSew blocks together';
      const result = stripBranding(input);
      expect(result).not.toContain('Andover Fabrics');
      expect(result).toContain('Sew blocks together');
    });

    it('removes "Makower UK" / "MAKOWER"', () => {
      const inputUk = 'Makower UK\nAssemble the quilt top';
      const resultUk = stripBranding(inputUk);
      expect(resultUk).not.toContain('Makower UK');
      expect(resultUk).toContain('Assemble the quilt top');

      const inputPlain = 'MAKOWER\nPress seams open';
      const resultPlain = stripBranding(inputPlain);
      expect(resultPlain).not.toContain('MAKOWER');
      expect(resultPlain).toContain('Press seams open');
    });

    it('removes designer credit lines', () => {
      const input = 'Quilt designed by Jane Doe\nCut (4) squares';
      const result = stripBranding(input);
      expect(result).not.toContain('Quilt designed by Jane Doe');
      expect(result).toContain('Cut (4) squares');
    });

    it('removes phone numbers', () => {
      const input = '(800) 223-5678\nUse 1/4" seam allowance';
      const result = stripBranding(input);
      expect(result).not.toContain('(800) 223-5678');
      expect(result).toContain('Use 1/4" seam allowance');
    });

    it('removes URLs', () => {
      const input = 'www.andoverfabrics.com\nSew border strips';
      const result = stripBranding(input);
      expect(result).not.toContain('www.andoverfabrics.com');
      expect(result).toContain('Sew border strips');
    });

    it('removes "Free Pattern Download" lines', () => {
      const input = 'Free Pattern Download\nBlock A instructions';
      const result = stripBranding(input);
      expect(result).not.toContain('Free Pattern Download');
      expect(result).toContain('Block A instructions');
    });

    it('removes copyright lines', () => {
      const input = '\u00a9 2024 Andover Fabrics\nJoin blocks in rows';
      const result = stripBranding(input);
      expect(result).not.toContain('\u00a9 2024');
      expect(result).toContain('Join blocks in rows');
    });

    it('removes "Page 1 of 5" footers', () => {
      const input = 'Attach border\nPage 1 of 5';
      const result = stripBranding(input);
      expect(result).not.toContain('Page 1 of 5');
      expect(result).toContain('Attach border');
    });

    it('removes date stamps like "9/15/22"', () => {
      const input = 'Cut strips 2" wide\n9/15/22';
      const result = stripBranding(input);
      expect(result).not.toContain('9/15/22');
      expect(result).toContain('Cut strips 2" wide');
    });

    it('collapses double blank lines', () => {
      const input = 'Line 1\n\n\n\nLine 2';
      const result = stripBranding(input);
      expect(result).not.toContain('\n\n\n');
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
    });

    it('preserves quilting terminology like "Cut (4) squares 2\u00bd\\""', () => {
      const input = 'Cut (4) squares 2\u00bd"\nSew half-square triangles\nPress seams open';
      const result = stripBranding(input);
      expect(result).toContain('Cut (4) squares 2\u00bd"');
      expect(result).toContain('Sew half-square triangles');
      expect(result).toContain('Press seams open');
    });

    it('preserves block names like "Rose Block" and "Nine Patch"', () => {
      const input = 'Rose Block\nNine Patch\nLog Cabin';
      const result = stripBranding(input);
      expect(result).toContain('Rose Block');
      expect(result).toContain('Nine Patch');
      expect(result).toContain('Log Cabin');
    });

    it('is idempotent (calling twice equals calling once)', () => {
      const input = [
        'ANDOVER FABRICS',
        'Quilt designed by Jane Doe',
        '(800) 223-5678',
        'www.andoverfabrics.com',
        '\u00a9 2024 Andover Fabrics',
        'Page 1 of 5',
        '9/15/22',
        '',
        'Rose Block',
        'Cut (4) squares 2\u00bd"',
        'Nine Patch',
      ].join('\n');

      const once = stripBranding(input);
      const twice = stripBranding(once);
      expect(twice).toBe(once);
    });
  });

  describe('stripLayoutName', () => {
    it('strips collection attribution via " - " separator', () => {
      expect(stripLayoutName('Winter Jewels Quilt - Sugarberry by Andover Fabrics')).toBe(
        'Winter Jewels Quilt'
      );
    });

    it('strips collection via " - " when no manufacturer follows', () => {
      expect(stripLayoutName('Turn of the Century Quilt - Century Solids')).toBe(
        'Turn of the Century Quilt'
      );
    });

    it('strips collection with year suffix', () => {
      expect(stripLayoutName('Crossover Quilt - Sun Print 2025')).toBe('Crossover Quilt');
    });

    it('returns the name unchanged when no separator is present', () => {
      expect(stripLayoutName('Simple Quilt')).toBe('Simple Quilt');
    });
  });

  describe('stripDesignerName', () => {
    it('removes "Quilt designed by Jane Doe"', () => {
      const input = 'Instructions\nQuilt designed by Jane Doe\nStep 1';
      const result = stripDesignerName(input);
      expect(result).not.toContain('Quilt designed by Jane Doe');
      expect(result).toContain('Instructions');
      expect(result).toContain('Step 1');
    });

    it('removes "Designed by: **Jane Doe**"', () => {
      const input = 'Header\nDesigned by: **Jane Doe**\nCutting list';
      const result = stripDesignerName(input);
      expect(result).not.toContain('Designed by');
      expect(result).not.toContain('Jane Doe');
      expect(result).toContain('Header');
      expect(result).toContain('Cutting list');
    });

    it('preserves non-designer text', () => {
      const input = 'Rose Block\nCut (4) squares 2\u00bd"\nNine Patch';
      const result = stripDesignerName(input);
      expect(result).toContain('Rose Block');
      expect(result).toContain('Cut (4) squares 2\u00bd"');
      expect(result).toContain('Nine Patch');
    });
  });
});
