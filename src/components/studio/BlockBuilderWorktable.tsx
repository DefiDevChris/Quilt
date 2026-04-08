'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useBlockStore } from '@/stores/blockStore';
import { BlockBuilderTab } from '@/components/blocks/BlockBuilderTab';
import { BlockLibrary } from '@/components/blocks/BlockLibrary';
import { BlockBuilderFabricPicker } from '@/components/blocks/BlockBuilderFabricPicker';
import { BlockOverlaySelector } from '@/components/blocks/BlockOverlaySelector';
import { GRID_LINE_COLOR } from '@/lib/constants';
import { useBlockBuilder } from '@/hooks/useBlockBuilder';
import { findPatchAtPoint } from '@/lib/blockbuilder-utils';

/**
 * Shared props for drafting tab components.
 */
export interface DraftTabProps {
  draftCanvasRef: React.MutableRefObject<unknown>;
  isOpen: boolean;
  activeOverlay?: string | null;
  overlayOpacity?: number;
  setOverlayOpacity?: (opacity: number) => void;
  cellSizeIn?: number;
  onCellSizeInChange?: (units: number) => void;
  blockWidthIn: number;
  blockHeightIn: number;
  canvasSize: number;
  activeMode: 'pencil' | 'rectangle' | 'circle' | 'bend';
  setActiveMode: (mode: 'pencil' | 'rectangle' | 'circle' | 'bend') => void;
  segmentCount: number;
  onClear: () => void;
  onUndoSegment: () => void;
}

const DEFAULT_CELL_SIZE = 1;

interface BlockBuilderWorktableProps {
  onDone: () => void;
}

export function BlockBuilderWorktable({ onDone }: BlockBuilderWorktableProps) {
  const [blockName, setBlockName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [blockWidthIn, setBlockWidthIn] = useState(12);
  const [blockHeightIn, setBlockHeightIn] = useState(12);
  const [cellSizeIn, setCellSizeIn] = useState(DEFAULT_CELL_SIZE);
  const [showOverlaySelector, setShowOverlaySelector] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [overlayDimensions, setOverlayDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.3);
  const [rightTab, setRightTab] = useState<'blocks' | 'fabrics'>('blocks');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draftCanvasRef = useRef<unknown>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(400);

  const fetchUserBlocks = useBlockStore((s) => s.fetchUserBlocks);

  // Responsive canvas sizing
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height) - 32;
        setCanvasSize(Math.max(200, Math.min(size, 600)));
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute grid dimensions
  const gridCols = Math.max(1, Math.round(blockWidthIn / cellSizeIn));
  const gridRows = Math.max(1, Math.round(blockHeightIn / cellSizeIn));

  // Block builder hook — manages all canvas state
  const {
    activeMode,
    setActiveMode,
    segments,
    patches,
    clearSegments: hookClearSegments,
    undoSegment: hookUndoSegment,
    setPatchFill,
  } = useBlockBuilder({
    draftCanvasRef,
    isOpen: true,
    gridCols,
    gridRows,
    canvasSize,
  });

  // Initialize / dispose Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    let disposed = false;

    (async () => {
      const fabric = await import('fabric');
      if (disposed || !canvasRef.current) return;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: canvasSize,
        height: canvasSize,
        backgroundColor: '#FFFFFF',
        selection: true,
        preserveObjectStacking: true,
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize]);

  // Load overlay SVG onto canvas when activeOverlay changes
  useEffect(() => {
    if (!draftCanvasRef.current) return;

    (async () => {
      const fabric = await import('fabric');
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

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

      try {
        const res = await fetch(activeOverlay);
        if (!res.ok) return;
        const svgText = await res.text();

        fabric.loadSVGFromString(svgText, (objects, options) => {
          const objs = objects as unknown as Array<InstanceType<typeof fabric.FabricObject>> | null;
          if (!objs || objs.length === 0) return;

          const svgWidth = options.width || 300;
          const svgHeight = options.height || 300;
          const fitScale = canvasSize / Math.max(svgWidth, svgHeight);

          const scaledW = svgWidth * fitScale;
          const scaledH = svgHeight * fitScale;

          const group = new fabric.Group(objs, {
            selectable: false,
            evented: false,
            opacity: overlayOpacity,
            scaleX: fitScale,
            scaleY: fitScale,
            left: (canvasSize - scaledW) / 2,
            top: (canvasSize - scaledH) / 2,
          } as Record<string, unknown>);

          (group as unknown as { name: string }).name = 'overlay-ref';
          canvas.add(group);
          canvas.renderAll();
        });
      } catch {
        // Silently fail
      }
    })();
  }, [activeOverlay, overlayOpacity, canvasSize]);

  const handleOverlaySelect = useCallback(
    (svgPath: string, _type: 'block' | 'layout', width?: number, height?: number) => {
      setActiveOverlay(svgPath);
      setOverlayDimensions(width && height ? { width, height } : null);
      setShowOverlaySelector(false);
    },
    []
  );

  const handleClearOverlay = useCallback(() => setActiveOverlay(null), []);

  const generateThumbnailSvg = useCallback(async (): Promise<string> => {
    if (!draftCanvasRef.current) return '';
    const fabric = await import('fabric');
    const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;
    const objs = canvas.getObjects().filter((o) => {
      if (o.stroke === GRID_LINE_COLOR) return false;
      if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
      return true;
    });
    if (objs.length === 0) return '';

    const parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'];
    for (const obj of objs) parts.push(obj.toSVG());
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
      const PIXELS_PER_INCH = 96;
      const fabricJsData = {
        ...rawData,
        width: blockWidthIn * PIXELS_PER_INCH,
        height: blockHeightIn * PIXELS_PER_INCH,
        widthIn: blockWidthIn,
        heightIn: blockHeightIn,
      };
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

      setBlockName('');
      setTags('');
      setCategory('Custom');
      fetchUserBlocks();
    } catch {
      setError('Failed to save block');
    } finally {
      setSaving(false);
    }
  }, [blockName, category, tags, blockWidthIn, blockHeightIn, generateThumbnailSvg, fetchUserBlocks]);

  const handleClearCanvas = useCallback(() => {
    hookClearSegments();
    if (!draftCanvasRef.current) return;
    void import('fabric').then((f) => {
      const canvas = draftCanvasRef.current as InstanceType<typeof f.Canvas>;
      const toRemove = canvas.getObjects().filter((o) => {
        if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
        return true;
      });
      for (const obj of toRemove) canvas.remove(obj);
      canvas.renderAll();
    });
  }, [hookClearSegments]);

  const handleBlockDragStart = useCallback(
    (e: React.DragEvent, blockId: string) => {
      e.dataTransfer.setData('application/quiltcorgi+block-id', blockId);
      e.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  const handleFabricDragStart = useCallback((e: React.DragEvent, fabricId: string) => {
    e.dataTransfer.setData('application/quiltcorgi-fabric-id', fabricId);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Handle fabric drop on canvas — fill the patch under the drop point
  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');
      if (!fabricId) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const patchId = findPatchAtPoint(x, y, patches);
      if (patchId) {
        setPatchFill(patchId, fabricId);
      }
    },
    [patches, setPatchFill]
  );

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const tabProps: DraftTabProps = {
    draftCanvasRef,
    isOpen: true,
    activeOverlay,
    overlayOpacity,
    setOverlayOpacity,
    cellSizeIn,
    onCellSizeInChange: setCellSizeIn,
    blockWidthIn,
    blockHeightIn,
    canvasSize,
    activeMode,
    setActiveMode,
    segmentCount: segments.length,
    onClear: hookClearSegments,
    onUndoSegment: hookUndoSegment,
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left: Drafting tools ──────────────────────────────── */}
      <aside className="w-[240px] h-full flex-shrink-0 flex flex-col bg-surface-container/40 border-r border-outline-variant/15 overflow-y-auto">
        {/* Done button */}
        <div className="px-3 py-3 border-b border-outline-variant/15">
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-full bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            ← Back to Worktable
          </button>
        </div>

        {/* Block Builder toolbar */}
        <div className="px-3 pt-3">
          <BlockBuilderTab {...tabProps} />
        </div>

        {/* Overlay controls */}
        <div className="flex items-center gap-2 px-3 py-2 border-t border-outline-variant/15 mt-2">
          <button
            type="button"
            onClick={() => setShowOverlaySelector(true)}
            className="rounded-md bg-background px-2.5 py-1 text-[11px] font-medium text-secondary hover:text-on-surface"
          >
            {activeOverlay ? 'Change Overlay' : 'Add Overlay'}
          </button>
          {activeOverlay && (
            <>
              <button
                type="button"
                onClick={handleClearOverlay}
                className="rounded-md bg-background px-2.5 py-1 text-[11px] font-medium text-error hover:text-red-700"
              >
                Clear
              </button>
              {overlayDimensions && (
                <span className="text-[10px] text-secondary font-mono">
                  {overlayDimensions.width}&quot; × {overlayDimensions.height}&quot;
                </span>
              )}
            </>
          )}
          {activeOverlay && (
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[10px] text-secondary">Opacity</span>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-12"
              />
              <span className="text-[10px] text-secondary font-mono">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Block metadata */}
        <div className="px-3 pt-3 space-y-2 border-t border-outline-variant/15 mt-2">
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-secondary">
              Block Name *
            </label>
            <input
              type="text"
              value={blockName}
              onChange={(e) => {
                setBlockName(e.target.value);
                setError('');
              }}
              placeholder="My Custom Block"
              maxLength={255}
              className="w-full rounded-sm border border-outline-variant bg-white px-2 py-1 text-xs focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-secondary">W (in)</label>
              <input
                type="number"
                min={1}
                max={48}
                step={0.5}
                value={blockWidthIn}
                onChange={(e) => setBlockWidthIn(parseFloat(e.target.value) || 12)}
                className="w-full font-mono rounded-sm border border-outline-variant bg-white px-2 py-1 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-secondary">H (in)</label>
              <input
                type="number"
                min={1}
                max={48}
                step={0.5}
                value={blockHeightIn}
                onChange={(e) => setBlockHeightIn(parseFloat(e.target.value) || 12)}
                className="w-full font-mono rounded-sm border border-outline-variant bg-white px-2 py-1 text-xs focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-secondary">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Custom"
              maxLength={100}
              className="w-full rounded-sm border border-outline-variant bg-white px-2 py-1 text-xs focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-secondary">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="modern, stars"
              className="w-full rounded-sm border border-outline-variant bg-white px-2 py-1 text-xs focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Error + Actions */}
        <div className="px-3 py-3 mt-2 border-t border-outline-variant/15">
          {error && <p className="mb-1.5 text-[11px] text-error">{error}</p>}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('qc-block-builder-undo'))}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-secondary hover:bg-background"
              title="Undo last segment (Ctrl+Z)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6H10C12.2091 6 14 7.79086 14 10C14 12.2091 12.2091 14 10 14H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6 4L4 6L6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleClearCanvas}
              className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-secondary hover:bg-background"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-full bg-gradient-to-r from-primary to-primary-dark px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Block'}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Center: Drafting canvas ───────────────────────────── */}
      <div
        ref={canvasContainerRef}
        className="flex-1 flex items-center justify-center bg-white/60 p-4"
      >
        <div
          className="border border-outline-variant/20 bg-white shadow-elevation-1 overflow-hidden"
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          <canvas ref={canvasRef} width={canvasSize} height={canvasSize} />
        </div>
      </div>

      {/* ── Right: Blocks / Fabrics ───────────────────────────── */}
      <aside className="w-[280px] h-full flex-shrink-0 flex flex-col bg-surface border-l border-outline-variant/15 overflow-hidden">
        {/* Tab toggle */}
        <div className="flex border-b border-outline-variant/15">
          <button
            type="button"
            onClick={() => setRightTab('blocks')}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${rightTab === 'blocks'
              ? 'text-primary border-b-2 border-primary'
              : 'text-secondary hover:text-on-surface'
              }`}
          >
            My Blocks
          </button>
          <button
            type="button"
            onClick={() => setRightTab('fabrics')}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${rightTab === 'fabrics'
              ? 'text-primary border-b-2 border-primary'
              : 'text-secondary hover:text-on-surface'
              }`}
          >
            Fabrics
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {rightTab === 'blocks' ? (
            <BlockLibrary
              onBlockDragStart={handleBlockDragStart}
              onOpenDrafting={undefined}
              onOpenPhotoUpload={undefined}
            />
          ) : (
            <BlockBuilderFabricPicker onFabricDragStart={handleFabricDragStart} />
          )}
        </div>
      </aside>

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
