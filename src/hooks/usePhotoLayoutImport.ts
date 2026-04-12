'use client';

import { useEffect, useRef } from 'react';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { saveProject } from '@/lib/save-project';
import { PIXELS_PER_INCH, PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT } from '@/lib/constants';
import { CANVAS } from '@/lib/design-system';
import type { DetectedPatch } from '@/lib/quilt-segmentation-engine';
import type { Point2D } from '@/lib/photo-layout-types';

/** Default stroke for the imported patch outlines. */
const PATCH_STROKE_COLOR = CANVAS.seamLine;
const PATCH_STROKE_WIDTH = 1.5;

/**
 * Classify a patch for the print-list grouping key. Uses the axis-aligned
 * bounding box in inches rounded to two decimals, plus a triangle /
 * quadrilateral discriminator based on the simplified polygon length.
 */
function patchSignature(patch: DetectedPatch, pxToInches: number): { key: string; label: string } {
  const w = (patch.bboxPx.maxX - patch.bboxPx.minX) * pxToInches;
  const h = (patch.bboxPx.maxY - patch.bboxPx.minY) * pxToInches;
  const wStr = w.toFixed(2);
  const hStr = h.toFixed(2);

  if (patch.polygonPx.length === 4) {
    return { key: `sq-${wStr}x${hStr}`, label: `${wStr}" × ${hStr}" Square` };
  }
  if (patch.polygonPx.length === 3) {
    return { key: `tri-${wStr}x${hStr}`, label: `${wStr}" × ${hStr}" Triangle` };
  }
  return {
    key: `poly-${patch.polygonPx.length}-${wStr}x${hStr}`,
    label: `${wStr}" × ${hStr}" Patch`,
  };
}

/**
 * Minimal outline SVG for a single patch, used in the print-list preview.
 * Converts the polygon from warped-image pixel space into a normalized
 * inches viewBox so the preview renders at a sensible size.
 */
function patchToSvg(patch: DetectedPatch, pxToInches: number): string {
  if (patch.polygonPx.length < 3) return '';
  const pts = patch.polygonPx.map((p) => ({
    x: p.x * pxToInches,
    y: p.y * pxToInches,
  }));
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
 * On studio mount, if `photoLayoutStore.segmentation` is populated:
 *   1. Drop the warped block image as the dimmed reference background.
 *   2. Add a filled polygon per detected patch (override color wins over
 *      the cluster color).
 *   3. Aggregate patches into the print list grouped by shape signature.
 *   4. Persist the project so the patches survive reload.
 *   5. Reset the photoLayoutStore.
 */
export function usePhotoPatternImport() {
  const loadingRef = useRef(false);
  const segmentation = usePhotoLayoutStore((s) => s.segmentation);
  const patchOverrides = usePhotoLayoutStore((s) => s.patchOverrides);
  const originalImageUrl = usePhotoLayoutStore((s) => s.originalImageUrl);
  const warpedImageRef = usePhotoLayoutStore((s) => s.warpedImageRef);
  const blockWidthInches = usePhotoLayoutStore((s) => s.blockWidthInches);
  const blockHeightInches = usePhotoLayoutStore((s) => s.blockHeightInches);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const seamAllowance = usePhotoLayoutStore((s) => s.seamAllowance);

  useEffect(() => {
    if (loadingRef.current || !fabricCanvas) return;
    if (!segmentation || segmentation.patches.length === 0) return;
    loadingRef.current = true;

    async function loadPieces() {
      const fabric = await import('fabric');
      const canvas = fabricCanvas!;

      if (!segmentation) return;

      // Warped-image pixels → studio inches (and then × PIXELS_PER_INCH
      // → studio canvas pixels). Uses the warped image's true width so
      // the polygons land inside the real block footprint.
      const pxToInches = blockWidthInches / segmentation.width;
      const warpedToCanvasScale = pxToInches * PIXELS_PER_INCH;

      // 1. Dimmed reference background — the warped block matches the
      // imported geometry 1:1, so alignment is trivial.
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

      // 2. Emit one Fabric.js polygon per detected patch.
      for (const patch of segmentation.patches) {
        if (patch.polygonPx.length < 3) continue;

        const override = patchOverrides[patch.id];
        const cluster = segmentation.palette.find((c) => c.index === patch.clusterIndex);
        const fill = override?.hex ?? cluster?.hex ?? '#d4ccc4';
        const assignedFabricId = override?.fabricId ?? cluster?.libraryFabricId ?? null;

        const points: Point2D[] = patch.polygonPx.map((p) => ({
          x: p.x * warpedToCanvasScale,
          y: p.y * warpedToCanvasScale,
        }));

        const polygon = new fabric.Polygon(
          points.map((p) => ({ x: p.x, y: p.y })),
          {
            fill,
            stroke: PATCH_STROKE_COLOR,
            strokeWidth: PATCH_STROKE_WIDTH,
            strokeUniform: true,
            selectable: true,
            objectCaching: false,
          }
        );

        (polygon as unknown as Record<string, unknown>).__pieceId = patch.id;
        (polygon as unknown as Record<string, unknown>).__assignedFabricId = assignedFabricId;

        canvas.add(polygon);
      }

      // 3. Aggregate patches into the print list by shape signature.
      const groups = new Map<string, { label: string; patches: DetectedPatch[] }>();
      for (const patch of segmentation.patches) {
        if (patch.polygonPx.length < 3) continue;
        const sig = patchSignature(patch, pxToInches);
        const existing = groups.get(sig.key);
        if (existing) existing.patches.push(patch);
        else groups.set(sig.key, { label: sig.label, patches: [patch] });
      }
      const ordered = Array.from(groups.entries()).sort(
        (a, b) => b[1].patches.length - a[1].patches.length
      );
      for (const [key, group] of ordered) {
        const representative = group.patches[0];
        usePrintlistStore.getState().addItem({
          shapeId: `photo-patch-${key}`,
          shapeName: `${group.label} (×${group.patches.length})`,
          svgData: patchToSvg(representative, pxToInches),
          quantity: group.patches.length,
          unitSystem: 'imperial',
          seamAllowance,
        });
      }

      canvas.renderAll();

      // 4. Reference panel state. Pass the URL straight through — it's
      // already either a blob: URL we own or an http(s) URL from the
      // mobile-upload path, so the extra fetch + re-blob step is just
      // dead weight (and triggers a spurious CSP connect-src violation
      // on blob: URLs).
      useCanvasStore.getState().setReferenceImageOpacity(PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT);
      if (bgUrl) {
        useCanvasStore.getState().setReferenceImageUrl(bgUrl);
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
  }, [
    fabricCanvas,
    segmentation,
    patchOverrides,
    originalImageUrl,
    warpedImageRef,
    blockWidthInches,
    blockHeightInches,
    seamAllowance,
  ]);
}
