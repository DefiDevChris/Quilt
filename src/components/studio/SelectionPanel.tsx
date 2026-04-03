'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useFabricPattern } from '@/hooks/useFabricPattern';
import { PIXELS_PER_INCH } from '@/lib/constants';
import { decimalToFraction, toMixedNumberString } from '@/lib/fraction-math';
import { saveRecentFabric, getRecentFabrics, type RecentFabric } from '@/lib/recent-fabrics';

// ── Types ──

interface ShapeInfo {
  readonly type: string;
  readonly widthIn: number;
  readonly heightIn: number;
  readonly rotation: number;
  readonly x: number;
  readonly y: number;
  readonly fillColor: string;
}

interface RecentColor {
  readonly hex: string;
  readonly timestamp: number;
}

// ── Constants ──

const MAX_RECENT_COLORS = 12;
const MAX_RECENT_FABRICS = 6;

const PRESET_COLORS = [
  '#D4883C',
  '#8B4513',
  '#F5DEB3',
  '#2E4057',
  '#7B3F00',
  '#A0522D',
  '#DEB887',
  '#C9B896',
  '#FFFFFF',
  '#1A1A2E',
  '#E07B67',
  '#4A7C59',
];

// ── Helpers ──

function formatDimension(inches: number): string {
  if (inches <= 0) return '0"';
  const frac = decimalToFraction(inches);
  return `${toMixedNumberString(frac)}"`;
}

function getShapeLabel(type: string): string {
  const labels: Record<string, string> = {
    rect: 'Rectangle',
    triangle: 'Triangle',
    polygon: 'Polygon',
    circle: 'Circle',
    ellipse: 'Ellipse',
    path: 'Shape',
    group: 'Group',
    line: 'Line',
    textbox: 'Text',
    image: 'Image',
  };
  return labels[type] ?? 'Shape';
}

// ── Recent colors persisted in localStorage ──

function loadRecentColors(): RecentColor[] {
  try {
    const raw = localStorage.getItem('qc_recent_colors');
    if (!raw) return [];
    return JSON.parse(raw) as RecentColor[];
  } catch {
    return [];
  }
}

function saveRecentColor(hex: string) {
  const recent = loadRecentColors().filter((c) => c.hex !== hex);
  const updated = [{ hex, timestamp: Date.now() }, ...recent].slice(0, MAX_RECENT_COLORS);
  localStorage.setItem('qc_recent_colors', JSON.stringify(updated));
  return updated;
}

// ── Recent fabrics persisted in localStorage ──
// NOTE: RecentFabric type and saveRecentFabric/getRecentFabrics are now in @/lib/recent-fabrics

function loadRecentFabrics(): RecentFabric[] {
  return getRecentFabrics();
}

// ── Shape Preview SVG ──

function ShapePreview({ shapeInfo }: { shapeInfo: ShapeInfo }) {
  const { type, widthIn, heightIn } = shapeInfo;
  const aspect = widthIn / (heightIn || 1);
  const svgW = 120;
  const svgH = svgW / (aspect || 1);
  const clampedH = Math.min(svgH, 80);
  const pad = 8;

  return (
    <svg width={svgW} height={clampedH} viewBox={`0 0 ${svgW} ${clampedH}`} className="mx-auto">
      {type === 'triangle' ? (
        <polygon
          points={`${svgW / 2},${pad} ${svgW - pad},${clampedH - pad} ${pad},${clampedH - pad}`}
          fill={shapeInfo.fillColor}
          stroke="var(--color-outline-variant)"
          strokeWidth="1.5"
        />
      ) : type === 'circle' || type === 'ellipse' ? (
        <ellipse
          cx={svgW / 2}
          cy={clampedH / 2}
          rx={(svgW - pad * 2) / 2}
          ry={(clampedH - pad * 2) / 2}
          fill={shapeInfo.fillColor}
          stroke="var(--color-outline-variant)"
          strokeWidth="1.5"
        />
      ) : (
        <rect
          x={pad}
          y={pad}
          width={svgW - pad * 2}
          height={clampedH - pad * 2}
          rx={3}
          fill={shapeInfo.fillColor}
          stroke="var(--color-outline-variant)"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}

// ── Main Component ──

export function SelectionPanel() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const fillColor = useCanvasStore((s) => s.fillColor);
  const setFillColor = useCanvasStore((s) => s.setFillColor);
  const [shapeInfo, setShapeInfo] = useState<ShapeInfo | null>(null);
  const [recentColors, setRecentColors] = useState<RecentColor[]>([]);
  const [recentFabrics, setRecentFabrics] = useState<RecentFabric[]>([]);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [customColor, setCustomColor] = useState(fillColor);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const toggleFabricPanel = useFabricStore((s) => s.togglePanel);
  const { applyFabricToObject } = useFabricPattern();

  const handleRecentFabricClick = useCallback(
    (fabric: RecentFabric) => {
      applyFabricToObject(null, fabric.imageUrl);
      const updated = saveRecentFabric({
        id: fabric.id,
        name: fabric.name,
        imageUrl: fabric.imageUrl,
      });
      setRecentFabrics(updated);
    },
    [applyFabricToObject]
  );

  // Load recent colors/fabrics on mount
  useEffect(() => {
    setRecentColors(loadRecentColors());
    setRecentFabrics(loadRecentFabrics());
  }, []);

  // Extract shape info from canvas selection
  const updateShapeInfo = useCallback(() => {
    if (!fabricCanvas) {
      setShapeInfo(null);
      return;
    }
    const canvas = fabricCanvas as {
      getActiveObject: () => {
        type: string;
        width?: number;
        height?: number;
        scaleX?: number;
        scaleY?: number;
        angle?: number;
        left?: number;
        top?: number;
        fill?: string | null;
        radius?: number;
        rx?: number;
        ry?: number;
      } | null;
    };
    const active = canvas.getActiveObject();
    if (!active) {
      setShapeInfo(null);
      return;
    }

    const scaleX = active.scaleX ?? 1;
    const scaleY = active.scaleY ?? 1;
    let rawW = (active.width ?? 0) * scaleX;
    let rawH = (active.height ?? 0) * scaleY;

    // Circle/ellipse: compute from radius
    if (active.type === 'circle' && active.radius) {
      rawW = active.radius * 2 * scaleX;
      rawH = active.radius * 2 * scaleY;
    } else if (active.type === 'ellipse') {
      rawW = (active.rx ?? 0) * 2 * scaleX;
      rawH = (active.ry ?? 0) * 2 * scaleY;
    }

    const widthIn = rawW / PIXELS_PER_INCH;
    const heightIn = rawH / PIXELS_PER_INCH;

    const currentFill = typeof active.fill === 'string' ? active.fill : fillColor;

    setShapeInfo({
      type: active.type ?? 'rect',
      widthIn,
      heightIn,
      rotation: active.angle ?? 0,
      x: active.left ?? 0,
      y: active.top ?? 0,
      fillColor: currentFill,
    });
  }, [fabricCanvas, fillColor]);

  // Listen for selection and object changes
  useEffect(() => {
    if (!fabricCanvas) return;

    const canvas = fabricCanvas as {
      on: (event: string, handler: () => void) => void;
      off: (event: string, handler: () => void) => void;
    };

    const events = [
      'selection:created',
      'selection:updated',
      'selection:cleared',
      'object:modified',
      'object:scaling',
      'object:rotating',
      'object:moving',
    ];

    events.forEach((evt) => canvas.on(evt, updateShapeInfo));
    updateShapeInfo();

    return () => {
      events.forEach((evt) => canvas.off(evt, updateShapeInfo));
    };
  }, [fabricCanvas, updateShapeInfo]);

  // Apply a color to the selected object
  const applyColor = useCallback(
    async (hex: string) => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObject();
      if (!active) return;

      const json = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(json);

      active.set({ fill: hex });
      canvas.renderAll();
      setFillColor(hex);
      useProjectStore.getState().setDirty(true);

      const updated = saveRecentColor(hex);
      setRecentColors(updated);
      setShapeInfo((prev) => (prev ? { ...prev, fillColor: hex } : null));
    },
    [fabricCanvas, setFillColor]
  );

  // Nothing selected — don't render
  if (!shapeInfo) return null;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* ── Shape Preview + Dimensions ── */}
      <div className="bg-surface-container/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-label-sm uppercase text-secondary tracking-wide font-medium">
            {getShapeLabel(shapeInfo.type)}
          </span>
          {shapeInfo.rotation !== 0 && (
            <span className="text-body-sm text-secondary">{Math.round(shapeInfo.rotation)}°</span>
          )}
        </div>

        <ShapePreview shapeInfo={shapeInfo} />

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
          <div className="flex justify-between">
            <span className="text-body-sm text-secondary">W</span>
            <span className="font-mono text-body-sm text-on-surface font-medium">
              {formatDimension(shapeInfo.widthIn)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-body-sm text-secondary">H</span>
            <span className="font-mono text-body-sm text-on-surface font-medium">
              {formatDimension(shapeInfo.heightIn)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Fill Color ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-label-sm uppercase text-secondary tracking-wide font-medium">
            Fill
          </span>
          <button
            type="button"
            onClick={() => {
              setColorPickerOpen((o) => !o);
              if (!colorPickerOpen) {
                setCustomColor(shapeInfo.fillColor);
              }
            }}
            className="text-body-sm text-primary font-medium hover:underline"
          >
            {colorPickerOpen ? 'Close' : 'Color Wheel'}
          </button>
        </div>

        {/* Current color indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-md border border-outline-variant/30"
            style={{ backgroundColor: shapeInfo.fillColor }}
          />
          <span className="font-mono text-body-sm text-secondary">
            {shapeInfo.fillColor.toUpperCase()}
          </span>
        </div>

        {/* Color picker (expanded) */}
        {colorPickerOpen && (
          <div className="mb-3 p-2 bg-surface-container/40 rounded-lg">
            <input
              ref={colorInputRef}
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-full h-28 rounded-md cursor-pointer border-0 p-0"
            />
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="flex-1 bg-surface-container rounded-md px-2 py-1.5 font-mono text-body-sm text-on-surface outline-none"
                maxLength={7}
              />
              <button
                type="button"
                onClick={() => {
                  applyColor(customColor);
                  setColorPickerOpen(false);
                }}
                className="bg-primary text-on-primary rounded-md px-3 py-1.5 text-body-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Recent colors */}
        {recentColors.length > 0 && (
          <div className="mb-2">
            <span className="text-body-sm text-secondary mb-1 block">Recent</span>
            <div className="flex gap-1.5 flex-wrap">
              {recentColors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => applyColor(c.hex)}
                  title={c.hex}
                  className={`w-7 h-7 rounded-md border transition-shadow hover:ring-2 hover:ring-primary/30 ${
                    c.hex === shapeInfo.fillColor
                      ? 'ring-2 ring-primary border-primary'
                      : 'border-outline-variant/20'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Preset swatches */}
        <div>
          <span className="text-body-sm text-secondary mb-1 block">Presets</span>
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => applyColor(hex)}
                title={hex}
                className={`w-7 h-7 rounded-md border transition-shadow hover:ring-2 hover:ring-primary/30 ${
                  hex === shapeInfo.fillColor
                    ? 'ring-2 ring-primary border-primary'
                    : 'border-outline-variant/20'
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Fabrics ── */}
      {recentFabrics.length > 0 && (
        <div>
          <span className="text-label-sm uppercase text-secondary tracking-wide font-medium mb-2 block">
            Recent Fabrics
          </span>
          <div className="flex gap-2 flex-wrap">
            {recentFabrics.map((f) => (
              <button
                key={f.id}
                type="button"
                title={f.name}
                onClick={() => handleRecentFabricClick(f)}
                className="w-12 h-12 rounded-md overflow-hidden border border-outline-variant/20 hover:ring-2 hover:ring-primary/30 transition-shadow"
              >
                <img src={f.imageUrl} alt={f.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Open Fabric Library button ── */}
      <button
        type="button"
        onClick={toggleFabricPanel}
        className="flex items-center justify-center gap-2 w-full py-2 bg-surface-container text-on-surface rounded-md text-body-sm font-medium hover:bg-surface-container-high transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect
            x="2"
            y="2"
            width="12"
            height="12"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M2 8H14M8 2V14"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="1.5 1.5"
          />
        </svg>
        Browse Fabric Library
      </button>
    </div>
  );
}
