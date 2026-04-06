'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import {
  PHOTO_PATTERN_OVERLAY_OPACITY,
  PHOTO_PATTERN_SENSITIVITY_MIN,
  PHOTO_PATTERN_SENSITIVITY_MAX,
  PHOTO_PATTERN_SENSITIVITY_DEBOUNCE_MS,
} from '@/lib/constants';
import type { PieceRole, DetectedPiece } from '@/lib/photo-layout-types';

// ── Role Color Map ────────────────────────────────────────────────────────

const ROLE_COLORS: Record<PieceRole, string> = {
  block: '#3B82F6', // blue
  sashing: '#22C55E', // green
  cornerstone: '#A855F7', // purple
  border: '#F97316', // orange
  binding: '#EAB308', // yellow
  'setting-triangle': '#06B6D4', // cyan
  unknown: '#6B7280', // gray
};

const ROLE_LABELS: Record<PieceRole, string> = {
  block: 'Block',
  sashing: 'Sashing',
  cornerstone: 'Cornerstone',
  border: 'Border',
  binding: 'Binding',
  'setting-triangle': 'Setting Triangle',
  unknown: 'Unknown',
};

const ALL_ROLES: PieceRole[] = [
  'block',
  'sashing',
  'cornerstone',
  'border',
  'binding',
  'setting-triangle',
  'unknown',
];

// ── Helpers ───────────────────────────────────────────────────────────────

function getRoleForPiece(
  piece: DetectedPiece,
  roleOverrides: Map<string, PieceRole>,
  structureRoles: Map<string, PieceRole> | null
): PieceRole {
  return roleOverrides.get(piece.id) ?? structureRoles?.get(piece.id) ?? piece.role ?? 'unknown';
}

// ── Component ─────────────────────────────────────────────────────────────

export function ResultsStep() {
  const originalImage = usePhotoLayoutStore((s) => s.originalImage);
  const correctedImageRef = usePhotoLayoutStore((s) => s.correctedImageRef);
  const detectedPieces = usePhotoLayoutStore((s) => s.detectedPieces);
  const sensitivity = usePhotoLayoutStore((s) => s.sensitivity);
  const setSensitivity = usePhotoLayoutStore((s) => s.setSensitivity);
  const setStep = usePhotoLayoutStore((s) => s.setStep);
  const setPipelineSteps = usePhotoLayoutStore((s) => s.setPipelineSteps);
  const quiltStructure = usePhotoLayoutStore((s) => s.quiltStructure);
  const setDetectedPieces = usePhotoLayoutStore((s) => s.setDetectedPieces);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localSensitivity, setLocalSensitivity] = useState(sensitivity);
  const [roleOverrides, setRoleOverrides] = useState<Map<string, PieceRole>>(new Map());
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  const structureRoles = quiltStructure?.pieceRoles ?? null;

  // Draw the corrected image + piece contour overlays color-coded by role
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const draw = (imgSource: HTMLImageElement, w: number, h: number) => {
      const containerRect = container.getBoundingClientRect();
      const fitScale = Math.min(containerRect.width / w, containerRect.height / h, 1);

      canvas.width = containerRect.width;
      canvas.height = containerRect.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawX = (containerRect.width - w * fitScale) / 2;
      const drawY = (containerRect.height - h * fitScale) / 2;

      ctx.drawImage(imgSource, drawX, drawY, w * fitScale, h * fitScale);

      // Draw piece contours color-coded by role
      ctx.save();
      ctx.lineWidth = 2;
      ctx.globalAlpha = PHOTO_PATTERN_OVERLAY_OPACITY;

      for (const piece of detectedPieces) {
        if (piece.contour.length < 2) continue;

        const role = getRoleForPiece(piece, roleOverrides, structureRoles);
        const color = ROLE_COLORS[role];
        const isSelected = piece.id === selectedPieceId;

        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.globalAlpha = isSelected ? 1 : PHOTO_PATTERN_OVERLAY_OPACITY;

        ctx.beginPath();
        const first = piece.contour[0];
        ctx.moveTo(first.x * fitScale + drawX, first.y * fitScale + drawY);

        for (let i = 1; i < piece.contour.length; i++) {
          const pt = piece.contour[i];
          ctx.lineTo(pt.x * fitScale + drawX, pt.y * fitScale + drawY);
        }
        ctx.closePath();

        if (isSelected) {
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.2;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        ctx.stroke();
      }

      ctx.restore();
    };

    if (correctedImageRef) {
      const img = new Image();
      img.onload = () => draw(img, correctedImageRef.width, correctedImageRef.height);
      img.src = correctedImageRef.url;
    } else if (originalImage) {
      const img = new Image();
      img.onload = () => draw(img, img.naturalWidth, img.naturalHeight);
      img.src = originalImage.src;
    }
  }, [originalImage, correctedImageRef, detectedPieces, roleOverrides, selectedPieceId, structureRoles]);

  // Handle click on canvas to select a piece
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !correctedImageRef) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const w = correctedImageRef.width;
      const h = correctedImageRef.height;
      const containerRect = container.getBoundingClientRect();
      const fitScale = Math.min(containerRect.width / w, containerRect.height / h, 1);
      const drawX = (containerRect.width - w * fitScale) / 2;
      const drawY = (containerRect.height - h * fitScale) / 2;

      // Convert click to image coordinates
      const imgX = (clickX - drawX) / fitScale;
      const imgY = (clickY - drawY) / fitScale;

      // Find the closest piece by checking if click is inside bounding rect
      let clickedPiece: DetectedPiece | null = null;
      for (const piece of detectedPieces) {
        const br = piece.boundingRect;
        if (
          imgX >= br.x &&
          imgX <= br.x + br.width &&
          imgY >= br.y &&
          imgY <= br.y + br.height
        ) {
          clickedPiece = piece;
          break;
        }
      }

      setSelectedPieceId(clickedPiece?.id ?? null);
    },
    [correctedImageRef, detectedPieces]
  );

  // Handle role override for selected piece
  const handleRoleChange = useCallback(
    (newRole: PieceRole) => {
      if (!selectedPieceId) return;

      setRoleOverrides((prev) => {
        const next = new Map(prev);
        next.set(selectedPieceId, newRole);
        return next;
      });

      // Also update the piece in the store so the role persists to import
      const updatedPieces = detectedPieces.map((p) =>
        p.id === selectedPieceId ? { ...p, role: newRole } : p
      );
      setDetectedPieces(updatedPieces);
    },
    [selectedPieceId, detectedPieces, setDetectedPieces]
  );

  // Debounced sensitivity change triggers re-scan
  const handleSensitivityChange = useCallback(
    (value: number) => {
      setLocalSensitivity(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setSensitivity(value);
        setPipelineSteps([]);
        setStep('processing');
      }, PHOTO_PATTERN_SENSITIVITY_DEBOUNCE_MS);
    },
    [setSensitivity, setPipelineSteps, setStep]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleRescan = useCallback(() => {
    setPipelineSteps([]);
    setStep('processing');
  }, [setPipelineSteps, setStep]);

  const handleAddToProject = useCallback(() => {
    setStep(quiltStructure !== null ? 'structureReview' : 'dimensions');
  }, [setStep, quiltStructure]);

  const pieceCount = detectedPieces.length;

  // Count pieces by role for the legend
  const roleCounts = new Map<PieceRole, number>();
  for (const piece of detectedPieces) {
    const role = getRoleForPiece(piece, roleOverrides, structureRoles);
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
  }

  const selectedPieceRole = selectedPieceId
    ? getRoleForPiece(
        detectedPieces.find((p) => p.id === selectedPieceId)!,
        roleOverrides,
        structureRoles
      )
    : null;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative rounded-lg border border-outline-variant/20 bg-surface-container overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onClick={handleCanvasClick}
        />
      </div>

      {/* Role legend */}
      {structureRoles && structureRoles.size > 0 && (
        <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
          {ALL_ROLES.filter((role) => (roleCounts.get(role) ?? 0) > 0).map((role) => (
            <div key={role} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: ROLE_COLORS[role] }}
              />
              <span className="text-label-sm text-secondary">
                {ROLE_LABELS[role]} ({roleCounts.get(role)})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Selected piece role override */}
      {selectedPieceId && selectedPieceRole && (
        <div className="flex items-center gap-2 flex-shrink-0 px-2 py-1.5 bg-surface-container-high rounded-lg">
          <span className="text-label-sm text-on-surface whitespace-nowrap">Piece role:</span>
          <select
            value={selectedPieceRole}
            onChange={(e) => handleRoleChange(e.target.value as PieceRole)}
            className="text-body-sm bg-transparent border border-outline-variant/30 rounded px-1.5 py-0.5 text-on-surface"
          >
            {ALL_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSelectedPieceId(null)}
            className="text-label-sm text-secondary hover:text-on-surface ml-auto"
          >
            Deselect
          </button>
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="flex items-center gap-4 flex-shrink-0 flex-wrap">
        {/* Piece count */}
        <span className="text-body-sm text-secondary whitespace-nowrap">
          {pieceCount === 0
            ? 'No pieces detected'
            : `${pieceCount} piece${pieceCount === 1 ? '' : 's'} found`}
        </span>

        {/* Sensitivity slider */}
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <label
            htmlFor="sensitivity-slider"
            className="text-label-sm text-secondary whitespace-nowrap"
          >
            Sensitivity
          </label>
          <input
            id="sensitivity-slider"
            type="range"
            min={PHOTO_PATTERN_SENSITIVITY_MIN}
            max={PHOTO_PATTERN_SENSITIVITY_MAX}
            step={0.1}
            value={localSensitivity}
            onChange={(e) => handleSensitivityChange(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-label-sm text-secondary w-8 text-right">
            {localSensitivity.toFixed(1)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRescan}
            className="px-3 py-1.5 text-body-sm text-on-surface bg-surface-container rounded-md hover:bg-surface-container-high transition-colors border border-outline-variant/20"
          >
            Re-scan
          </button>

          <button
            type="button"
            onClick={handleAddToProject}
            disabled={pieceCount === 0}
            className="btn-primary-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Project
          </button>
        </div>
      </div>

      {/* Zero pieces error */}
      {pieceCount === 0 && (
        <p className="text-body-sm text-error">
          No pieces were detected. Try adjusting the sensitivity slider or go back to correct the
          perspective.
        </p>
      )}
    </div>
  );
}
