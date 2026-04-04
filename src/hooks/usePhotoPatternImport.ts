'use client';

import { useEffect, useRef } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { PIXELS_PER_INCH, PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT } from '@/lib/constants';
import type { ScaledPiece, DetectedPieceWithEdgeInfo } from '@/lib/photo-pattern-types';

/**
 * Groups identical pieces by comparing their contours.
 * Returns groups with representative piece and count.
 */
function groupIdenticalPieces(pieces: readonly ScaledPiece[]): Map<string, ScaledPiece[]> {
  const groups = new Map<string, ScaledPiece[]>();

  for (const piece of pieces) {
    // Create a key from the contour points (rounded to avoid floating point differences)
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
 * Generates SVG path data from piece contour.
 */
function contourToSvg(contour: readonly { x: number; y: number }[]): string {
  if (contour.length < 3) return '';

  // Compute viewBox from actual contour bounds
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

/**
 * On studio mount, if photoPatternStore has scaledPieces:
 * 1. Load them onto the Fabric.js canvas as polygon objects
 * 2. Set reference photo as background
 * 3. Auto-add unique shapes to print list with quantities
 *
 * Re-runs whenever scaledPieces changes. Store resets after import
 * to prevent double-importing.
 */
export function usePhotoPatternImport() {
  const loadingRef = useRef(false);
  const scaledPieces = usePhotoPatternStore((s) => s.scaledPieces);
  const originalImageUrl = usePhotoPatternStore((s) => s.originalImageUrl);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const seamAllowance = usePhotoPatternStore((s) => s.seamAllowance);

  useEffect(() => {
    if (loadingRef.current || !fabricCanvas || scaledPieces.length === 0) return;
    loadingRef.current = true;

    async function loadPieces() {
      const fabric = await import('fabric');
      const canvas = fabricCanvas!;
      const { targetWidth, targetHeight } = usePhotoPatternStore.getState();

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

      // 2. Group identical pieces for print list
      const pieceGroups = groupIdenticalPieces(scaledPieces);

      // 3. Create polygon objects and add to print list
      let groupIndex = 0;
      for (const [, groupPieces] of pieceGroups) {
        const representative = groupPieces[0];
        const quantity = groupPieces.length;

        // Create polygon on canvas (only one instance per group, user can duplicate if needed)
        const points = representative.contourInches.map((p) => ({
          x: p.x * PIXELS_PER_INCH,
          y: p.y * PIXELS_PER_INCH,
        }));

        if (points.length >= 3) {
          const polygon = new fabric.Polygon(points, {
            fill: representative.dominantColor,
            stroke: '#4A3B32',
            strokeWidth: 1,
            selectable: true,
            objectCaching: false,
          });

          canvas.add(polygon);

          // Check if this is an edge piece
          const edgeInfo = representative as unknown as DetectedPieceWithEdgeInfo;
          const isEdgePiece = edgeInfo.isEdgePiece ?? false;

          // Add to print list with quantity and edge indication
          let shapeName =
            groupPieces.length > 1
              ? `Piece ${groupIndex + 1} (${groupPieces.length} identical)`
              : `Piece ${groupIndex + 1}`;

          // Mark edge pieces clearly in the print list
          if (isEdgePiece) {
            shapeName += ' [EDGE]';
          }

          usePrintlistStore.getState().addItem({
            shapeId: `photo-piece-${groupIndex}`,
            shapeName,
            svgData: contourToSvg(representative.contourInches),
            quantity,
            unitSystem: 'imperial',
            seamAllowance: isEdgePiece
              ? seamAllowance + 0.25 // Edge pieces get extra 1/4" for trimming
              : seamAllowance,
          });

          groupIndex++;
        }
      }

      canvas.renderAll();

      // 4. Open print list panel to show imported pieces
      if (!usePrintlistStore.getState().isPanelOpen) {
        usePrintlistStore.getState().togglePanel();
      }

      // 6. Clean up the store (data has been applied to canvas)
      usePhotoPatternStore.getState().reset();
    }

    loadPieces().finally(() => {
      loadingRef.current = false;
    });
  }, [fabricCanvas, scaledPieces, originalImageUrl, seamAllowance]);
}
