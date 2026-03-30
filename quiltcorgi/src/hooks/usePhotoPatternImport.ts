'use client';

import { useEffect, useRef } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { PIXELS_PER_INCH, PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT } from '@/lib/constants';

/**
 * On studio mount, if photoPatternStore has scaledPieces,
 * load them onto the Fabric.js canvas as polygon objects
 * with a reference photo background.
 *
 * Re-runs whenever scaledPieces changes (e.g. after the
 * Photo to Pattern flow finishes). The store resets at the
 * end of loadPieces(), so the guard on length === 0 prevents
 * double-importing.
 */
export function usePhotoPatternImport() {
  const loadingRef = useRef(false);
  const scaledPieces = usePhotoPatternStore((s) => s.scaledPieces);
  const originalImageUrl = usePhotoPatternStore((s) => s.originalImageUrl);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

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

      // 2. Create polygon objects for each piece
      for (const piece of scaledPieces) {
        const points = piece.contourInches.map((p) => ({
          x: p.x * PIXELS_PER_INCH,
          y: p.y * PIXELS_PER_INCH,
        }));

        if (points.length < 3) continue;

        const polygon = new fabric.Polygon(points, {
          fill: piece.dominantColor,
          stroke: '#4A3B32',
          strokeWidth: 1,
          selectable: true,
          objectCaching: false,
        });

        canvas.add(polygon);
      }

      canvas.renderAll();

      // 3. Set reference image opacity
      useCanvasStore.getState().setReferenceImageOpacity(PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT);

      // 4. Clean up the store (data has been applied to canvas)
      usePhotoPatternStore.getState().reset();
      loadingRef.current = false;
    }

    loadPieces();
  }, [fabricCanvas, scaledPieces, originalImageUrl]);
}
