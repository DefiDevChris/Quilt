'use client';

import { useAppliqueDraw } from '@/hooks/useAppliqueDraw';
import type { DraftTabProps } from './BlockDraftingShell';
import type { ShapeType } from '@/lib/applique-utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_SIZE = 400;

const SHAPE_PALETTE: { type: ShapeType; label: string; icon: string }[] = [
  { type: 'circle', label: 'Circle', icon: '\u25CF' },
  { type: 'oval', label: 'Oval', icon: '\u2B2D' },
  { type: 'heart', label: 'Heart', icon: '\u2665' },
  { type: 'leaf', label: 'Leaf', icon: '\u{1F342}' },
  { type: 'teardrop', label: 'Teardrop', icon: '\u{1F4A7}' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ShapePaletteProps {
  onAddShape: (type: ShapeType) => void;
}

function ShapePalette({ onAddShape }: ShapePaletteProps) {
  return (
    <div className="mb-2 flex items-center gap-1">
      <span className="mr-1 text-xs font-medium text-secondary">Shapes:</span>
      {SHAPE_PALETTE.map((shape) => (
        <button
          key={shape.type}
          type="button"
          onClick={() => onAddShape(shape.type)}
          title={`Add ${shape.label}`}
          className="flex h-8 w-8 items-center justify-center rounded text-sm text-secondary hover:bg-background hover:text-on-surface"
        >
          {shape.icon}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface LayerRowProps {
  id: string;
  shapeType: string;
  fill: string;
  isBackground: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveForward: () => void;
  onMoveBackward: () => void;
  onRemove: () => void;
  onFillChange: (fill: string) => void;
}

function layerIcon(shapeType: string): string {
  switch (shapeType) {
    case 'circle':
      return '\u25CF';
    case 'oval':
      return '\u2B2D';
    case 'heart':
      return '\u2665';
    case 'leaf':
      return '\u{1F342}';
    case 'teardrop':
      return '\u{1F4A7}';
    default:
      return '\u25A0';
  }
}

function layerLabel(shapeType: string, isBackground: boolean): string {
  if (isBackground) return 'Background';
  switch (shapeType) {
    case 'circle':
      return 'Circle';
    case 'oval':
      return 'Oval';
    case 'heart':
      return 'Heart';
    case 'leaf':
      return 'Leaf';
    case 'teardrop':
      return 'Teardrop';
    default:
      return 'Shape';
  }
}

function LayerRow({
  id,
  shapeType,
  fill,
  isBackground,
  isFirst,
  isLast,
  onMoveForward,
  onMoveBackward,
  onRemove,
  onFillChange,
}: LayerRowProps) {
  return (
    <div
      className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-background"
      data-layer-id={id}
    >
      {/* Shape icon */}
      <span className="w-5 text-center text-xs">{layerIcon(shapeType)}</span>

      {/* Name */}
      <span className="flex-1 truncate text-on-surface">
        {layerLabel(shapeType, isBackground)}
      </span>

      {/* Color swatch / picker */}
      <label className="relative flex h-5 w-5 cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-outline-variant">
        <span
          className="absolute inset-0"
          style={{ backgroundColor: fill }}
        />
        <input
          type="color"
          value={fill}
          onChange={(e) => onFillChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          title="Change fill color"
        />
      </label>

      {/* Z-order buttons */}
      <button
        type="button"
        onClick={onMoveForward}
        disabled={isLast || isBackground}
        title="Move forward"
        className="flex h-6 w-6 items-center justify-center rounded text-xs text-secondary hover:bg-surface disabled:opacity-30"
      >
        {'\u2191'}
      </button>
      <button
        type="button"
        onClick={onMoveBackward}
        disabled={isFirst || isBackground}
        title="Move backward"
        className="flex h-6 w-6 items-center justify-center rounded text-xs text-secondary hover:bg-surface disabled:opacity-30"
      >
        {'\u2193'}
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={onRemove}
        disabled={isBackground}
        title={isBackground ? 'Background cannot be deleted' : 'Delete layer'}
        className="flex h-6 w-6 items-center justify-center rounded text-xs text-secondary hover:bg-surface hover:text-error disabled:opacity-30"
      >
        {'\u2715'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface LayerPanelProps {
  layers: readonly import('@/lib/applique-utils').AppliqueLayer[];
  onMoveForward: (id: string) => void;
  onMoveBackward: (id: string) => void;
  onRemove: (id: string) => void;
  onFillChange: (id: string, fill: string) => void;
}

function LayerPanel({
  layers,
  onMoveForward,
  onMoveBackward,
  onRemove,
  onFillChange,
}: LayerPanelProps) {
  // Display layers in reverse z-order (top-most first)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);
  const maxZIndex = sortedLayers.length > 0 ? sortedLayers[0].zIndex : 0;

  return (
    <div className="mb-2">
      <span className="mb-1 block text-xs font-medium text-secondary">Layers</span>
      <div className="max-h-36 overflow-y-auto rounded border border-outline-variant bg-white">
        {sortedLayers.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-secondary">No layers yet</p>
        )}
        {sortedLayers.map((layer) => {
          const isBackground = layer.id === 'background';
          // "first" in z-order means lowest non-background
          const isFirst = !isBackground && layer.zIndex <= 1;
          const isLast = !isBackground && layer.zIndex === maxZIndex;

          return (
            <LayerRow
              key={layer.id}
              id={layer.id}
              shapeType={layer.shapeType}
              fill={layer.fill}
              isBackground={isBackground}
              isFirst={isFirst}
              isLast={isLast}
              onMoveForward={() => onMoveForward(layer.id)}
              onMoveBackward={() => onMoveBackward(layer.id)}
              onRemove={() => onRemove(layer.id)}
              onFillChange={(fill) => onFillChange(layer.id, fill)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AppliqueTab({
  draftCanvasRef,
  fillColor,
  strokeColor,
  isOpen,
}: DraftTabProps) {
  const {
    layers,
    addShape,
    moveForward,
    moveBackward,
    removeLayer,
    setLayerFill,
  } = useAppliqueDraw({
    draftCanvasRef,
    isOpen,
    fillColor,
    strokeColor,
    canvasSize: CANVAS_SIZE,
  });

  return (
    <div>
      <ShapePalette onAddShape={addShape} />
      <LayerPanel
        layers={layers}
        onMoveForward={moveForward}
        onMoveBackward={moveBackward}
        onRemove={removeLayer}
        onFillChange={setLayerFill}
      />
    </div>
  );
}
