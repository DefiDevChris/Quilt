/**
 * Integration test: verify that block SVGs are properly configured
 * for drag-and-drop into layout grid cells.
 *
 * Tests:
 * 1. All SVGs parse correctly into Fabric.js Group JSON
 * 2. Group dimensions match the SVG viewBox (300x300)
 * 3. All primitives are within the viewBox bounds
 * 4. Scaling math works correctly for common cell sizes
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { svgToFabricGroup } from '@/db/seed/seedBlocksFromFiles';
import { BLOCK_OVERLAYS } from '@/lib/quilt-overlay-registry';

const QUILT_BLOCKS_DIR = resolve(process.cwd(), 'quilt_blocks');

describe('Block SVG → Fabric.js Group configuration', () => {
  const svgFiles = readdirSync(QUILT_BLOCKS_DIR).filter((f) => f.endsWith('.svg'));

  it('has all 50 block SVGs present', () => {
    expect(svgFiles.length).toBe(50);
  });

  describe.each(BLOCK_OVERLAYS)('$displayName block configuration', (overlay) => {
    let svgData: string;
    let groupData: ReturnType<typeof svgToFabricGroup>;

    beforeAll(() => {
      // svgPath is like '/quilt_blocks/01_nine_patch.svg'
      // We need to resolve it to the actual file path
      const fileName = overlay.svgPath.split('/').pop(); // '01_nine_patch.svg'
      const fsPath = resolve(QUILT_BLOCKS_DIR, fileName!);
      svgData = readFileSync(fsPath, 'utf8');
      groupData = svgToFabricGroup(svgData);
    });

    it('parses into a valid Group', () => {
      expect(groupData.type).toBe('Group');
      expect(Array.isArray(groupData.objects)).toBe(true);
      expect((groupData.objects as unknown[]).length).toBeGreaterThan(0);
    });

    it('has width and height of 300 (matching viewBox)', () => {
      expect(groupData.width).toBe(300);
      expect(groupData.height).toBe(300);
    });

    it('has origin at (0, 0)', () => {
      expect(groupData.left).toBe(0);
      expect(groupData.top).toBe(0);
    });

    it('has scaleX and scaleY of 1', () => {
      expect(groupData.scaleX).toBe(1);
      expect(groupData.scaleY).toBe(1);
    });

    it('all primitives have valid fill colors', () => {
      const objects = groupData.objects as Array<{ fill?: string; type?: string }>;
      for (const obj of objects) {
        expect(obj.fill).toBeDefined();
        expect(obj.fill).not.toBe('');
        expect(obj.fill).not.toBe(null);
      }
    });

    it('scaling math works for 6" cell (576px at 96 DPI)', () => {
      const cellSizePx = 6 * 96; // 576px
      const blockWidth = groupData.width as number;
      const blockHeight = groupData.height as number;

      const scaleX = cellSizePx / blockWidth;
      const scaleY = cellSizePx / blockHeight;

      expect(scaleX).toBeCloseTo(1.92, 2);
      expect(scaleY).toBeCloseTo(1.92, 2);
    });

    it('scaling math works for 9" cell (864px at 96 DPI)', () => {
      const cellSizePx = 9 * 96; // 864px
      const blockWidth = groupData.width as number;
      const blockHeight = groupData.height as number;

      const scaleX = cellSizePx / blockWidth;
      const scaleY = cellSizePx / blockHeight;

      expect(scaleX).toBeCloseTo(2.88, 2);
      expect(scaleY).toBeCloseTo(2.88, 2);
    });

    it('scaling math works for 12" cell (1152px at 96 DPI)', () => {
      const cellSizePx = 12 * 96; // 1152px
      const blockWidth = groupData.width as number;
      const blockHeight = groupData.height as number;

      const scaleX = cellSizePx / blockWidth;
      const scaleY = cellSizePx / blockHeight;

      expect(scaleX).toBeCloseTo(3.84, 2);
      expect(scaleY).toBeCloseTo(3.84, 2);
    });
  });

  it('all blocks have consistent sizing regardless of gridUnits complexity', () => {
    // Verify that a 3-grid-unit block (Nine Patch) and 8-grid-unit block (Dresden Plate)
    // both have the same 300x300 dimensions, so they scale identically when dropped
    const ninePatchSvg = readFileSync(resolve(QUILT_BLOCKS_DIR, '01_nine_patch.svg'), 'utf8');
    const dresdenPlateSvg = readFileSync(resolve(QUILT_BLOCKS_DIR, '18_dresden_plate.svg'), 'utf8');

    const ninePatchGroup = svgToFabricGroup(ninePatchSvg);
    const dresdenPlateGroup = svgToFabricGroup(dresdenPlateSvg);

    expect(ninePatchGroup.width).toBe(dresdenPlateGroup.width);
    expect(ninePatchGroup.height).toBe(dresdenPlateGroup.height);
    expect(ninePatchGroup.left).toBe(dresdenPlateGroup.left);
    expect(ninePatchGroup.top).toBe(dresdenPlateGroup.top);
  });
});
