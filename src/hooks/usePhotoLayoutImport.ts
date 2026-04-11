'use client';

import { useEffect, useRef } from 'react';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { saveProject } from '@/lib/save-project';
import { PIXELS_PER_INCH, PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT } from '@/lib/constants';
import type { GridCell } from '@/lib/photo-layout-types';

/** Default stroke for the imported patch outlines. */
const PATCH_STROKE_COLOR = '#1a1a1a';
const PATCH_STROKE_WIDTH = 1.5;

/**
 * Generate an outline-only SVG for one grid cell, used by the print list
 * preview. Because every cell is either a square/rectangle or a right
 * triangle the SVG never needs cleanup.
 */
function cellToSvg(cell: GridCell): string {
  const pts = cell.polygonInches;
  if (pts.length < 3) return '';

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const pad = 0.1;
  const vx = minX - pad;
  const vy = minY - pad;
  const vw = maxX - minX + pad * 2;
  const vh = maxY - minY + pad * 2;

  const points = pts.map((p) => `${p.x},${p.y}`).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid meet"><polygon points="${points}" fill="none" stroke="currentColor" stroke-width="0.5"/></svg>`;
}

/**
 * Classify a cell for the print-list grouping key.
 * Squares and rectangles share a signature (w×h); triangles get a
 * separate signature that includes the orientation.
 */
function cellSignature(cell: GridCell): { key: string; label: string } {
  const xs = cell.polygonInches.map((p) => p.x);
  const ys = cell.polygonInches.map((p) => p.y);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const wStr = w.toFixed(2);
  const hStr = h.toFixed(2);

  if (cell.polygonInches.length === 4) {
    return { key: `sq-${wStr}x${hStr}`, label: `${wStr}" × ${hStr}" Square` };
  }
  if (cell.polygonInches.length === 3) {
    return { key: `tri-${wStr}x${hStr}`, label: `${wStr}" × ${hStr}" Triangle` };
  }
  return { key: `poly-${wStr}x${hStr}`, label: `${wStr}" × ${hStr}" Patch` };
}

/**
 * On studio mount, if `photoLayoutStore.cells` is populated:
 *   1. Drop the warped block image (or the original photo) in as the
 *      reference background.
 *   2. Add a filled polygon per patch coloured with the sampled fabric.
 *   3. Aggregate patches into the print list grouped by shape signature.
 *   4. Persist the project so the patches survive reload.
 *   5. Reset the photoLayoutStore.
 */
export function usePhotoPatternImport() {
  const loadingRef = useRef(false);
  const cells = usePhotoLayoutStore((s) => s.cells);
  const originalImageUrl = usePhotoLayoutStore((s) => s.originalImageUrl);
  const warpedImageRef = usePhotoLayoutStore((s) => s.warpedImageRef);
  const blockWidthInches = usePhotoLayoutStore((s) => s.blockWidthInches);
  const blockHeightInches = usePhotoLayoutStore((s) => s.blockHeightInches);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const seamAllowance = usePhotoLayoutStore((s) => s.seamAllowance);

  useEffect(() => {
    if (loadingRef.current || !fabricCanvas || cells.length === 0) return;
    loadingRef.current = true;

    async function loadPieces() {
      const fabric = await import('fabric');
      const canvas = fabricCanvas!;

      // 1. Use the warped block as reference background if available —
      // it matches the final geometry 1:1 so alignment is trivial. Fall
      // back to the original photo otherwise.
      const bgUrl = warpedImageRef?.url ?? originalImageUrl;
      if (bgUrl) {
        try {
          const bgImg = await fabric.FabricImage.fromURL(bgUrl);
          bgImg.set({
            scaleX: (blockWidthInches * PIXELS_PER_INCH) / (bgImg.width ?? 1),
            scaleY: (blockHeightInches * PIXELS_PER_INCH) / (bgImg.height ?? 1),
            opacity: PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT,
            selectable: false,
            evented: false,
          });
          canvas.backgroundImage = bgImg;
        } catch {
          // Non-fatal — continue without reference image.
        }
      }

      // 2. Add filled polygons for every grid cell. Because the grid is
      // mathematically strict, we fill (not outline) so the user sees the
      // reconstructed pattern right away. Fabrics can be swapped in the
      // studio later by clicking each patch.
      for (const cell of cells) {
        const points = cell.polygonInches.map((p) => ({
          x: p.x * PIXELS_PER_INCH,
          y: p.y * PIXELS_PER_INCH,
        }));
        if (points.length < 3) continue;

        const polygon = new fabric.Polygon(points, {
          fill: cell.fabricColor,
          stroke: PATCH_STROKE_COLOR,
          strokeWidth: PATCH_STROKE_WIDTH,
          strokeUniform: true,
          selectable: true,
          objectCaching: false,
        });

        (polygon as unknown as Record<string, unknown>).__pieceId = cell.id;
        (polygon as unknown as Record<string, unknown>).__assignedFabricId =
          cell.assignedFabricId;

        canvas.add(polygon);
      }

      // 3. Aggregate into the print list by shape signature. A 9-Patch
      // collapses to a single entry of 9 identical squares.
      const groups = new Map<string, { label: string; cells: GridCell[] }>();
      for (const cell of cells) {
        const sig = cellSignature(cell);
        const existing = groups.get(sig.key);
        if (existing) existing.cells.push(cell);
        else groups.set(sig.key, { label: sig.label, cells: [cell] });
      }
      const ordered = Array.from(groups.entries()).sort(
        (a, b) => b[1].cells.length - a[1].cells.length
      );
      for (const [key, group] of ordered) {
        const representative = group.cells[0];
        usePrintlistStore.getState().addItem({
          shapeId: `photo-cell-${key}`,
          shapeName: `${group.label} (×${group.cells.length})`,
          svgData: cellToSvg(representative),
          quantity: group.cells.length,
          unitSystem: 'imperial',
          seamAllowance,
        });
      }

      canvas.renderAll();

      // 4. Reference panel state.
      useCanvasStore.getState().setReferenceImageOpacity(PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT);
      if (bgUrl) {
        try {
          const response = await fetch(bgUrl);
          const blob = await response.blob();
          const durableUrl = URL.createObjectURL(blob);
          useCanvasStore.getState().setReferenceImageUrl(durableUrl);
        } catch {
          useCanvasStore.getState().setReferenceImageUrl(bgUrl);
        }
      }

      if (!usePrintlistStore.getState().isPanelOpen) {
        usePrintlistStore.getState().togglePanel();
      }

      // 5. Mark dirty + save so the imported patches survive a reload.
      const projectStore = useProjectStore.getState();
      projectStore.setHasContent(true);
      projectStore.setDirty(true);
      if (projectStore.projectId) {
        try {
          await saveProject({
            projectId: projectStore.projectId,
            fabricCanvas: canvas,
            source: 'manual',
          });
        } catch (err) {
          console.error('Failed to persist photo-imported patches:', err);
        }
      }

      // 6. Clear the wizard store.
      usePhotoLayoutStore.getState().reset();
    }

    loadPieces().finally(() => {
      loadingRef.current = false;
    });
  }, [fabricCanvas, cells, originalImageUrl, warpedImageRef, blockWidthInches, blockHeightInches, seamAllowance]);
}
