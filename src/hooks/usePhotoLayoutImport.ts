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
  ShapeCorrectionResult,
} from '@/lib/photo-layout-types';
import {
  loadBlockGroup,
  fetchBlockSvg,
  createBlockFabricGroup,
} from '@/lib/block-svg-loader';

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

/**
 * Builds a role-aware print list name for a piece group.
 */
function buildShapeName(
  representative: ScaledPiece,
  groupPieces: readonly ScaledPiece[],
  groupIndex: number,
  quiltStructure: QuiltStructure | null,
  blockName?: string
): string {
  const quantity = groupPieces.length;
  const quantitySuffix = quantity > 1 ? ` (${quantity} identical)` : '';

  const role: PieceRole | undefined =
    representative.role ?? quiltStructure?.pieceRoles.get(representative.id) ?? undefined;

  if (blockName) {
    return `${blockName}${quantitySuffix}`;
  }

  if (role === 'block' && quiltStructure?.blockTemplate) {
    const templatePiece = quiltStructure.blockTemplate.pieces[groupIndex];
    const label = templatePiece?.label ?? String.fromCharCode(65 + groupIndex);
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
 * 3. For matched block cells → load SVG block groups from /quilt_blocks/
 * 4. For unmatched cells → create polygons from detected contours
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
  const shapeCorrection = usePhotoLayoutStore((s) => s.shapeCorrection);

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

      // 2. Build lookup maps
      const pieceToCellKey = new Map<string, string>();
      if (quiltStructure?.grid) {
        for (const cell of quiltStructure.grid.cells) {
          const key = `${cell.row},${cell.col}`;
          for (const id of cell.pieceIds) {
            pieceToCellKey.set(id, key);
          }
        }
      }

      // 3a. For matched block cells → load SVG block groups
      const matchedCellKeys = new Set<string>();
      if (shapeCorrection) {
        for (const [cellKey, match] of shapeCorrection.blockMatches) {
          matchedCellKeys.add(cellKey);

          // Find the cell's pieces to determine bounds
          const cellPieces = scaledPieces.filter(
            (p) => pieceToCellKey.get(p.id) === cellKey
          );

          if (cellPieces.length === 0) continue;

          // Compute cell bounds in inches, then convert to canvas pixels
          const bounds = computeCellBoundsInches(cellPieces);
          const cellLeft = bounds.minX * PIXELS_PER_INCH;
          const cellTop = bounds.minY * PIXELS_PER_INCH;
          const cellWidth = (bounds.maxX - bounds.minX) * PIXELS_PER_INCH;
          const cellHeight = (bounds.maxY - bounds.minY) * PIXELS_PER_INCH;

          // Load the block SVG and create a Fabric.js Group
          try {
            const svgData = await fetchBlockSvg(match.blockId);
            if (svgData) {
              const result = await createBlockFabricGroup(
                svgData,
                match.blockId,
                cellLeft,
                cellTop,
                cellWidth,
                cellHeight
              );

              if (result) {
                canvas.add(result.group);
              }
            }
          } catch (err) {
            console.warn(`[usePhotoPatternImport] Failed to load block ${match.blockId}:`, err);
          }
        }
      }

      // 3b. For unmatched pieces → create polygons from contours
      const unmatchedPieces = scaledPieces.filter(
        (p) => !matchedCellKeys.has(pieceToCellKey.get(p.id) ?? '')
      );

      for (const scaledPiece of unmatchedPieces) {
        const points = scaledPiece.contourInches.map((p) => ({
          x: p.x * PIXELS_PER_INCH,
          y: p.y * PIXELS_PER_INCH,
        }));

        if (points.length < 3) continue;

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

        (polygon as unknown as Record<string, unknown>).__pieceRole = role;
        (polygon as unknown as Record<string, unknown>).__pieceId = scaledPiece.id;

        canvas.add(polygon);
      }

      // 4. Add to print list grouped by shape
      const pieceGroups = groupIdenticalPieces(scaledPieces);
      let groupIndex = 0;
      for (const [, groupPieces] of pieceGroups) {
        const representative = groupPieces[0];
        const quantity = groupPieces.length;

        if (representative.contourInches.length < 3) continue;

        const originalPiece = detectedPieces.find((p) => p.id === representative.id);
        const edgeInfo = originalPiece as unknown as DetectedPieceWithEdgeInfo | undefined;
        const isEdgePiece = edgeInfo?.isEdgePiece ?? false;

        // Check if this piece belongs to a matched block
        const cellKey = pieceToCellKey.get(representative.id);
        const matchResult = cellKey ? shapeCorrection?.blockMatches.get(cellKey) : undefined;
        const blockName = matchResult?.displayName;

        let shapeName = buildShapeName(
          representative,
          groupPieces,
          groupIndex,
          quiltStructure,
          blockName
        );

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
            ? seamAllowance + 0.25
            : seamAllowance,
        });

        groupIndex++;
      }

      canvas.renderAll();

      // 5. Set reference image opacity
      useCanvasStore.getState().setReferenceImageOpacity(PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT);

      // 6. Persist original photo URL for the reference panel
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

      // 7. Open print list panel
      if (!usePrintlistStore.getState().isPanelOpen) {
        usePrintlistStore.getState().togglePanel();
      }

      // 8. Clean up the store
      usePhotoLayoutStore.getState().reset();
    }

    loadPieces().finally(() => {
      loadingRef.current = false;
    });
  }, [fabricCanvas, scaledPieces, originalImageUrl, seamAllowance, quiltStructure, shapeCorrection]);
}

/**
 * Compute the bounding box of a cell's pieces in inches.
 */
function computeCellBoundsInches(
  pieces: readonly ScaledPiece[]
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const piece of pieces) {
    for (const p of piece.contourInches) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  return { minX, minY, maxX, maxY };
}
