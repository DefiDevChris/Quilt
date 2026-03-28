'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { applyFrame, frameToSvgPath, type FrameStyle, type Point2D } from '@/lib/frame-engine';

interface FrameToolProps {
  isOpen: boolean;
  onClose: () => void;
}

const FRAME_STYLES: Array<{ id: FrameStyle; label: string; icon: string }> = [
  { id: 'simple-border', label: 'Simple Border', icon: '⬜' },
  { id: 'double-border', label: 'Double Border', icon: '⬛' },
  { id: 'sawtooth', label: 'Sawtooth', icon: '🔺' },
  { id: 'flying-geese', label: 'Flying Geese', icon: '🔻' },
  { id: 'piano-keys', label: 'Piano Keys', icon: '🎹' },
  { id: 'cornerstone', label: 'Cornerstone', icon: '💎' },
];

const CORNER_TREATMENTS = [
  { id: 'mitered', label: 'Mitered' },
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
] as const;

function extractBlockGeometry(obj: any): Point2D[][] {
  if (obj.type === 'polygon' && Array.isArray(obj.points)) {
    return [obj.points.map((p: any) => ({ x: p.x + (obj.left ?? 0), y: p.y + (obj.top ?? 0) }))];
  }
  if (obj.type === 'rect') {
    const l = obj.left ?? 0;
    const t = obj.top ?? 0;
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    return [[{ x: l, y: t }, { x: l + w, y: t }, { x: l + w, y: t + h }, { x: l, y: t + h }]];
  }
  if (obj.type === 'triangle') {
    const l = obj.left ?? 0;
    const t = obj.top ?? 0;
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    return [[{ x: l + w / 2, y: t }, { x: l + w, y: t + h }, { x: l, y: t + h }]];
  }
  if (obj.type === 'path' || obj.type === 'group') {
    const bounds = obj.getBoundingRect?.() ?? { left: 0, top: 0, width: 100, height: 100 };
    return [[
      { x: bounds.left, y: bounds.top },
      { x: bounds.left + bounds.width, y: bounds.top },
      { x: bounds.left + bounds.width, y: bounds.top + bounds.height },
      { x: bounds.left, y: bounds.top + bounds.height },
    ]];
  }
  return [];
}

export function FrameTool({ isOpen, onClose }: FrameToolProps) {
  const [selectedStyle, setSelectedStyle] = useState<FrameStyle>('simple-border');
  const [frameWidth, setFrameWidth] = useState(1.0);
  const [frameColor, setFrameColor] = useState('#8d4f00');
  const [cornerTreatment, setCornerTreatment] = useState<'mitered' | 'square' | 'rounded'>(
    'mitered'
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [previewSvg, setPreviewSvg] = useState<string>('');

  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const canvasObjects = useMemo(() => {
    if (!fabricCanvas) return [];
    const canvas = fabricCanvas as unknown as {
      getObjects: () => Array<{ type: string; id?: string; blockName?: string }>;
    };
    return canvas
      .getObjects()
      .filter((obj) =>
        ['polygon', 'rect', 'path', 'group', 'circle', 'triangle'].includes(obj.type)
      )
      .map((obj, i) => ({
        id: (obj as any).id ?? `block-${i}`,
        label: (obj as any).blockName ?? `${obj.type} ${i + 1}`,
      }));
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas || !selectedBlockId) {
      setPreviewSvg('');
      return;
    }
    const objects = (
      fabricCanvas as unknown as { getObjects: () => any[] }
    ).getObjects();
    const sourceObj = objects.find(
      (obj: any) =>
        (obj.id ?? '') === selectedBlockId ||
        objects.indexOf(obj).toString() === selectedBlockId
    );
    if (!sourceObj) {
      setPreviewSvg('');
      return;
    }

    const blockGeometry = extractBlockGeometry(sourceObj);
    if (blockGeometry.length === 0) {
      setPreviewSvg('');
      return;
    }

    const result = applyFrame(blockGeometry, {
      style: selectedStyle,
      width: frameWidth,
      color: frameColor,
      cornerTreatment,
    });
    const bbox = result.boundingBox;
    const margin = frameWidth * 96;
    const w = bbox.width + margin * 2;
    const h = bbox.height + margin * 2;

    let paths = '';
    for (const frameGeo of result.frameGeometry) {
      paths += `<path d="${frameToSvgPath(frameGeo)}" fill="${frameGeo.color ?? frameColor}" stroke="#000" stroke-width="0.5"/>`;
    }
    // Also draw the original block
    for (const blockPath of blockGeometry) {
      if (blockPath.length < 2) continue;
      const d = `M ${blockPath.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`;
      paths += `<path d="${d}" fill="#F5DEB3" stroke="#000" stroke-width="0.5"/>`;
    }

    setPreviewSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x - margin} ${bbox.y - margin} ${w} ${h}">${paths}</svg>`
    );
  }, [fabricCanvas, selectedBlockId, selectedStyle, frameWidth, frameColor, cornerTreatment]);

  const handleApplyFrame = useCallback(async () => {
    if (!fabricCanvas || !selectedBlockId) return;

    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

    const objects = canvas.getObjects();
    const sourceObj = objects.find(
      (obj: any) =>
        (obj.id ?? '') === selectedBlockId ||
        objects.indexOf(obj).toString() === selectedBlockId
    );
    if (!sourceObj) return;

    // Extract geometry from the source object
    const blockGeometry = extractBlockGeometry(sourceObj);
    if (blockGeometry.length === 0) return;

    // Apply frame using engine
    const result = applyFrame(blockGeometry, {
      style: selectedStyle,
      width: frameWidth,
      color: frameColor,
      cornerTreatment,
    });

    // Create Fabric.js polygons for frame geometry
    for (const frameGeo of result.frameGeometry) {
      for (const path of frameGeo.paths) {
        if (path.length < 3) continue;
        const polygon = new fabric.Polygon(
          path.map((p) => ({ x: p.x, y: p.y })),
          {
            fill: frameGeo.color ?? frameColor,
            stroke: '#000000',
            strokeWidth: 0.5,
            selectable: true,
          }
        );
        canvas.add(polygon);
      }
    }

    canvas.renderAll();
    const json = JSON.stringify(canvas.toJSON());
    useCanvasStore.getState().pushUndoState(json);
    useProjectStore.getState().setDirty(true);

    onClose();
  }, [fabricCanvas, selectedBlockId, selectedStyle, frameWidth, frameColor, cornerTreatment, onClose]);

  const handleSaveToLibrary = useCallback(async () => {
    if (!fabricCanvas || !selectedBlockId) return;

    const objects = (
      fabricCanvas as unknown as { getObjects: () => any[] }
    ).getObjects();
    const sourceObj = objects.find(
      (obj: any) =>
        (obj.id ?? '') === selectedBlockId ||
        objects.indexOf(obj).toString() === selectedBlockId
    );
    if (!sourceObj) return;

    const blockGeometry = extractBlockGeometry(sourceObj);
    if (blockGeometry.length === 0) return;

    const result = applyFrame(blockGeometry, {
      style: selectedStyle,
      width: frameWidth,
      color: frameColor,
      cornerTreatment,
    });

    // Build SVG
    const bbox = result.boundingBox;
    const margin = frameWidth * 96; // approximate px
    const svgWidth = bbox.width + margin * 2;
    const svgHeight = bbox.height + margin * 2;

    let svgPaths = '';
    for (const frameGeo of result.frameGeometry) {
      const pathStr = frameToSvgPath(frameGeo);
      svgPaths += `<path d="${pathStr}" fill="${frameGeo.color ?? frameColor}" stroke="#000" stroke-width="0.5"/>`;
    }

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x - margin} ${bbox.y - margin} ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">${svgPaths}</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `framed-block-${selectedStyle}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fabricCanvas, selectedBlockId, selectedStyle, frameWidth, frameColor, cornerTreatment]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h2 className="text-xl font-semibold text-on-surface">Frame Generator</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close frame tool"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Block Selection */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Select Block</label>
            <select
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose a block...</option>
              {canvasObjects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.label}
                </option>
              ))}
            </select>
          </div>

          {/* Frame Style Selection */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-3">Frame Style</label>
            <div className="grid grid-cols-2 gap-3">
              {FRAME_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selectedStyle === style.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant text-on-surface hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{style.icon}</span>
                    <span className="text-sm font-medium">{style.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Frame Width */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Frame Width: {frameWidth}&quot;
            </label>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.25"
              value={frameWidth}
              onChange={(e) => setFrameWidth(parseFloat(e.target.value))}
              className="w-full h-2 bg-outline-variant rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>0.25&quot;</span>
              <span>3&quot;</span>
            </div>
          </div>

          {/* Frame Color */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Frame Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={frameColor}
                onChange={(e) => setFrameColor(e.target.value)}
                className="w-12 h-12 border border-outline-variant rounded cursor-pointer"
              />
              <input
                type="text"
                value={frameColor}
                onChange={(e) => setFrameColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-outline-variant rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="#8d4f00"
              />
            </div>
          </div>

          {/* Corner Treatment */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Corner Treatment
            </label>
            <div className="flex gap-2">
              {CORNER_TREATMENTS.map((treatment) => (
                <button
                  key={treatment.id}
                  onClick={() => setCornerTreatment(treatment.id)}
                  className={`px-4 py-2 border rounded-md text-sm transition-colors ${
                    cornerTreatment === treatment.id
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant text-on-surface hover:border-primary/50'
                  }`}
                >
                  {treatment.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Preview</label>
            <div className="border border-outline-variant rounded-lg p-4 bg-surface-variant/20 min-h-[200px] flex items-center justify-center">
              {previewSvg ? (
                <div className="w-full h-48" dangerouslySetInnerHTML={{ __html: previewSvg }} />
              ) : (
                <div className="text-on-surface-variant text-sm">
                  {selectedBlockId
                    ? `${selectedStyle} frame preview`
                    : 'Select a block to see preview'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-outline-variant/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveToLibrary}
            disabled={!selectedBlockId}
            className="px-4 py-2 border border-outline-variant text-on-surface rounded-md hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save to Library
          </button>
          <button
            onClick={handleApplyFrame}
            disabled={!selectedBlockId}
            className="px-4 py-2 bg-primary text-on-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
