'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasStore, type BlockDraftingMode } from '@/stores/canvasStore';
import { FreeformDraftingTab } from './FreeformDraftingTab';
import { BlockBuilderTab } from './BlockBuilderTab';
import { AppliqueTab } from './AppliqueTab';
import { ImageTracingPanel } from '@/components/studio/ImageTracingPanel';
import { BlockOverlaySelector } from './BlockOverlaySelector';

export interface DraftTabProps {
  draftCanvasRef: React.MutableRefObject<unknown>;
  fillColor: string;
  strokeColor: string;
  isOpen: boolean;
  activeOverlay?: string | null;
  overlayOpacity?: number;
  setOverlayOpacity?: (opacity: number) => void;
}

interface BlockDraftingShellProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const DRAFT_CANVAS_SIZE = 400;
const BLOCK_SIZE_UNITS = 12;

const TAB_LABELS: Record<BlockDraftingMode, string> = {
  freeform: 'Freeform',
  blockbuilder: 'BlockBuilder',
  applique: 'Applique',
};

export function BlockDraftingShell({ isOpen, onClose, onSaved }: BlockDraftingShellProps) {
  const [blockName, setBlockName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showOverlaySelector, setShowOverlaySelector] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [overlayDimensions, setOverlayDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draftCanvasRef = useRef<unknown>(null);

  const activeMode = useCanvasStore((s) => s.blockDraftingMode);
  const setActiveMode = useCanvasStore((s) => s.setBlockDraftingMode);
  const fillColor = useCanvasStore((s) => s.fillColor);
  const strokeColor = useCanvasStore((s) => s.strokeColor);

  // Initialize / dispose Fabric.js canvas with grid
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    let disposed = false;

    (async () => {
      const fabric = await import('fabric');
      if (disposed || !canvasRef.current) return;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: DRAFT_CANVAS_SIZE,
        height: DRAFT_CANVAS_SIZE,
        backgroundColor: '#FFFFFF',
        selection: true,
        preserveObjectStacking: true,
      });

      // Draw grid
      const gridStep = DRAFT_CANVAS_SIZE / BLOCK_SIZE_UNITS;
      for (let i = 0; i <= BLOCK_SIZE_UNITS; i++) {
        const pos = i * gridStep;
        canvas.add(
          new fabric.Line([pos, 0, pos, DRAFT_CANVAS_SIZE], {
            stroke: '#E5E2DD',
            strokeWidth: i === 0 || i === BLOCK_SIZE_UNITS ? 2 : 0.5,
            selectable: false,
            evented: false,
          })
        );
        canvas.add(
          new fabric.Line([0, pos, DRAFT_CANVAS_SIZE, pos], {
            stroke: '#E5E2DD',
            strokeWidth: i === 0 || i === BLOCK_SIZE_UNITS ? 2 : 0.5,
            selectable: false,
            evented: false,
          })
        );
      }
      canvas.renderAll();
      draftCanvasRef.current = canvas;
    })();

    return () => {
      disposed = true;
      if (
        draftCanvasRef.current &&
        typeof (draftCanvasRef.current as { dispose?: () => void }).dispose === 'function'
      ) {
        (draftCanvasRef.current as { dispose: () => void }).dispose();
      }
      draftCanvasRef.current = null;
    };
  }, [isOpen]);

  // Load overlay SVG onto canvas when activeOverlay changes
  useEffect(() => {
    if (!draftCanvasRef.current || !isOpen) return;

    (async () => {
      const fabric = await import('fabric');
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      // Remove existing overlay objects (tagged with 'overlay-ref')
      const existing = canvas
        .getObjects()
        .filter((o) => (o as unknown as { name?: string }).name === 'overlay-ref');
      for (const obj of existing) {
        canvas.remove(obj);
      }

      if (!activeOverlay) {
        canvas.renderAll();
        return;
      }

      // Fetch and load SVG
      try {
        const res = await fetch(activeOverlay);
        if (!res.ok) return;
        const svgText = await res.text();

        fabric.loadSVGFromString(svgText, (objects, options) => {
          const objs = objects as unknown as Array<InstanceType<typeof fabric.FabricObject>> | null;
          if (!objs || objs.length === 0) return;

          const svgWidth = options.width || 300;
          const svgHeight = options.height || 300;

          // Always maintain the SVG's original aspect ratio
          const fitScale = DRAFT_CANVAS_SIZE / Math.max(svgWidth, svgHeight);
          const scaleX = fitScale;
          const scaleY = fitScale;

          const scaledW = svgWidth * scaleX;
          const scaledH = svgHeight * scaleY;

          const group = new fabric.Group(objs, {
            selectable: false,
            evented: false,
            opacity: overlayOpacity,
            scaleX,
            scaleY,
            left: (DRAFT_CANVAS_SIZE - scaledW) / 2,
            top: (DRAFT_CANVAS_SIZE - scaledH) / 2,
          } as Record<string, unknown>);

          (group as unknown as { name: string }).name = 'overlay-ref';

          canvas.add(group);
          canvas.renderAll();
        });
      } catch {
        // Silently fail — overlay is optional
      }
    })();
  }, [isOpen, activeOverlay, overlayOpacity]);

  const handleOverlaySelect = useCallback(
    (svgPath: string, _type: 'block' | 'pattern', width?: number, height?: number) => {
      setActiveOverlay(svgPath);
      if (width && height) {
        setOverlayDimensions({ width, height });
      } else {
        setOverlayDimensions(null);
      }
      setShowOverlaySelector(false);
    },
    []
  );

  const handleClearOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  const generateThumbnailSvg = useCallback(async (): Promise<string> => {
    if (!draftCanvasRef.current) return '';
    const fabric = await import('fabric');
    const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;
    const objs = canvas.getObjects().filter((o) => {
      if (o.stroke === '#E5E2DD') return false;
      if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
      return true;
    });
    if (objs.length === 0) return '';

    const parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'];
    for (const obj of objs) {
      parts.push(obj.toSVG());
    }
    parts.push('</svg>');
    return parts.join('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!blockName.trim()) {
      setError('Block name is required');
      return;
    }
    if (!draftCanvasRef.current) return;

    setSaving(true);
    setError('');

    try {
      const fabric = await import('fabric');
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      const objs = canvas.getObjects().filter((o) => {
        if (o.stroke === '#E5E2DD') return false;
        if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
        return true;
      });
      if (objs.length === 0) {
        setError('Draw at least one shape before saving');
        setSaving(false);
        return;
      }

      const clones = await Promise.all(objs.map((o) => o.clone()));
      const group = new fabric.Group(clones);
      const rawData = group.toObject() as unknown as Record<string, unknown>;
      const fabricJsData = { ...rawData, width: 100, height: 100 };

      const svgData = await generateThumbnailSvg();

      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: blockName.trim(),
          category: category.trim() || 'Custom',
          svgData,
          fabricJsData,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save block');
        setSaving(false);
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('Failed to save block');
    } finally {
      setSaving(false);
    }
  }, [blockName, category, tags, onSaved, onClose, generateThumbnailSvg]);

  if (!isOpen) return null;

  const tabProps: DraftTabProps = {
    draftCanvasRef,
    fillColor,
    strokeColor,
    isOpen,
    activeOverlay,
    overlayOpacity,
    setOverlayOpacity,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[560px] rounded-xl bg-surface p-5 shadow-elevation-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-on-surface">Draft Custom Block</h2>
          <button type="button" onClick={onClose} className="text-secondary hover:text-on-surface">
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mb-3 flex gap-1 rounded-lg bg-background p-1">
          {(Object.keys(TAB_LABELS) as BlockDraftingMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveMode(mode)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeMode === mode
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              {TAB_LABELS[mode]}
            </button>
          ))}
        </div>

        {/* Active tab toolbar */}
        {activeMode === 'freeform' && <FreeformDraftingTab {...tabProps} />}
        {activeMode === 'blockbuilder' && <BlockBuilderTab {...tabProps} />}
        {activeMode === 'applique' && <AppliqueTab {...tabProps} />}

        {/* Overlay controls */}
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOverlaySelector(true)}
            className="rounded-md bg-background px-3 py-1.5 text-xs font-medium text-secondary hover:text-on-surface"
          >
            {activeOverlay ? 'Change Overlay' : 'Add Overlay'}
          </button>
          {activeOverlay && (
            <>
              <button
                type="button"
                onClick={handleClearOverlay}
                className="rounded-md bg-background px-3 py-1.5 text-xs font-medium text-error hover:text-red-700"
              >
                Clear
              </button>
              {overlayDimensions && (
                <span className="text-[10px] text-secondary">
                  {overlayDimensions.width}" × {overlayDimensions.height}"
                </span>
              )}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-secondary">Opacity</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-16"
                />
                <span className="text-[10px] text-secondary">
                  {Math.round(overlayOpacity * 100)}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Reference Image Tracing */}
        <ImageTracingPanel />

        {/* Drafting canvas */}
        <div className="mb-4 flex justify-center rounded border border-outline-variant bg-white">
          <canvas ref={canvasRef} width={DRAFT_CANVAS_SIZE} height={DRAFT_CANVAS_SIZE} />
        </div>

        {/* Block metadata */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-secondary">Block Name *</label>
            <input
              type="text"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              placeholder="My Custom Block"
              maxLength={255}
              className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-secondary">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Custom"
              maxLength={100}
              className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-secondary">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="modern, geometric, stars"
              className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-secondary hover:bg-background"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Block'}
          </button>
        </div>
      </div>

      {/* Overlay selector modal */}
      {showOverlaySelector && (
        <BlockOverlaySelector
          onSelect={handleOverlaySelect}
          onClose={() => setShowOverlaySelector(false)}
          currentOverlay={activeOverlay}
        />
      )}
    </div>
  );
}
