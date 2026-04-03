import { describe, it, expect } from 'vitest';
import {
  buildProjectFromPattern,
  calculateGridFromLayout,
  buildCanvasObjects,
  buildPrintlistFromPattern,
} from '@/lib/pattern-import-utils';
import type { ParsedPattern, ParsedBlock, ParsedLayout } from '@/lib/pattern-parser-types';
import type { FabricMatch } from '@/lib/pattern-fabric-matcher';
import type { BlockMatchResult } from '@/lib/pattern-block-matcher';
import { PIXELS_PER_INCH, DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';

// ── Test Fixtures ────────────────────────────────────────────────

function createTestPattern(overrides?: Partial<ParsedPattern>): ParsedPattern {
  return {
    id: 'test-pattern-001',
    name: 'Test Quilt - Some Collection by Andover Fabrics',
    description: 'A simple test quilt\nDesigned by Jane Doe\nSew blocks together',
    skillLevel: 'confident-beginner',
    finishedWidth: 60,
    finishedHeight: 80,
    blocks: [
      {
        name: 'Square Block',
        finishedWidth: 10,
        finishedHeight: 10,
        quantity: 24,
        pieces: [
          {
            fabricLabel: 'Fabric A - Background',
            shape: 'square',
            cutWidth: 5.5,
            cutHeight: 5.5,
            quantity: 2,
          },
          {
            fabricLabel: 'Fabric B - Blocks',
            shape: 'hst',
            cutWidth: 3,
            cutHeight: 3,
            quantity: 4,
          },
        ],
      },
    ],
    fabrics: [
      {
        label: 'Fabric A - Background',
        name: 'White Solid',
        role: 'background',
        yardage: 3.5,
      },
      {
        label: 'Fabric B - Blocks',
        name: 'Navy Print',
        role: 'blocks',
        yardage: 2.0,
      },
      {
        label: 'Fabric C - Binding',
        name: 'Charcoal Solid',
        role: 'binding',
        yardage: 0.75,
      },
    ],
    layout: {
      type: 'grid',
      rows: 4,
      cols: 6,
    },
    cuttingDirections: [
      {
        scope: 'per-block',
        blockName: 'Square Block',
        fabricLabel: 'Fabric A - Background',
        instructions: ['Cut (2) 5.5" squares per block'],
      },
    ],
    assemblySteps: ['Sew blocks into rows', 'Join rows together'],
    sourceFilename: 'test-quilt.pdf',
    pageCount: 3,
    isQuilt: true,
    parseConfidence: 0.92,
    ...overrides,
  };
}

function createTestFabricMatches(): FabricMatch[] {
  return [
    {
      patternLabel: 'Fabric A - Background',
      patternName: 'White Solid',
      patternSku: null,
      matchedFabricId: 'fab-001',
      confidence: 0.9,
      colorHex: '#ffffff',
      matchMethod: 'name',
    },
    {
      patternLabel: 'Fabric B - Blocks',
      patternName: 'Navy Print',
      patternSku: null,
      matchedFabricId: 'fab-002',
      confidence: 0.85,
      colorHex: '#000080',
      matchMethod: 'name',
    },
    {
      patternLabel: 'Fabric C - Binding',
      patternName: 'Charcoal Solid',
      patternSku: null,
      matchedFabricId: 'fab-003',
      confidence: 0.7,
      colorHex: '#36454f',
      matchMethod: 'name',
    },
  ];
}

function createTestBlockMatches(): BlockMatchResult[] {
  return [
    {
      patternBlockName: 'Square Block',
      matchedBlockId: null,
      matchedBlockName: null,
      confidence: 0,
      matchMethod: 'none',
      needsCustomBlock: true,
    },
  ];
}

// ── buildProjectFromPattern ──────────────────────────────────────

describe('pattern-import-utils', () => {
  describe('buildProjectFromPattern', () => {
    it('returns correct project name with branding stripped', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      expect(result.name).toBe('Test Quilt');
      expect(result.name).not.toContain('Andover Fabrics');
      expect(result.name).not.toContain('Some Collection');
    });

    it('calculates canvas dimensions as finished size * PIXELS_PER_INCH', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      expect(result.canvasWidth).toBe(60 * PIXELS_PER_INCH);
      expect(result.canvasHeight).toBe(80 * PIXELS_PER_INCH);
    });

    it('sets grid settings with correct rows/cols from layout', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      expect(result.gridSettings.rows).toBe(4);
      expect(result.gridSettings.cols).toBe(6);
    });

    it('enables grid and snap to grid', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      expect(result.gridSettings.enabled).toBe(true);
      expect(result.gridSettings.snapToGrid).toBe(true);
    });

    it('populates printlist items as a non-empty array', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      expect(result.printlistItems.length).toBeGreaterThan(0);
    });

    it('collects custom blocks for unmatched blocks', () => {
      const parsed = createTestPattern();
      const blockMatches = createTestBlockMatches();
      const result = buildProjectFromPattern(parsed, createTestFabricMatches(), blockMatches);

      expect(result.customBlocks.length).toBe(1);
      expect(result.customBlocks[0].name).toBe('Square Block');
      expect(result.customBlocks[0].category).toBe('imported');
      expect(result.customBlocks[0].tags).toContain('imported');
    });

    it('does not collect custom blocks for matched blocks', () => {
      const parsed = createTestPattern();
      const blockMatches: BlockMatchResult[] = [
        {
          patternBlockName: 'Square Block',
          matchedBlockId: 'lib-block-42',
          matchedBlockName: 'Square',
          confidence: 1.0,
          matchMethod: 'exact-name',
          needsCustomBlock: false,
        },
      ];
      const result = buildProjectFromPattern(parsed, createTestFabricMatches(), blockMatches);

      expect(result.customBlocks.length).toBe(0);
    });

    it('passes through the skill level', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      expect(result.skillLevel).toBe('confident-beginner');
    });

    it('strips branding from description', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      expect(result.description).not.toContain('Designed by Jane Doe');
      expect(result.description).toContain('Sew blocks together');
    });
  });

  // ── calculateGridFromLayout ──────────────────────────────────────

  describe('calculateGridFromLayout', () => {
    it('uses explicit rows/cols from layout when provided', () => {
      const layout: ParsedLayout = { type: 'grid', rows: 4, cols: 6 };
      const blocks: ParsedBlock[] = [
        { name: 'Block A', finishedWidth: 10, finishedHeight: 10, quantity: 24, pieces: [] },
      ];

      const grid = calculateGridFromLayout(layout, blocks);

      expect(grid.rows).toBe(4);
      expect(grid.cols).toBe(6);
    });

    it('infers rows/cols from block count when layout has no rows/cols (sqrt heuristic)', () => {
      const layout: ParsedLayout = { type: 'grid' };
      const blocks: ParsedBlock[] = [
        { name: 'Block A', finishedWidth: 10, finishedHeight: 10, quantity: 16, pieces: [] },
      ];

      const grid = calculateGridFromLayout(layout, blocks);

      // sqrt(16) = 4 -> cols = 4, rows = ceil(16/4) = 4
      expect(grid.cols).toBe(4);
      expect(grid.rows).toBe(4);
    });

    it('infers cols when only rows are provided', () => {
      const layout: ParsedLayout = { type: 'grid', rows: 3 };
      const blocks: ParsedBlock[] = [
        { name: 'Block A', finishedWidth: 10, finishedHeight: 10, quantity: 12, pieces: [] },
      ];

      const grid = calculateGridFromLayout(layout, blocks);

      expect(grid.rows).toBe(3);
      expect(grid.cols).toBe(4); // ceil(12/3)
    });

    it('infers rows when only cols are provided', () => {
      const layout: ParsedLayout = { type: 'grid', cols: 5 };
      const blocks: ParsedBlock[] = [
        { name: 'Block A', finishedWidth: 10, finishedHeight: 10, quantity: 20, pieces: [] },
      ];

      const grid = calculateGridFromLayout(layout, blocks);

      expect(grid.cols).toBe(5);
      expect(grid.rows).toBe(4); // ceil(20/5)
    });

    it('calculates grid size in inches from block dimensions', () => {
      const layout: ParsedLayout = { type: 'grid', rows: 2, cols: 2 };
      const blocks: ParsedBlock[] = [
        { name: 'Block A', finishedWidth: 12, finishedHeight: 12, quantity: 4, pieces: [] },
      ];

      const grid = calculateGridFromLayout(layout, blocks);

      // size = (12 + 12) / 2 = 12 inches
      expect(grid.size).toBe(12);
    });

    it('averages width and height for non-square blocks', () => {
      const layout: ParsedLayout = { type: 'grid', rows: 2, cols: 3 };
      const blocks: ParsedBlock[] = [
        { name: 'Rect Block', finishedWidth: 8, finishedHeight: 12, quantity: 6, pieces: [] },
      ];

      const grid = calculateGridFromLayout(layout, blocks);

      // size = (8 + 12) / 2 = 10 inches
      expect(grid.size).toBe(10);
    });

    it('handles single-block layouts', () => {
      const layout: ParsedLayout = { type: 'grid' };
      const blocks: ParsedBlock[] = [
        { name: 'Solo Block', finishedWidth: 20, finishedHeight: 20, quantity: 1, pieces: [] },
      ];

      const grid = calculateGridFromLayout(layout, blocks);

      expect(grid.rows).toBe(1);
      expect(grid.cols).toBe(1);
      expect(grid.size).toBe(20);
    });

    it('handles empty blocks array with fallback 1x1 grid', () => {
      const layout: ParsedLayout = { type: 'grid' };
      const blocks: ParsedBlock[] = [];

      const grid = calculateGridFromLayout(layout, blocks);

      expect(grid.rows).toBe(1);
      expect(grid.cols).toBe(1);
    });

    it('always enables grid and snap', () => {
      const layout: ParsedLayout = { type: 'grid', rows: 2, cols: 3 };
      const blocks: ParsedBlock[] = [
        { name: 'Block A', finishedWidth: 10, finishedHeight: 10, quantity: 6, pieces: [] },
      ];

      const grid = calculateGridFromLayout(layout, blocks);

      expect(grid.enabled).toBe(true);
      expect(grid.snapToGrid).toBe(true);
    });
  });

  // ── buildCanvasObjects ───────────────────────────────────────────

  describe('buildCanvasObjects', () => {
    it('creates one canvas object per block placement (rows * cols)', () => {
      const parsed = createTestPattern();
      const fabricMatches = createTestFabricMatches();
      const blockMatches = createTestBlockMatches();
      const gridSettings = calculateGridFromLayout(parsed.layout, parsed.blocks);

      const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);

      const blockObjects = objects.filter(
        (obj) => (obj.metadata as Record<string, unknown>)?.role === 'block'
      );
      // 4 rows * 6 cols = 24 blocks
      expect(blockObjects.length).toBe(24);
    });

    it('positions objects at correct grid coordinates', () => {
      const parsed = createTestPattern();
      const fabricMatches = createTestFabricMatches();
      const blockMatches = createTestBlockMatches();
      const gridSettings = calculateGridFromLayout(parsed.layout, parsed.blocks);

      const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);

      const blockObjects = objects.filter(
        (obj) => (obj.metadata as Record<string, unknown>)?.role === 'block'
      );

      const blockWidthPx = 10 * PIXELS_PER_INCH;
      const blockHeightPx = 10 * PIXELS_PER_INCH;

      // First block should be at (0, 0) — no border, no sashing
      const firstBlock = blockObjects.find(
        (obj) =>
          (obj.metadata as Record<string, unknown>)?.row === 0 &&
          (obj.metadata as Record<string, unknown>)?.col === 0
      );
      expect(firstBlock).toBeDefined();
      expect(firstBlock!.left).toBe(0);
      expect(firstBlock!.top).toBe(0);

      // Block at (1, 2) should be at col*blockWidthPx, row*blockHeightPx
      const block12 = blockObjects.find(
        (obj) =>
          (obj.metadata as Record<string, unknown>)?.row === 1 &&
          (obj.metadata as Record<string, unknown>)?.col === 2
      );
      expect(block12).toBeDefined();
      expect(block12!.left).toBe(2 * blockWidthPx);
      expect(block12!.top).toBe(1 * blockHeightPx);
    });

    it('assigns fill color from fabric match colorHex', () => {
      const parsed = createTestPattern();
      const fabricMatches = createTestFabricMatches();
      const blockMatches = createTestBlockMatches();
      const gridSettings = calculateGridFromLayout(parsed.layout, parsed.blocks);

      const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);

      const blockObjects = objects.filter(
        (obj) => (obj.metadata as Record<string, unknown>)?.role === 'block'
      );

      // First piece's fabric is "Fabric A - Background" with colorHex '#ffffff'
      for (const block of blockObjects) {
        expect(block.fill).toBe('#ffffff');
      }
    });

    it('adds border rects when layout has borderWidths', () => {
      const parsed = createTestPattern({
        layout: { type: 'grid', rows: 4, cols: 6, borderWidths: [2, 1] },
      });
      const fabricMatches = createTestFabricMatches();
      const blockMatches = createTestBlockMatches();
      const gridSettings = calculateGridFromLayout(parsed.layout, parsed.blocks);

      const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);

      const borderObjects = objects.filter(
        (obj) => (obj.metadata as Record<string, unknown>)?.role === 'border'
      );

      // 2 borders * 4 sides = 8 border rects
      expect(borderObjects.length).toBe(8);
    });

    it('adds sashing strips when layout has sashingWidth > 0', () => {
      const parsed = createTestPattern({
        layout: { type: 'grid', rows: 4, cols: 6, sashingWidth: 1 },
      });
      const fabricMatches = createTestFabricMatches();
      const blockMatches = createTestBlockMatches();
      const gridSettings = calculateGridFromLayout(parsed.layout, parsed.blocks);

      const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);

      const sashingObjects = objects.filter(
        (obj) => (obj.metadata as Record<string, unknown>)?.role === 'sashing'
      );

      expect(sashingObjects.length).toBeGreaterThan(0);
    });

    it('returns empty objects for empty blocks array', () => {
      const parsed = createTestPattern({ blocks: [] });
      const fabricMatches = createTestFabricMatches();
      const blockMatches: BlockMatchResult[] = [];
      const gridSettings = calculateGridFromLayout(parsed.layout, []);

      const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);

      const blockObjects = objects.filter(
        (obj) => (obj.metadata as Record<string, unknown>)?.role === 'block'
      );
      expect(blockObjects.length).toBe(0);
    });
  });

  // ── buildPrintlistFromPattern ────────────────────────────────────

  describe('buildPrintlistFromPattern', () => {
    it('creates printlist items from block pieces', () => {
      const parsed = createTestPattern();
      const fabricMatches = createTestFabricMatches();

      const items = buildPrintlistFromPattern(parsed, fabricMatches);

      expect(items.length).toBeGreaterThan(0);
    });

    it('multiplies piece quantity by block quantity for total', () => {
      const parsed = createTestPattern();
      const fabricMatches = createTestFabricMatches();

      const items = buildPrintlistFromPattern(parsed, fabricMatches);

      // Fabric A: 2 pieces/block * 24 blocks = 48
      const fabricAItem = items.find((item) => item.fabricLabel === 'Fabric A - Background');
      expect(fabricAItem).toBeDefined();
      expect(fabricAItem!.quantity).toBe(2 * 24);

      // Fabric B: 4 pieces/block * 24 blocks = 96
      const fabricBItem = items.find((item) => item.fabricLabel === 'Fabric B - Blocks');
      expect(fabricBItem).toBeDefined();
      expect(fabricBItem!.quantity).toBe(4 * 24);
    });

    it('deduplicates identical cuts (same fabric + shape + dimensions)', () => {
      const parsed = createTestPattern({
        blocks: [
          {
            name: 'Block A',
            finishedWidth: 10,
            finishedHeight: 10,
            quantity: 12,
            pieces: [
              {
                fabricLabel: 'Fabric A - Background',
                shape: 'square',
                cutWidth: 5.5,
                cutHeight: 5.5,
                quantity: 2,
              },
            ],
          },
          {
            name: 'Block B',
            finishedWidth: 10,
            finishedHeight: 10,
            quantity: 12,
            pieces: [
              {
                fabricLabel: 'Fabric A - Background',
                shape: 'square',
                cutWidth: 5.5,
                cutHeight: 5.5,
                quantity: 3,
              },
            ],
          },
        ],
      });
      const fabricMatches = createTestFabricMatches();

      const items = buildPrintlistFromPattern(parsed, fabricMatches);

      // Same fabric + shape + dimensions should be merged
      const matchingItems = items.filter(
        (item) =>
          item.fabricLabel === 'Fabric A - Background' &&
          item.shape === 'square' &&
          item.cutWidth === 5.5 &&
          item.cutHeight === 5.5
      );
      expect(matchingItems.length).toBe(1);
      // Quantity = (2 * 12) + (3 * 12) = 60
      expect(matchingItems[0].quantity).toBe(60);
    });

    it('sets seam allowance to 0.25 inches, enabled, imperial', () => {
      const parsed = createTestPattern();
      const fabricMatches = createTestFabricMatches();

      const items = buildPrintlistFromPattern(parsed, fabricMatches);

      for (const item of items) {
        expect(item.seamAllowance).toBe(DEFAULT_SEAM_ALLOWANCE_INCHES);
        expect(item.seamAllowanceEnabled).toBe(true);
        expect(item.unitSystem).toBe('imperial');
      }
    });

    it('assigns fabric label and color hex to every item', () => {
      const parsed = createTestPattern();
      const fabricMatches = createTestFabricMatches();

      const items = buildPrintlistFromPattern(parsed, fabricMatches);

      for (const item of items) {
        expect(item.fabricLabel).toBeTruthy();
        expect(item.colorHex).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('returns empty printlist for pattern with no blocks', () => {
      const parsed = createTestPattern({ blocks: [] });
      const fabricMatches = createTestFabricMatches();

      const items = buildPrintlistFromPattern(parsed, fabricMatches);

      expect(items.length).toBe(0);
    });

    it('returns empty printlist for blocks with no pieces', () => {
      const parsed = createTestPattern({
        blocks: [
          { name: 'Empty Block', finishedWidth: 10, finishedHeight: 10, quantity: 4, pieces: [] },
        ],
      });
      const fabricMatches = createTestFabricMatches();

      const items = buildPrintlistFromPattern(parsed, fabricMatches);

      expect(items.length).toBe(0);
    });

    it('falls back to grey when fabric has no match', () => {
      const parsed = createTestPattern({
        blocks: [
          {
            name: 'Block X',
            finishedWidth: 10,
            finishedHeight: 10,
            quantity: 1,
            pieces: [
              {
                fabricLabel: 'Unknown Fabric',
                shape: 'square',
                cutWidth: 5,
                cutHeight: 5,
                quantity: 1,
              },
            ],
          },
        ],
      });
      const fabricMatches: FabricMatch[] = [];

      const items = buildPrintlistFromPattern(parsed, fabricMatches);

      expect(items.length).toBe(1);
      expect(items[0].colorHex).toBe('#888888');
    });

    it('generates shapeId and svgData for every item', () => {
      const parsed = createTestPattern();
      const fabricMatches = createTestFabricMatches();

      const items = buildPrintlistFromPattern(parsed, fabricMatches);

      for (const item of items) {
        expect(item.shapeId).toBeTruthy();
        expect(item.shapeId).toMatch(/^imp-/);
        expect(item.svgData).toBeTruthy();
        expect(item.svgData).toContain('<svg');
      }
    });

    it('generates HST-specific SVG for triangle shapes', () => {
      const parsed = createTestPattern();
      const fabricMatches = createTestFabricMatches();

      const items = buildPrintlistFromPattern(parsed, fabricMatches);
      const hstItem = items.find((item) => item.shape === 'hst');

      expect(hstItem).toBeDefined();
      expect(hstItem!.svgData).toContain('<polygon');
    });

    it('generates rect SVG for square shapes', () => {
      const parsed = createTestPattern();
      const fabricMatches = createTestFabricMatches();

      const items = buildPrintlistFromPattern(parsed, fabricMatches);
      const squareItem = items.find((item) => item.shape === 'square');

      expect(squareItem).toBeDefined();
      expect(squareItem!.svgData).toContain('<rect');
    });
  });

  // ── Canvas data format ────────────────────────────────────────────

  describe('canvas data format (Fabric.js 7.2.0 compatibility)', () => {
    it('sets canvas data version to 7.2.0', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      expect(result.canvasData.version).toBe('7.2.0');
    });

    it('includes background property on canvas data', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      expect(result.canvasData.background).toBe('transparent');
    });

    it('uses PascalCase type names on canvas objects', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      for (const obj of result.canvasData.objects) {
        expect(obj.type[0]).toBe(obj.type[0].toUpperCase());
      }
    });

    it('uses angle instead of rotation on canvas objects', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      for (const obj of result.canvasData.objects) {
        expect(obj.angle).toBeDefined();
        expect((obj as unknown as Record<string, unknown>).rotation).toBeUndefined();
      }
    });

    it('includes required Fabric.js properties on every canvas object', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      for (const obj of result.canvasData.objects) {
        expect(obj.scaleX).toBe(1);
        expect(obj.scaleY).toBe(1);
        expect(obj.originX).toBe('left');
        expect(obj.originY).toBe('top');
        expect(obj.flipX).toBe(false);
        expect(obj.flipY).toBe(false);
        expect(obj.opacity).toBe(1);
        expect(obj.visible).toBe(true);
        expect(obj.selectable).toBe(true);
      }
    });

    it('uses size in inches (not pixels) for grid settings', () => {
      const parsed = createTestPattern();
      const result = buildProjectFromPattern(
        parsed,
        createTestFabricMatches(),
        createTestBlockMatches()
      );

      // Block is 10x10 inches, so size should be 10
      expect(result.gridSettings.size).toBe(10);
    });
  });
});
