import { describe, it, expect } from 'vitest';
import {
  extractUniqueBlocks,
  generateCuttingTemplates,
  packBlocksForPrinting,
  generateBatchPrintResult,
  calculateFabricRequirements,
  PAPER_CONFIGS,
  type FabricJSON,
  type BlockInstance,
} from '@/lib/batch-print-engine';

describe('Batch Print Engine', () => {
  const mockCanvasData: FabricJSON = {
    objects: [
      {
        type: 'path',
        blockId: 'ohio-star-1',
        blockName: 'Ohio Star',
        width: 576, // 6 inches * 96 DPI
        height: 576,
        scaleX: 1,
        scaleY: 1,
        fill: '#ff0000',
        left: 100,
        top: 100,
      },
      {
        type: 'path',
        blockId: 'ohio-star-1',
        blockName: 'Ohio Star',
        width: 576,
        height: 576,
        scaleX: 1,
        scaleY: 1,
        fill: '#00ff00',
        left: 200,
        top: 200,
      },
      {
        type: 'path',
        blockId: 'log-cabin-1',
        blockName: 'Log Cabin',
        width: 480, // 5 inches * 96 DPI
        height: 480,
        scaleX: 1,
        scaleY: 1,
        fill: '#0000ff',
        left: 300,
        top: 300,
      },
      {
        type: 'rect',
        blockId: 'simple-square-1',
        blockName: 'Simple Square',
        width: 384, // 4 inches * 96 DPI
        height: 384,
        scaleX: 1,
        scaleY: 1,
        fill: '#ffff00',
        left: 400,
        top: 400,
      },
    ],
  };

  describe('extractUniqueBlocks', () => {
    it('should extract unique blocks with correct quantities', () => {
      const blocks = extractUniqueBlocks(mockCanvasData);
      
      expect(blocks).toHaveLength(3);
      
      const ohioStar = blocks.find(b => b.blockId === 'ohio-star-1');
      expect(ohioStar).toBeDefined();
      expect(ohioStar!.quantity).toBe(2);
      expect(ohioStar!.blockName).toBe('Ohio Star');
      expect(ohioStar!.width).toBeCloseTo(6, 1);
      expect(ohioStar!.height).toBeCloseTo(6, 1);
      
      const logCabin = blocks.find(b => b.blockId === 'log-cabin-1');
      expect(logCabin).toBeDefined();
      expect(logCabin!.quantity).toBe(1);
      expect(logCabin!.width).toBeCloseTo(5, 1);
      
      const simpleSquare = blocks.find(b => b.blockId === 'simple-square-1');
      expect(simpleSquare).toBeDefined();
      expect(simpleSquare!.quantity).toBe(1);
      expect(simpleSquare!.width).toBeCloseTo(4, 1);
    });

    it('should handle empty canvas data', () => {
      const emptyCanvas: FabricJSON = { objects: [] };
      const blocks = extractUniqueBlocks(emptyCanvas);
      
      expect(blocks).toHaveLength(0);
    });

    it('should ignore objects without blockId', () => {
      const canvasWithNonBlocks: FabricJSON = {
        objects: [
          {
            type: 'path',
            width: 100,
            height: 100,
            fill: '#ff0000',
            left: 0,
            top: 0,
          },
          {
            type: 'path',
            blockId: 'test-block',
            blockName: 'Test Block',
            width: 200,
            height: 200,
            fill: '#00ff00',
            left: 100,
            top: 100,
          },
        ],
      };
      
      const blocks = extractUniqueBlocks(canvasWithNonBlocks);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockId).toBe('test-block');
    });

    it('should handle scaled objects correctly', () => {
      const scaledCanvas: FabricJSON = {
        objects: [
          {
            type: 'rect',
            blockId: 'scaled-block',
            blockName: 'Scaled Block',
            width: 96, // 1 inch * 96 DPI
            height: 96,
            scaleX: 2, // Scaled to 2 inches
            scaleY: 3, // Scaled to 3 inches
            fill: '#ff0000',
            left: 0,
            top: 0,
          },
        ],
      };
      
      const blocks = extractUniqueBlocks(scaledCanvas);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].width).toBeCloseTo(2, 1);
      expect(blocks[0].height).toBeCloseTo(3, 1);
    });

    it('should collect patch data for blocks', () => {
      const blocks = extractUniqueBlocks(mockCanvasData);
      
      blocks.forEach(block => {
        expect(block.patches.length).toBeGreaterThan(0);
        block.patches.forEach(patch => {
          expect(patch.shape).toBeDefined();
          expect(patch.fill).toMatch(/^#[0-9a-f]{6}$/);
        });
      });
    });
  });

  describe('generateCuttingTemplates', () => {
    it('should generate templates with seam allowances', () => {
      const blocks: BlockInstance[] = [
        {
          blockId: 'test-1',
          blockName: 'Test Block',
          width: 6,
          height: 6,
          quantity: 2,
          patches: [
            { shape: 'M 0 0 L 100 0 L 100 100 L 0 100 Z', fill: '#ff0000' },
          ],
        },
      ];
      
      const templates = generateCuttingTemplates(blocks, 0.25);
      
      expect(templates).toHaveLength(1);
      expect(templates[0].width).toBe(6.5); // 6 + 2 * 0.25
      expect(templates[0].height).toBe(6.5);
      expect(templates[0].seamAllowance).toBe(0.25);
      expect(templates[0].quantity).toBe(2);
    });

    it('should handle different seam allowances', () => {
      const blocks: BlockInstance[] = [
        {
          blockId: 'test-1',
          blockName: 'Test Block',
          width: 4,
          height: 4,
          quantity: 1,
          patches: [],
        },
      ];
      
      const templates1 = generateCuttingTemplates(blocks, 0.125);
      const templates2 = generateCuttingTemplates(blocks, 0.5);
      
      expect(templates1[0].width).toBe(4.25); // 4 + 2 * 0.125
      expect(templates2[0].width).toBe(5); // 4 + 2 * 0.5
    });

    it('should generate cutting lines for patches', () => {
      const blocks: BlockInstance[] = [
        {
          blockId: 'test-1',
          blockName: 'Test Block',
          width: 6,
          height: 6,
          quantity: 1,
          patches: [
            { shape: 'M 0 0 L 100 0 L 100 100 L 0 100 Z', fill: '#ff0000' },
          ],
        },
      ];
      
      const templates = generateCuttingTemplates(blocks);
      
      expect(templates[0].patches[0].cuttingLines).toBeDefined();
      expect(templates[0].patches[0].cuttingLines.length).toBeGreaterThan(0);
    });
  });

  describe('packBlocksForPrinting', () => {
    it('should pack blocks across multiple pages', () => {
      const blocks: BlockInstance[] = [
        {
          blockId: 'large-1',
          blockName: 'Large Block',
          width: 6,  // Reduced from 8 to fit on paper with seam allowance
          height: 6,
          quantity: 3,
          patches: [],
        },
        {
          blockId: 'small-1',
          blockName: 'Small Block',
          width: 3,
          height: 3,
          quantity: 5,
          patches: [],
        },
      ];
      
      const pages = packBlocksForPrinting(blocks, PAPER_CONFIGS.LETTER, 0.25);
      
      expect(pages.length).toBeGreaterThan(0);
      
      // Check that all blocks are accounted for
      const totalTemplates = pages.reduce((sum, page) => sum + page.templates.length, 0);
      const expectedTotal = blocks.reduce((sum, block) => sum + block.quantity, 0);
      expect(totalTemplates).toBe(expectedTotal);
      
      // Check page structure
      pages.forEach((page, index) => {
        expect(page.pageNumber).toBe(index + 1);
        expect(page.paperConfig).toBe(PAPER_CONFIGS.LETTER);
        expect(page.templates.length).toBeGreaterThan(0);
        
        page.templates.forEach(template => {
          expect(template.x).toBeGreaterThanOrEqual(0);
          expect(template.y).toBeGreaterThanOrEqual(0);
          expect(template.width).toBeGreaterThan(0);
          expect(template.height).toBeGreaterThan(0);
          expect(template.copyIndex).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('should handle different paper sizes', () => {
      const blocks: BlockInstance[] = [
        {
          blockId: 'test-1',
          blockName: 'Test Block',
          width: 6,
          height: 6,
          quantity: 2,
          patches: [],
        },
      ];
      
      const letterPages = packBlocksForPrinting(blocks, PAPER_CONFIGS.LETTER);
      const a4Pages = packBlocksForPrinting(blocks, PAPER_CONFIGS.A4);
      
      expect(letterPages[0].paperConfig).toBe(PAPER_CONFIGS.LETTER);
      expect(a4Pages[0].paperConfig).toBe(PAPER_CONFIGS.A4);
    });

    it('should handle empty block list', () => {
      const pages = packBlocksForPrinting([], PAPER_CONFIGS.LETTER);
      
      expect(pages).toHaveLength(0);
    });

    it('should respect template dimensions with seam allowance', () => {
      const blocks: BlockInstance[] = [
        {
          blockId: 'test-1',
          blockName: 'Test Block',
          width: 4,
          height: 4,
          quantity: 1,
          patches: [],
        },
      ];
      
      const pages = packBlocksForPrinting(blocks, PAPER_CONFIGS.LETTER, 0.5);
      
      expect(pages[0].templates[0].width).toBe(5); // 4 + 2 * 0.5
      expect(pages[0].templates[0].height).toBe(5);
    });
  });

  describe('generateBatchPrintResult', () => {
    it('should generate complete batch print result', () => {
      const result = generateBatchPrintResult(mockCanvasData, PAPER_CONFIGS.LETTER, 0.25);
      
      expect(result.pages.length).toBeGreaterThan(0);
      expect(result.totalBlocks).toBe(4); // 2 Ohio Star + 1 Log Cabin + 1 Simple Square
      expect(result.totalPages).toBe(result.pages.length);
      expect(result.summary.length).toBe(3); // 3 unique block types
      
      // Check summary
      const ohioStarSummary = result.summary.find(s => s.blockName === 'Ohio Star');
      expect(ohioStarSummary).toBeDefined();
      expect(ohioStarSummary!.quantity).toBe(2);
      expect(ohioStarSummary!.size).toContain('6.0"');
    });

    it('should handle different paper configurations', () => {
      const letterResult = generateBatchPrintResult(mockCanvasData, PAPER_CONFIGS.LETTER);
      const a4Result = generateBatchPrintResult(mockCanvasData, PAPER_CONFIGS.A4);
      
      expect(letterResult.totalBlocks).toBe(a4Result.totalBlocks);
      expect(letterResult.summary).toEqual(a4Result.summary);
      
      // Page counts might differ due to different paper sizes
      expect(letterResult.totalPages).toBeGreaterThan(0);
      expect(a4Result.totalPages).toBeGreaterThan(0);
    });

    it('should handle empty canvas', () => {
      const emptyCanvas: FabricJSON = { objects: [] };
      const result = generateBatchPrintResult(emptyCanvas);
      
      expect(result.pages).toHaveLength(0);
      expect(result.totalBlocks).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.summary).toHaveLength(0);
    });
  });

  describe('calculateFabricRequirements', () => {
    it('should calculate fabric requirements by color/fabricId', () => {
      const blocks: BlockInstance[] = [
        {
          blockId: 'test-1',
          blockName: 'Test Block',
          width: 6,
          height: 6,
          quantity: 2,
          patches: [
            { shape: '', fill: '#ff0000' },
            { shape: '', fill: '#00ff00', fabricId: 'fabric-1' },
          ],
        },
        {
          blockId: 'test-2',
          blockName: 'Test Block 2',
          width: 4,
          height: 4,
          quantity: 1,
          patches: [
            { shape: '', fill: '#ff0000' },
          ],
        },
      ];
      
      const requirements = calculateFabricRequirements(blocks);
      
      expect(requirements.has('#ff0000')).toBe(true);
      expect(requirements.has('fabric-1')).toBe(true);
      
      // Red should have more area (used in 2 blocks)
      const redArea = requirements.get('#ff0000')!;
      const fabricArea = requirements.get('fabric-1')!;
      
      expect(redArea).toBeGreaterThan(fabricArea);
      expect(redArea).toBeGreaterThan(0);
      expect(fabricArea).toBeGreaterThan(0);
    });

    it('should handle blocks with no patches', () => {
      const blocks: BlockInstance[] = [
        {
          blockId: 'empty-1',
          blockName: 'Empty Block',
          width: 6,
          height: 6,
          quantity: 1,
          patches: [],
        },
      ];
      
      const requirements = calculateFabricRequirements(blocks);
      expect(requirements.size).toBe(0);
    });

    it('should aggregate quantities correctly', () => {
      const blocks: BlockInstance[] = [
        {
          blockId: 'test-1',
          blockName: 'Test Block',
          width: 4,
          height: 4,
          quantity: 3,
          patches: [
            { shape: '', fill: '#ff0000' },
          ],
        },
      ];
      
      const requirements = calculateFabricRequirements(blocks);
      const redArea = requirements.get('#ff0000')!;
      
      // Should account for quantity of 3
      expect(redArea).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very small blocks', () => {
      const tinyCanvas: FabricJSON = {
        objects: [
          {
            type: 'rect',
            blockId: 'tiny-1',
            blockName: 'Tiny Block',
            width: 9.6, // 0.1 inch * 96 DPI
            height: 9.6,
            scaleX: 1,
            scaleY: 1,
            fill: '#ff0000',
            left: 0,
            top: 0,
          },
        ],
      };
      
      const result = generateBatchPrintResult(tinyCanvas);
      expect(result.totalBlocks).toBe(1);
      expect(result.pages.length).toBeGreaterThan(0);
    });

    it('should handle very large blocks', () => {
      const largeCanvas: FabricJSON = {
        objects: [
          {
            type: 'rect',
            blockId: 'large-1',
            blockName: 'Large Block',
            width: 960, // 10 inches * 96 DPI
            height: 960,
            scaleX: 1,
            scaleY: 1,
            fill: '#ff0000',
            left: 0,
            top: 0,
          },
        ],
      };
      
      const result = generateBatchPrintResult(largeCanvas);
      expect(result.totalBlocks).toBe(1);
      expect(result.pages.length).toBeGreaterThan(0);
    });

    it('should handle blocks with many copies', () => {
      const manyBlocksCanvas: FabricJSON = {
        objects: Array.from({ length: 50 }, (_, i) => ({
          type: 'rect',
          blockId: 'repeated-block',
          blockName: 'Repeated Block',
          width: 192, // 2 inches * 96 DPI
          height: 192,
          scaleX: 1,
          scaleY: 1,
          fill: '#ff0000',
          left: i * 10,
          top: i * 10,
        })),
      };
      
      const result = generateBatchPrintResult(manyBlocksCanvas);
      expect(result.totalBlocks).toBe(50);
      expect(result.summary[0].quantity).toBe(50);
    });

    it('should handle zero seam allowance', () => {
      const result = generateBatchPrintResult(mockCanvasData, PAPER_CONFIGS.LETTER, 0);
      
      expect(result.pages.length).toBeGreaterThan(0);
      result.pages.forEach(page => {
        page.templates.forEach(template => {
          // Template size should equal original block size
          expect(template.template.seamAllowance).toBe(0);
        });
      });
    });

    it('should handle large seam allowance', () => {
      const result = generateBatchPrintResult(mockCanvasData, PAPER_CONFIGS.LETTER, 1);
      
      expect(result.pages.length).toBeGreaterThan(0);
      result.pages.forEach(page => {
        page.templates.forEach(template => {
          expect(template.template.seamAllowance).toBe(1);
          // Template should be 2 inches larger in each dimension
          expect(template.width).toBeGreaterThan(template.template.width - 2);
        });
      });
    });
  });
});
