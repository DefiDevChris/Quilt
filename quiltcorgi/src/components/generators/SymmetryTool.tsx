'use client';

import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useToast } from '@/components/ui/ToastProvider';
import {
  computeActiveZone,
  filterObjectsInZone,
  applySymmetry,
  SYMMETRY_TYPE_LABELS,
  RADIAL_FOLD_MIN,
  RADIAL_FOLD_MAX,
  type SymmetryType,
  type SymmetryConfig,
  type SerializedObject,
} from '@/lib/symmetry-engine';

interface SymmetryToolProps {
  isOpen: boolean;
  onClose: () => void;
}

const SYMMETRY_OPTIONS: Array<{ id: SymmetryType; icon: string }> = [
  { id: 'mirror-x', icon: '↔' },
  { id: 'mirror-y', icon: '↕' },
  { id: 'mirror-both', icon: '⊞' },
  { id: 'diagonal', icon: '⟋' },
  { id: 'radial', icon: '✺' },
];

export function SymmetryTool({ isOpen, onClose }: SymmetryToolProps) {
  const [symmetryType, setSymmetryType] = useState<SymmetryType>('mirror-both');
  const [foldCount, setFoldCount] = useState(4);
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  const handleApply = useCallback(async () => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (!canvas) return;

    setIsApplying(true);

    try {
      const fabric = await import('fabric');
      const fabricCanvas = canvas as InstanceType<typeof fabric.Canvas>;

      // Get canvas dimensions from the quilt area
      const canvasWidth = fabricCanvas.getWidth();
      const canvasHeight = fabricCanvas.getHeight();

      const config: SymmetryConfig = {
        type: symmetryType,
        foldCount,
        canvasWidth,
        canvasHeight,
      };

      // Compute the active zone
      const zone = computeActiveZone(config);

      // Collect all user objects (non-layout, non-grid elements)
      const allObjects = fabricCanvas.getObjects();
      const userObjects: SerializedObject[] = [];

      for (const obj of allObjects) {
        // Skip layout elements and non-selectable objects
        if ((obj as unknown as Record<string, unknown>)._layoutElement || !obj.selectable) {
          continue;
        }

        const serialized = obj.toObject() as SerializedObject;
        serialized.left = obj.left ?? 0;
        serialized.top = obj.top ?? 0;
        serialized.width = obj.width ?? 0;
        serialized.height = obj.height ?? 0;
        serialized.scaleX = obj.scaleX ?? 1;
        serialized.scaleY = obj.scaleY ?? 1;
        serialized.angle = obj.angle ?? 0;
        userObjects.push(serialized);
      }

      // Filter to objects in the active zone
      const zoneObjects = filterObjectsInZone(userObjects, zone);

      if (zoneObjects.length === 0) {
        setIsApplying(false);
        return;
      }

      // Push undo state BEFORE applying symmetry (single undo step)
      const currentJson = JSON.stringify(fabricCanvas.toJSON());
      useCanvasStore.getState().pushUndoState(currentJson);

      // Apply symmetry transformations
      const result = applySymmetry(zoneObjects, config);

      // Add new objects to the canvas
      for (const newObj of result.newObjects) {
        const fabricObj = await createFabricObject(fabric, newObj);
        if (fabricObj) {
          fabricCanvas.add(fabricObj);
        }
      }

      fabricCanvas.requestRenderAll();
      onClose();
    } catch {
      toast({
        type: 'error',
        title: 'Symmetry failed',
        description: 'Something went wrong applying symmetry. Please try again.',
      });
    } finally {
      setIsApplying(false);
    }
  }, [symmetryType, foldCount, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-md rounded-xl bg-surface shadow-elevation-3 p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Auto-Complete Symmetry</h2>

        <p className="text-xs text-secondary mb-4">
          Design in the active zone, then apply symmetry to auto-complete the rest of the canvas.
        </p>

        {/* Symmetry Type Selection */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-medium text-secondary uppercase tracking-wider">
            Symmetry Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SYMMETRY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSymmetryType(opt.id)}
                className={`rounded-lg border-2 p-3 text-left transition-colors ${
                  symmetryType === opt.id
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant hover:border-primary-container'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{opt.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-on-surface">
                      {SYMMETRY_TYPE_LABELS[opt.id]}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Radial fold count (only shown for radial type) */}
        {symmetryType === 'radial' && (
          <div className="mb-6">
            <label
              htmlFor="fold-count"
              className="block text-xs font-medium text-secondary uppercase tracking-wider mb-2"
            >
              Fold Count: {foldCount}
            </label>
            <input
              id="fold-count"
              type="range"
              min={RADIAL_FOLD_MIN}
              max={RADIAL_FOLD_MAX}
              step={1}
              value={foldCount}
              onChange={(e) => setFoldCount(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-secondary mt-1">
              <span>{RADIAL_FOLD_MIN}</span>
              <span>{RADIAL_FOLD_MAX}</span>
            </div>
          </div>
        )}

        {/* Active Zone Preview */}
        <ActiveZonePreview symmetryType={symmetryType} foldCount={foldCount} />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-outline-variant px-4 py-2 text-sm text-secondary hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isApplying ? 'Applying...' : 'Apply Symmetry'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * SVG preview showing the active zone highlighted on a canvas outline.
 */
function ActiveZonePreview({
  symmetryType,
  foldCount,
}: {
  symmetryType: SymmetryType;
  foldCount: number;
}) {
  const previewSize = 200;
  const config: SymmetryConfig = {
    type: symmetryType,
    foldCount,
    canvasWidth: previewSize,
    canvasHeight: previewSize,
  };

  const zone = computeActiveZone(config);

  // Build SVG path for the zone
  const pathPoints = zone.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathD = pathPoints ? `${pathPoints} Z` : '';

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-secondary mb-2">
        Active Zone: <span className="font-medium text-on-surface">{zone.label}</span>
      </div>
      <svg
        width={previewSize}
        height={previewSize}
        viewBox={`0 0 ${previewSize} ${previewSize}`}
        className="border border-outline-variant rounded-lg"
      >
        {/* Canvas background */}
        <rect x={0} y={0} width={previewSize} height={previewSize} fill="#FAF8F5" />
        {/* Active zone highlight */}
        {pathD && (
          <path
            d={pathD}
            fill="#D4883C"
            fillOpacity={0.15}
            stroke="#D4883C"
            strokeWidth={2}
            strokeDasharray="6 3"
          />
        )}
        {/* Center crosshair */}
        <line
          x1={previewSize / 2}
          y1={0}
          x2={previewSize / 2}
          y2={previewSize}
          stroke="#E5E2DD"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <line
          x1={0}
          y1={previewSize / 2}
          x2={previewSize}
          y2={previewSize / 2}
          stroke="#E5E2DD"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
}

/**
 * Create a Fabric.js object from serialized data.
 * Handles Rect, Polygon, Path, Circle, and Group types.
 */
async function createFabricObject(
  fabric: typeof import('fabric'),
  data: SerializedObject
): Promise<InstanceType<typeof fabric.FabricObject> | null> {
  const type = data.type as string;

  try {
    switch (type) {
      case 'Rect':
      case 'rect': {
        return new fabric.Rect({
          left: data.left,
          top: data.top,
          width: data.width,
          height: data.height,
          scaleX: data.scaleX,
          scaleY: data.scaleY,
          angle: data.angle,
          fill: (data.fill as string) ?? '#D4883C',
          stroke: (data.stroke as string) ?? '#2D2D2D',
          strokeWidth: (data.strokeWidth as number) ?? 1,
          flipX: (data.flipX as boolean) ?? false,
          flipY: (data.flipY as boolean) ?? false,
        });
      }

      case 'Polygon':
      case 'polygon': {
        const points = data.points as Array<{ x: number; y: number }> | undefined;
        if (!points) return null;
        return new fabric.Polygon(points, {
          left: data.left,
          top: data.top,
          scaleX: data.scaleX,
          scaleY: data.scaleY,
          angle: data.angle,
          fill: (data.fill as string) ?? '#D4883C',
          stroke: (data.stroke as string) ?? '#2D2D2D',
          strokeWidth: (data.strokeWidth as number) ?? 1,
          flipX: (data.flipX as boolean) ?? false,
          flipY: (data.flipY as boolean) ?? false,
        });
      }

      case 'Path':
      case 'path': {
        const pathData = data.path as string | undefined;
        if (!pathData) return null;
        return new fabric.Path(pathData, {
          left: data.left,
          top: data.top,
          scaleX: data.scaleX,
          scaleY: data.scaleY,
          angle: data.angle,
          fill: (data.fill as string) ?? '#D4883C',
          stroke: (data.stroke as string) ?? '#2D2D2D',
          strokeWidth: (data.strokeWidth as number) ?? 1,
          flipX: (data.flipX as boolean) ?? false,
          flipY: (data.flipY as boolean) ?? false,
        });
      }

      case 'Circle':
      case 'circle': {
        return new fabric.Circle({
          left: data.left,
          top: data.top,
          radius: (data.radius as number) ?? 0,
          scaleX: data.scaleX,
          scaleY: data.scaleY,
          angle: data.angle,
          fill: (data.fill as string) ?? '#D4883C',
          stroke: (data.stroke as string) ?? '#2D2D2D',
          strokeWidth: (data.strokeWidth as number) ?? 1,
          flipX: (data.flipX as boolean) ?? false,
          flipY: (data.flipY as boolean) ?? false,
        });
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}
