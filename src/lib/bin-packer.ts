/**
 * Bin Packing Engine
 * Bottom-left placement algorithm for fitting shapes onto pages.
 *
 * Pure computation — no React or Fabric.js dependency.
 */

export interface BoundingBox {
  width: number;
  height: number;
}

export interface PackedItem {
  /** Index in the original items array */
  itemIndex: number;
  /** Copy index (for quantities > 1) */
  copyIndex: number;
  /** Page number (0-based) */
  page: number;
  /** X position on the page (from left margin) */
  x: number;
  /** Y position on the page (from top margin) */
  y: number;
  /** Width of the item */
  width: number;
  /** Height of the item */
  height: number;
}

export interface PackResult {
  /** All placed items with positions and page assignments */
  items: PackedItem[];
  /** Total pages needed */
  totalPages: number;
}

export interface PaperConfig {
  /** Printable width in inches (after margins) */
  usableWidth: number;
  /** Printable height in inches (after margins) */
  usableHeight: number;
}

/** US Letter: 8.5" x 11" with 0.5" margins → 7.5" x 10" usable */
export const PAPER_LETTER: PaperConfig = {
  usableWidth: 7.5,
  usableHeight: 10,
};

/** A4: 210mm x 297mm with 12.7mm margins → ~7.268" x ~10.693" usable */
export const PAPER_A4: PaperConfig = {
  usableWidth: 7.268,
  usableHeight: 10.693,
};

const ITEM_GAP = 0.125; // 1/8 inch gap between items

interface Shelf {
  y: number;
  height: number;
  xCursor: number;
}

/**
 * Pack items onto pages using a shelf-based bottom-left algorithm.
 * Items are expanded by quantity before packing.
 *
 * @param items - Array of bounding boxes (in inches) with quantities
 * @param paper - Paper configuration (usable area after margins)
 * @param reserveFirstPage - Height to reserve at top of page 1 (for validation square)
 * @returns Pack result with positions and page count
 */
export function packItems(
  items: Array<BoundingBox & { quantity: number; itemIndex: number }>,
  paper: PaperConfig,
  reserveFirstPage = 0
): PackResult {
  // Expand items by quantity
  const expanded: Array<BoundingBox & { itemIndex: number; copyIndex: number }> = [];
  for (const item of items) {
    for (let c = 0; c < item.quantity; c++) {
      expanded.push({
        width: item.width,
        height: item.height,
        itemIndex: item.itemIndex,
        copyIndex: c,
      });
    }
  }

  // Sort by height descending (taller items first for better packing)
  expanded.sort((a, b) => b.height - a.height);

  const result: PackedItem[] = [];
  let currentPage = 0;
  let shelves: Shelf[] = [];
  let pageTopOffset = reserveFirstPage > 0 ? reserveFirstPage + ITEM_GAP : 0;

  function startNewPage() {
    currentPage++;
    shelves = [];
    pageTopOffset = 0;
  }

  for (const item of expanded) {
    // Skip items that can't fit on any page
    if (item.width > paper.usableWidth || item.height > paper.usableHeight) {
      continue;
    }

    let placed = false;

    // Try to fit on an existing shelf
    for (const shelf of shelves) {
      if (
        shelf.xCursor + item.width <= paper.usableWidth + 0.001 &&
        item.height <= shelf.height + 0.001
      ) {
        result.push({
          itemIndex: item.itemIndex,
          copyIndex: item.copyIndex,
          page: currentPage,
          x: shelf.xCursor,
          y: shelf.y,
          width: item.width,
          height: item.height,
        });
        shelf.xCursor += item.width + ITEM_GAP;
        placed = true;
        break;
      }
    }

    if (placed) continue;

    // Try to create a new shelf on this page
    const lastShelfBottom =
      shelves.length > 0
        ? shelves[shelves.length - 1].y + shelves[shelves.length - 1].height + ITEM_GAP
        : pageTopOffset;

    if (lastShelfBottom + item.height <= paper.usableHeight + 0.001) {
      const newShelf: Shelf = {
        y: lastShelfBottom,
        height: item.height,
        xCursor: item.width + ITEM_GAP,
      };
      shelves.push(newShelf);
      result.push({
        itemIndex: item.itemIndex,
        copyIndex: item.copyIndex,
        page: currentPage,
        x: 0,
        y: lastShelfBottom,
        width: item.width,
        height: item.height,
      });
      continue;
    }

    // Need a new page
    startNewPage();

    const freshShelf: Shelf = {
      y: 0,
      height: item.height,
      xCursor: item.width + ITEM_GAP,
    };
    shelves.push(freshShelf);
    result.push({
      itemIndex: item.itemIndex,
      copyIndex: item.copyIndex,
      page: currentPage,
      x: 0,
      y: 0,
      width: item.width,
      height: item.height,
    });
  }

  return {
    items: result,
    totalPages: currentPage + 1,
  };
}

import { boundingBoxWithMinMax, type BBoxWithMinMax } from '@/lib/geometry-utils';

/**
 * Compute the bounding box of a polyline (in inches).
 */
export function polylineBoundingBox(
  points: Array<{ x: number; y: number }>
): BBoxWithMinMax {
  return boundingBoxWithMinMax(points);
}
