'use client';

import { useEffect, useRef } from 'react';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { saveProject } from '@/lib/save-project';
import { PIXELS_PER_INCH, PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT } from '@/lib/constants';
import type { ScaledPiece } from '@/lib/photo-layout-types';

/**
 * Groups identical pieces by comparing their contours.
 * Returns groups with representative piece and count.
 */
function groupIdenticalPieces(pieces: readonly ScaledPiece[]): Map<string, ScaledPiece[]> {
  const groups = new Map<string, ScaledPiece[]>();

  for (const piece of pieces) {
    const key = piece.contourInches
      .map((p) => `${Math.round(p.x * 100)},${Math.round(p.y * 100)}`)
      .join('|');

    const existing = groups.get(key);
    if (existing) {
      existing.push(piece);
    } else {
      groups.set(key, [piece]);
    }
  }

  return groups;
}

/**
 * Generates SVG from piece contour.
 */
function contourToSvg(contour: readonly { x: number; y: number }[]): string {
  if (contour.length < 3) return '';

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of contour) {
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

  const points = contour.map((p) => `${p.x},${p.y}`).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid meet"><polygon points="${points}" fill="currentColor" stroke="currentColor" stroke-width="0.5"/></svg>`;
}

/** Neutral fallback fill for pieces with black dominant color. */
const NEUTRAL_FILL = '#d4ccc4';

/**
 * Resolves the fill color for a piece. Uses the detected dominant color
 * unless it's pure black, which typically indicates a detection artifact.
 */
function resolveFillColor(dominantColor: string): string {
  return dominantColor === '#000000' ? NEUTRAL_FILL : dominantColor;
}

/**
 * On studio mount, if photoLayoutStore has scaledPieces:
 * 1. Set reference photo as canvas background
 * 2. Create a fabric.Polygon for each piece, filled with its dominant color
 * 3. Group identical pieces and add to print list with quantities
 * 4. Open print list panel
 * 5. Persist reference image URL
 * 6. Reset photoLayoutStore
 *
 * Re-runs whenever scaledPieces changes. Store resets after import
 * to prevent double-importing.
 */
export function usePhotoPatternImport() {
  const loadingRef = useRef(false);
  const scaledPieces = usePhotoLayoutStore((s) => s.scaledPieces);
  const originalImageUrl = usePhotoLayoutStore((s) => s.originalImageUrl);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const seamAllowance = usePhotoLayoutStore((s) => s.seamAllowance);

  useEffect(() => {
    if (loadingRef.current || !fabricCanvas || scaledPieces.length === 0) return;
    loadingRef.current = true;

    async function loadPieces() {
      const fabric = await import('fabric');
      const canvas = fabricCanvas!;
      const { targetWidth, targetHeight } = usePhotoLayoutStore.getState();

      // 1. Set reference image as background
      if (originalImageUrl) {
        try {
          const bgImg = await fabric.FabricImage.fromURL(originalImageUrl);
          bgImg.set({
            scaleX: (targetWidth * PIXELS_PER_INCH) / (bgImg.width ?? 1),
            scaleY: (targetHeight * PIXELS_PER_INCH) / (bgImg.height ?? 1),
            opacity: PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT,
            selectable: false,
            evented: false,
          });
          canvas.backgroundImage = bgImg;
        } catch {
          // Non-fatal — continue without reference image
        }
      }

      // 2. Create polygons for each piece
      for (const scaledPiece of scaledPieces) {
        const points = scaledPiece.contourInches.map((p) => ({
          x: p.x * PIXELS_PER_INCH,
          y: p.y * PIXELS_PER_INCH,
        }));

        if (points.length < 3) continue;

        const polygon = new fabric.Polygon(points, {
          fill: resolveFillColor(scaledPiece.dominantColor),
          stroke: '#4A3B32',
          strokeWidth: 1,
          selectable: true,
          objectCaching: false,
        });

        (polygon as unknown as Record<string, unknown>).__pieceId = scaledPiece.id;

        canvas.add(polygon);
      }

      // 3. Add to print list grouped by shape
      const pieceGroups = groupIdenticalPieces(scaledPieces);
      let groupIndex = 0;
      for (const [, groupPieces] of pieceGroups) {
        const representative = groupPieces[0];
        const quantity = groupPieces.length;

        if (representative.contourInches.length < 3) continue;

        const quantitySuffix = quantity > 1 ? ` (${quantity} identical)` : '';
        const shapeName = `Piece ${groupIndex + 1}${quantitySuffix}`;

        usePrintlistStore.getState().addItem({
          shapeId: `photo-piece-${groupIndex}`,
          shapeName,
          svgData: contourToSvg(representative.contourInches),
          quantity,
          unitSystem: 'imperial',
          seamAllowance,
        });

        groupIndex++;
      }

      canvas.renderAll();

      // 4. Set reference image opacity
      useCanvasStore.getState().setReferenceImageOpacity(PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT);

      // 5. Persist original photo URL for the reference panel
      if (originalImageUrl) {
        try {
          const response = await fetch(originalImageUrl);
          const blob = await response.blob();
          const durableUrl = URL.createObjectURL(blob);
          useCanvasStore.getState().setReferenceImageUrl(durableUrl);
        } catch {
          useCanvasStore.getState().setReferenceImageUrl(originalImageUrl);
        }
      }

      // 6. Open print list panel
      if (!usePrintlistStore.getState().isPanelOpen) {
        usePrintlistStore.getState().togglePanel();
      }

      // 7. Mark project as having content, dirty it, and save immediately
      // so the imported polygons survive a page reload. Without this, the
      // autosave loop skips (isDirty=false) and the studio boots with an
      // empty canvas, popping the New Quilt setup modal.
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
          console.error('Failed to persist photo-imported polygons:', err);
        }
      }

      // 8. Clean up the store
      usePhotoLayoutStore.getState().reset();
    }

    loadPieces().finally(() => {
      loadingRef.current = false;
    });
  }, [fabricCanvas, scaledPieces, originalImageUrl, seamAllowance]);
}
