'use client';

import { useEffect, useRef } from 'react';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { PIXELS_PER_INCH, PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT } from '@/lib/constants';
import type {
  ScaledPiece,
  DetectedPieceWithEdgeInfo,
  PieceRole,
  QuiltStructure,
} from '@/lib/photo-layout-types';

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
 * Builds a role-aware print list name for a piece group.
 *
 * Priority:
 * 1. piece.role (already attached by CV pipeline)
 * 2. quiltStructure.pieceRoles.get(piece.id) (fallback lookup)
 * 3. quiltStructure.blockTemplate label (for block pieces, if available)
 * 4. Existing generic naming ("Piece N …")
 */
function buildShapeName(
  representative: ScaledPiece,
  groupPieces: readonly ScaledPiece[],
  groupIndex: number,
  quiltStructure: QuiltStructure | null
): string {
  const quantity = groupPieces.length;
  const quantitySuffix = quantity > 1 ? ` (${quantity} identical)` : '';

  // Resolve the role from piece or the structure map
  const role: PieceRole | undefined =
    representative.role ?? quiltStructure?.pieceRoles.get(representative.id) ?? undefined;

  // If a block template exists and the piece is a block piece, use its label
  if (role === 'block' && quiltStructure?.blockTemplate) {
    const templatePiece = quiltStructure.blockTemplate.pieces[groupIndex];
    const label = templatePiece?.label ?? String.fromCharCode(65 + groupIndex); // A, B, C…
    return `Block Piece ${label}${quantitySuffix}`;
  }

  switch (role) {
    case 'block':
      return `Block Piece ${groupIndex + 1}${quantitySuffix}`;
    case 'sashing':
      return `Sashing Strip ${groupIndex + 1}`;
    case 'border':
      return `Border Strip ${groupIndex + 1}`;
    case 'cornerstone':
      return `Cornerstone ${groupIndex + 1}`;
    case 'binding':
      return `Binding Strip ${groupIndex + 1}`;
    case 'setting-triangle':
      return `Setting Triangle ${groupIndex + 1}${quantitySuffix}`;
    default:
      // Preserve the original naming when role is unknown/unset
      return quantity > 1 ? `Piece ${groupIndex + 1}${quantitySuffix}` : `Piece ${groupIndex + 1}`;
  }
}

/**
 * Grayscale palette for initial piece fill before fabric assignment.
 */
const ROLE_FILL_COLORS: Record<PieceRole, string> = {
  block: '#D0D0D0',
  sashing: '#B8C0B0',
  cornerstone: '#C8B0C8',
  border: '#C8C0B0',
  binding: '#B0B0A0',
  'setting-triangle': '#B0C8C8',
  unknown: '#E0E0E0',
};

/**
 * On studio mount, if photoPatternStore has scaledPieces:
 * 1. Load them onto the Fabric.js canvas as polygon objects
 * 2. Set reference photo as background
 * 3. Tag each object with its piece role
 * 4. Group pieces that share a grid cell into a Fabric.js Group
 * 5. Auto-add unique shapes to print list with quantities
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
  const quiltStructure = usePhotoLayoutStore((s) => s.quiltStructure);

  useEffect(() => {
    if (loadingRef.current || !fabricCanvas || scaledPieces.length === 0) return;
    loadingRef.current = true;

    async function loadPieces() {
      const fabric = await import('fabric');
      const canvas = fabricCanvas!;
      const { targetWidth, targetHeight } = usePhotoLayoutStore.getState();
      const detectedPieces = usePhotoLayoutStore.getState().detectedPieces;

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

      // 2. Build a map from piece ID → grid cell key (if grid exists)
      const pieceToCellKey = new Map<string, string>();
      if (quiltStructure?.grid) {
        for (const cell of quiltStructure.grid.cells) {
          const key = `${cell.row},${cell.col}`;
          for (const id of cell.pieceIds) {
            pieceToCellKey.set(id, key);
          }
        }
      }

      // 3. Create polygon objects for each piece
      const cellPolygons = new Map<string, Array<InstanceType<typeof fabric.Polygon>>>();

      for (const scaledPiece of scaledPieces) {
        const points = scaledPiece.contourInches.map((p) => ({
          x: p.x * PIXELS_PER_INCH,
          y: p.y * PIXELS_PER_INCH,
        }));

        if (points.length < 3) continue;

        // Resolve role
        const role: PieceRole =
          scaledPiece.role ??
          quiltStructure?.pieceRoles.get(scaledPiece.id) ??
          'unknown';

        const fillColor =
          scaledPiece.dominantColor !== '#000000'
            ? scaledPiece.dominantColor
            : ROLE_FILL_COLORS[role];

        const polygon = new fabric.Polygon(points, {
          fill: fillColor,
          stroke: '#4A3B32',
          strokeWidth: 1,
          selectable: true,
          objectCaching: false,
        });

        // Tag with piece role via custom property
        (polygon as unknown as Record<string, unknown>).__pieceRole = role;
        (polygon as unknown as Record<string, unknown>).__pieceId = scaledPiece.id;

        // Track polygons by grid cell for grouping
        const cellKey = pieceToCellKey.get(scaledPiece.id);
        if (cellKey) {
          const existing = cellPolygons.get(cellKey);
          if (existing) {
            existing.push(polygon);
          } else {
            cellPolygons.set(cellKey, [polygon]);
          }
        } else {
          // Non-grid pieces are added directly to canvas
          canvas.add(polygon);
        }
      }

      // 4. Group grid cell polygons into Fabric.js Groups
      for (const [, polygons] of cellPolygons) {
        if (polygons.length === 1) {
          canvas.add(polygons[0]);
        } else {
          const group = new fabric.Group(polygons, {
            selectable: true,
            objectCaching: false,
          } as Record<string, unknown>);
          (group as unknown as Record<string, unknown>).__pieceRole = 'block';
          canvas.add(group);
        }
      }

      // 5. Add to print list grouped by shape
      const pieceGroups = groupIdenticalPieces(scaledPieces);
      let groupIndex = 0;
      for (const [, groupPieces] of pieceGroups) {
        const representative = groupPieces[0];
        const quantity = groupPieces.length;

        if (representative.contourInches.length < 3) continue;

        // Check if this is an edge piece
        // Look up in the original detected pieces for edge info
        const originalPiece = detectedPieces.find((p) => p.id === representative.id);
        const edgeInfo = originalPiece as unknown as DetectedPieceWithEdgeInfo | undefined;
        const isEdgePiece = edgeInfo?.isEdgePiece ?? false;

        // Build role-aware name
        let shapeName = buildShapeName(representative, groupPieces, groupIndex, quiltStructure);

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

      canvas.renderAll();

      // 6. Set reference image opacity
      useCanvasStore.getState().setReferenceImageOpacity(PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT);

      // 7. Persist original photo URL for the reference panel
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

      // 8. Open print list panel
      if (!usePrintlistStore.getState().isPanelOpen) {
        usePrintlistStore.getState().togglePanel();
      }

      // 9. Clean up the store
      usePhotoLayoutStore.getState().reset();
    }

    loadPieces().finally(() => {
      loadingRef.current = false;
    });
  }, [fabricCanvas, scaledPieces, originalImageUrl, seamAllowance, quiltStructure]);
}

export function usePhotoLayoutImport() {
  return usePhotoPatternImport();
}
