/**
 * Batch Print Engine — Extract unique blocks from quilt and pack for printing.
 *
 * Analyzes canvas data to identify unique blocks, counts quantities,
 * and uses bin packing to create efficient multi-page layouts.
 */

import { packItems, type PaperConfig, type PackResult, PAPER_LETTER, PAPER_A4 } from './bin-packer';
import { PIXELS_PER_INCH } from '@/lib/constants';

export interface BlockInstance {
  blockId: string;
  blockName: string;
  width: number; // in inches
  height: number; // in inches
  quantity: number;
  patches: PatchData[];
}

export interface PatchData {
  shape: string; // SVG path or shape type
  fill: string;
  fabricId?: string;
}

export interface CuttingTemplate {
  blockId: string;
  blockName: string;
  width: number; // including seam allowance
  height: number; // including seam allowance
  quantity: number;
  seamAllowance: number;
  patches: TemplatePatches[];
}

export interface TemplatePatches {
  shape: string;
  fill: string;
  fabricId?: string;
  cuttingLines: string[]; // Additional cutting guide lines
}

export interface PackedPage {
  pageNumber: number;
  templates: PackedTemplate[];
  paperConfig: PaperConfig;
}

export interface PackedTemplate {
  template: CuttingTemplate;
  copyIndex: number;
  x: number; // position on page
  y: number;
  width: number;
  height: number;
}

export interface BatchPrintResult {
  pages: PackedPage[];
  totalBlocks: number;
  totalPages: number;
  summary: BlockSummary[];
}

export interface BlockSummary {
  blockName: string;
  quantity: number;
  size: string; // e.g., "6" x 6""
}

/**
 * Fabric.js canvas data structure (simplified for our needs).
 */
export interface FabricJSON {
  objects: FabricObject[];
  width?: number;
  height?: number;
}

export interface FabricObject {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
  fill?: string;
  fabricId?: string;
  blockId?: string;
  blockName?: string;
  [key: string]: unknown;
}

/**
 * Extract all unique blocks from canvas data.
 */
export function extractUniqueBlocks(canvasData: FabricJSON): BlockInstance[] {
  const blockMap = new Map<string, BlockInstance>();

  // Group objects by blockId
  for (const obj of canvasData.objects) {
    if (!obj.blockId || !obj.blockName) continue;

    const blockId = obj.blockId;
    const actualWidth = ((obj.width || 0) * (obj.scaleX || 1)) / PIXELS_PER_INCH;
    const actualHeight = ((obj.height || 0) * (obj.scaleY || 1)) / PIXELS_PER_INCH;

    if (!blockMap.has(blockId)) {
      blockMap.set(blockId, {
        blockId,
        blockName: obj.blockName,
        width: actualWidth,
        height: actualHeight,
        quantity: 0,
        patches: [],
      });
    }

    const block = blockMap.get(blockId)!;
    block.quantity++;

    // Add patch data
    if (
      obj.type === 'path' ||
      obj.type === 'polygon' ||
      obj.type === 'rect' ||
      obj.type === 'circle'
    ) {
      block.patches.push({
        shape: extractShapeData(obj),
        fill: obj.fill || '#000000',
        fabricId: obj.fabricId,
      });
    }
  }

  return Array.from(blockMap.values()).filter((block) => block.quantity > 0);
}

/**
 * Extract shape data from Fabric.js object.
 */
function extractShapeData(obj: FabricObject): string {
  switch (obj.type) {
    case 'path':
      return (obj['path'] as string) || '';
    case 'polygon': {
      const points = (obj['points'] as Array<{ x: number; y: number }>) || [];
      return `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`;
    }
    case 'rect':
      return `M 0 0 L ${obj.width} 0 L ${obj.width} ${obj.height} L 0 ${obj.height} Z`;
    case 'circle': {
      const r = (obj.width || 0) / 2;
      return `M ${r} 0 A ${r} ${r} 0 1 1 ${r} ${2 * r} A ${r} ${r} 0 1 1 ${r} 0 Z`;
    }
    default:
      return '';
  }
}

/**
 * Generate cutting templates with seam allowances.
 */
export function generateCuttingTemplates(
  blocks: BlockInstance[],
  seamAllowance: number = 0.25
): CuttingTemplate[] {
  return blocks.map((block) => ({
    blockId: block.blockId,
    blockName: block.blockName,
    width: block.width + 2 * seamAllowance,
    height: block.height + 2 * seamAllowance,
    quantity: block.quantity,
    seamAllowance,
    patches: block.patches.map((patch) => ({
      ...patch,
      cuttingLines: generateCuttingLines(patch, seamAllowance),
    })),
  }));
}

/**
 * Generate cutting guide lines for a patch.
 */
function generateCuttingLines(patch: PatchData, seamAllowance: number): string[] {
  // Simple implementation - add seam allowance lines
  // In a full implementation, this would analyze the patch shape
  // and generate appropriate cutting guides
  return [`Seam allowance: ${seamAllowance}"`, 'Cut on solid lines', 'Stitch on dashed lines'];
}

/**
 * Pack cutting templates across multiple pages.
 */
export function packBlocksForPrinting(
  blocks: BlockInstance[],
  paperConfig: PaperConfig = PAPER_LETTER,
  seamAllowance: number = 0.25
): PackedPage[] {
  if (blocks.length === 0) {
    return [];
  }

  const templates = generateCuttingTemplates(blocks, seamAllowance);

  // Create items for bin packing
  const items = templates.map((template, index) => ({
    width: template.width,
    height: template.height,
    quantity: template.quantity,
    itemIndex: index,
  }));

  if (items.length === 0) {
    return [];
  }

  // Use bin packer to optimize layout
  const packResult = packItems(items, paperConfig);
  return createPagesFromPackResult(packResult, paperConfig, templates);
}

/**
 * Create pages from pack result.
 */
function createPagesFromPackResult(
  packResult: PackResult,
  paperConfig: PaperConfig,
  templates: CuttingTemplate[]
): PackedPage[] {
  const pageMap = new Map<number, PackedTemplate[]>();

  for (const item of packResult.items) {
    const template = templates[item.itemIndex];
    if (!template) continue;

    const packedTemplate: PackedTemplate = {
      template,
      copyIndex: item.copyIndex,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    };

    if (!pageMap.has(item.page)) {
      pageMap.set(item.page, []);
    }
    pageMap.get(item.page)!.push(packedTemplate);
  }

  const pages: PackedPage[] = [];
  for (let i = 0; i < packResult.totalPages; i++) {
    pages.push({
      pageNumber: i + 1,
      templates: pageMap.get(i) || [],
      paperConfig,
    });
  }

  return pages;
}

/**
 * Generate complete batch print result.
 */
export function generateBatchPrintResult(
  canvasData: FabricJSON,
  paperConfig: PaperConfig = PAPER_LETTER,
  seamAllowance: number = 0.25
): BatchPrintResult {
  const blocks = extractUniqueBlocks(canvasData);
  const pages = packBlocksForPrinting(blocks, paperConfig, seamAllowance) || [];

  const summary: BlockSummary[] = blocks.map((block) => ({
    blockName: block.blockName,
    quantity: block.quantity,
    size: `${block.width.toFixed(1)}" × ${block.height.toFixed(1)}"`,
  }));

  return {
    pages,
    totalBlocks: blocks.reduce((sum, block) => sum + block.quantity, 0),
    totalPages: pages.length,
    summary,
  };
}

/**
 * Calculate total fabric requirements from blocks.
 */
export function calculateFabricRequirements(blocks: BlockInstance[]): Map<string, number> {
  const fabricMap = new Map<string, number>();

  for (const block of blocks) {
    for (const patch of block.patches) {
      const fabricKey = patch.fabricId || patch.fill;
      const currentArea = fabricMap.get(fabricKey) || 0;

      // Rough area calculation (would need more sophisticated calculation in practice)
      const patchArea = block.width * block.height * 0.1; // Assume patch is ~10% of block
      fabricMap.set(fabricKey, currentArea + patchArea * block.quantity);
    }
  }

  return fabricMap;
}

/**
 * Export paper configurations.
 */
export const PAPER_CONFIGS = {
  LETTER: PAPER_LETTER,
  A4: PAPER_A4,
} as const;

export type PaperSize = keyof typeof PAPER_CONFIGS;
