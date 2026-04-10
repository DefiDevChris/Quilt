'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useBlockStore } from '@/stores/blockStore';
import { useCanvasStore, type ToolType } from '@/stores/canvasStore';
import { BlockLibrary } from '@/components/blocks/BlockLibrary';
import { BlockBuilderFabricPicker } from '@/components/blocks/BlockBuilderFabricPicker';
import { BlockOverlaySelector } from '@/components/blocks/BlockOverlaySelector';
import {
  BlockBuilderToolbarUnified,
  BlockBuilderCallbacks,
} from '@/components/blocks/BlockBuilderToolbarUnified';
import { GRID_LINE_COLOR } from '@/lib/constants';
import { useBlockBuilder } from '@/hooks/useBlockBuilder';
import { findPatchAtPoint } from '@/lib/blockbuilder-utils';
import { hexToRgb } from '@/lib/color-math';

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
  activeMode: BlockBuilderMode;
  setActiveMode: (mode: BlockBuilderMode) => void;
  segmentCount: number;
  onClear: () => void;
  onUndoSegment: () => void;
}

export type BlockBuilderMode = 'select' | 'pencil' | 'rectangle' | 'triangle' | 'circle' | 'bend';

const DEFAULT_CELL_SIZE = 1;
const DEFAULT_CANVAS_SIZE = 600;

interface BlockBuilderWorktableProps {
  onDone: () => void;
  /** Render only the toolbar (88px left sidebar) */
  toolbarOnly?: boolean;
  /** Render only the canvas center area */
  canvasOnly?: boolean;
  /** Render only the right panel (320px) */
  panelOnly?: boolean;
}

export function BlockBuilderWorktable({
  onDone,
  toolbarOnly,
  canvasOnly,
  panelOnly,
}: BlockBuilderWorktableProps) {
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
  const [activeMode, setActiveMode] = useState<BlockBuilderMode>('select');

  // Auto-generate block name when user blocks are fetched
  const userBlocks = useBlockStore((s) => s.userBlocks);
  useEffect(() => {
    if (!blockName) {
      setBlockName(`Custom Block ${userBlocks.length + 1}`);
    }
    // Only run once on mount — eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draftCanvasRef = useRef<unknown>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasSize = DEFAULT_CANVAS_SIZE;

  const fetchUserBlocks = useBlockStore((s) => s.fetchUserBlocks);

  // Map BlockBuilderMode to ToolType for canvasStore compatibility
  const modeToToolType: Record<BlockBuilderMode, ToolType> = {
    select: 'select',
    pencil: 'easydraw',
    rectangle: 'rectangle',
    triangle: 'triangle',
    circle: 'circle',
    bend: 'bend',
  };

  // Sync activeMode to canvasStore so ToolIcon isActive works
  useEffect(() => {
    useCanvasStore.getState().setActiveTool(modeToToolType[activeMode]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode]);

  // Compute grid dimensions
  const gridCols = Math.max(1, Math.round(blockWidthIn / cellSizeIn));
  const gridRows = Math.max(1, Math.round(blockHeightIn / cellSizeIn));

  // Block builder hook — manages all canvas state
  const {
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
    activeMode,
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
    if (!draftCanvasRef.current) return;

    setSaving(true);
    setError('');

    try {
      const fabric = await import('fabric');
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      const objs = canvas.getObjects().filter((o) => {
        if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
        // Filter out grid lines — they are visual-only, not part of the block
        if ((o as unknown as { _isGridLine?: boolean })._isGridLine) return false;
        return true;
      });
      if (objs.length === 0) {
        setError('Draw at least one shape before saving');
        setSaving(false);
        return;
      }

      // Tag each object with patch metadata before cloning.
      // Seam lines (Line type) get __pieceRole='seam'; fillable shapes
      // get __pieceRole='patch' with shade derived from fill luminance.
      let patchIdx = 0;
      for (const o of objs) {
        const meta = o as unknown as Record<string, unknown>;
        meta.__blockPatchIndex = patchIdx++;

        const objType = (o as unknown as { type: string }).type;
        if (objType === 'Line' || objType === 'line') {
          meta.__pieceRole = 'seam';
        } else {
          meta.__pieceRole = 'patch';
          const fillStr = (o as unknown as { fill?: unknown }).fill;
          if (typeof fillStr === 'string' && fillStr.startsWith('#')) {
            const rgb = hexToRgb(fillStr);
            // Relative luminance: 0 = black, 255 = white
            const lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
            meta.__shade = lum < 100 ? 'dark' : lum < 200 ? 'light' : 'background';
          } else {
            meta.__shade = 'unknown';
          }
        }
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

      // Auto-name if empty
      const finalName = blockName.trim() || `Custom Block ${userBlocks.length + 1}`;

      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
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

      // Reset form with next auto-generated name
      setBlockName(`Custom Block ${userBlocks.length + 2}`);
      setTags('');
      setCategory('Custom');
      fetchUserBlocks();
    } catch {
      setError('Failed to save block');
    } finally {
      setSaving(false);
    }
  }, [
    blockName,
    category,
    tags,
    blockWidthIn,
    blockHeightIn,
    generateThumbnailSvg,
    fetchUserBlocks,
    userBlocks.length,
  ]);

  const handleClearCanvas = useCallback(async () => {
    hookClearSegments();
    if (!draftCanvasRef.current) return;
    const fabric = await import('fabric');
    const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;
    const toRemove = canvas.getObjects().filter((o) => {
      if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
      return true;
    });
    for (const obj of toRemove) canvas.remove(obj);
    canvas.renderAll();
  }, [hookClearSegments]);

  const handleBlockDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    e.dataTransfer.setData('application/quiltcorgi+block-id', blockId);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

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

  // ── Toolbar callbacks ───────────────────────────────────────
  const toolbarCallbacks: BlockBuilderCallbacks = {
    onModeChange: setActiveMode,
    onUndo: hookUndoSegment,
    onRedo: () => {
      /* redo not implemented in useBlockBuilder */
    },
    onClear: handleClearCanvas,
    canUndo: segments.length > 0,
    canRedo: false,
  };

  // ── Grid unit slider helpers ────────────────────────────────
  const sliderValue = Math.round(cellSizeIn / 0.25);
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) * 0.25;
    setCellSizeIn(val);
  };

  // ── Render: toolbar only ────────────────────────────────────
  if (toolbarOnly) {
    return (
      <aside className="w-[88px] h-full flex-shrink-0 flex flex-col bg-[#fdfaf7] border-r border-[#e8e1da]/15 overflow-y-auto">
        {/* Grid unit slider */}
        <div className="px-2 pt-3 pb-2 border-b border-[#e8e1da]/15">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-[#6b655e]">Grid</span>
            <span className="text-[9px] font-mono text-[#6b655e] bg-[#fdfaf7] py-0.5 px-1 rounded">
              {cellSizeIn < 1 ? `${cellSizeIn * 16}"` : `${cellSizeIn}"`}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full accent-[#ff8d49] h-1"
          />
        </div>

        {/* Unified toolbar */}
        <BlockBuilderToolbarUnified callbacks={toolbarCallbacks} segmentCount={segments.length} />
      </aside>
    );
  }

  // ── Render: canvas only ────────────────────────────────────
  if (canvasOnly) {
    return (
      <div
        ref={canvasContainerRef}
        className="flex-1 flex items-center justify-center bg-[#fdfaf7]/20 overflow-hidden"
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasDragOver}
      >
        <div className="border border-[#e8e1da]/20 bg-[#ffffff] shadow">
          <canvas ref={canvasRef} width={canvasSize} height={canvasSize} tabIndex={0} />
        </div>
      </div>
    );
  }

  // ── Render: panel only ────────────────────────────────────
  if (panelOnly) {
    return (
      <aside className="w-[320px] h-full flex-shrink-0 flex flex-col bg-[#fdfaf7] border-l border-[#e8e1da]/15 overflow-hidden">
        {/* Tab toggle */}
        <div className="flex border-b border-[#e8e1da]/15">
          <button
            type="button"
            onClick={() => setRightTab('blocks')}
            className={`flex-1 py-2.5 text-xs font-semibold  transition-colors ${
              rightTab === 'blocks'
                ? 'text-[#ff8d49] border-b-2 border-[#ff8d49]'
                : 'text-[#6b655e] hover:text-[#2d2a26]'
            }`}
          >
            My Blocks
          </button>
          <button
            type="button"
            onClick={() => setRightTab('fabrics')}
            className={`flex-1 py-2.5 text-xs font-semibold  transition-colors ${
              rightTab === 'fabrics'
                ? 'text-[#ff8d49] border-b-2 border-[#ff8d49]'
                : 'text-[#6b655e] hover:text-[#2d2a26]'
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

        {/* Block metadata + Save */}
        <div className="border-t border-[#e8e1da]/15 px-3 py-3 space-y-2">
          {error && <p className="text-[11px] text-[#ffc7c7]">{error}</p>}

          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-[#6b655e]">
              Block Name
            </label>
            <input
              type="text"
              value={blockName}
              onChange={(e) => {
                setBlockName(e.target.value);
                setError('');
              }}
              placeholder="Custom Block 1"
              maxLength={255}
              className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-2 py-1 text-xs focus:border-[#ff8d49] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#6b655e]">
            <span>Dimensions:</span>
            <span className="font-mono text-[#2d2a26]/70">
              {blockWidthIn}″ × {blockHeightIn}″
            </span>
            <span className="text-[#6b655e]/60">(from grid unit)</span>
          </div>

          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-[#6b655e]">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Custom"
              maxLength={100}
              className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-2 py-1 text-xs focus:border-[#ff8d49] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-[#6b655e]">
              Tags <span className="text-[#6b655e]/50">(optional)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="modern, stars"
              className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-2 py-1 text-xs focus:border-[#ff8d49] focus:outline-none"
            />
          </div>

          {/* Overlay controls */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#e8e1da]/15">
            <button
              type="button"
              onClick={() => setShowOverlaySelector(true)}
              className="rounded-lg bg-[#fdfaf7] px-2.5 py-1 text-[11px] font-medium text-[#6b655e] hover:text-[#2d2a26]"
            >
              {activeOverlay ? 'Change Overlay' : 'Add Overlay'}
            </button>
            {activeOverlay && (
              <>
                <button
                  type="button"
                  onClick={handleClearOverlay}
                  className="rounded-lg bg-[#fdfaf7] px-2.5 py-1 text-[11px] font-medium text-[#ffc7c7] hover:text-[#ffc7c7]/80"
                >
                  Clear
                </button>
                {overlayDimensions && (
                  <span className="text-[10px] text-[#6b655e] font-mono">
                    {overlayDimensions.width}&quot; × {overlayDimensions.height}&quot;
                  </span>
                )}
              </>
            )}
            {activeOverlay && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] text-[#6b655e]">Opacity</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-12"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-[#ff8d49] py-2.5 text-[13px] font-semibold text-[#2d2a26] hover:bg-[#e67d3f] transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
          >
            {saving ? 'Saving…' : 'Save Block'}
          </button>
        </div>
      </aside>
    );
  }

  // ── Render: full layout (fallback, should not be used) ─────
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left: Toolbar (88px, unified) ──────────────────── */}
      <aside className="w-[88px] h-full flex-shrink-0 flex flex-col bg-[#fdfaf7] border-r border-[#e8e1da]/15 overflow-y-auto">
        {/* Grid unit slider */}
        <div className="px-2 pt-3 pb-2 border-b border-[#e8e1da]/15">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-[#6b655e]">Grid</span>
            <span className="text-[9px] font-mono text-[#6b655e] bg-[#fdfaf7] py-0.5 px-1 rounded">
              {cellSizeIn < 1 ? `${cellSizeIn * 16}"` : `${cellSizeIn}"`}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full accent-[#ff8d49] h-1"
          />
        </div>

        {/* Unified toolbar */}
        <BlockBuilderToolbarUnified callbacks={toolbarCallbacks} segmentCount={segments.length} />
      </aside>

      {/* ── Center: Canvas (unified styling) ────────────────── */}
      <div
        ref={canvasContainerRef}
        className="flex-1 flex items-center justify-center bg-[#fdfaf7]/20 overflow-hidden"
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasDragOver}
      >
        <div className="border border-[#e8e1da]/20 bg-[#ffffff] shadow">
          <canvas ref={canvasRef} width={canvasSize} height={canvasSize} tabIndex={0} />
        </div>
      </div>

      {/* ── Right: Panel (320px, unified) ──────────────────── */}
      <aside className="w-[320px] h-full flex-shrink-0 flex flex-col bg-[#fdfaf7] border-l border-[#e8e1da]/15 overflow-hidden">
        {/* Tab toggle */}
        <div className="flex border-b border-[#e8e1da]/15">
          <button
            type="button"
            onClick={() => setRightTab('blocks')}
            className={`flex-1 py-2.5 text-xs font-semibold  transition-colors ${
              rightTab === 'blocks'
                ? 'text-[#ff8d49] border-b-2 border-[#ff8d49]'
                : 'text-[#6b655e] hover:text-[#2d2a26]'
            }`}
          >
            My Blocks
          </button>
          <button
            type="button"
            onClick={() => setRightTab('fabrics')}
            className={`flex-1 py-2.5 text-xs font-semibold  transition-colors ${
              rightTab === 'fabrics'
                ? 'text-[#ff8d49] border-b-2 border-[#ff8d49]'
                : 'text-[#6b655e] hover:text-[#2d2a26]'
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

        {/* Block metadata + Save */}
        <div className="border-t border-[#e8e1da]/15 px-3 py-3 space-y-2">
          {error && <p className="text-[11px] text-[#ffc7c7]">{error}</p>}

          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-[#6b655e]">
              Block Name
            </label>
            <input
              type="text"
              value={blockName}
              onChange={(e) => {
                setBlockName(e.target.value);
                setError('');
              }}
              placeholder="Custom Block 1"
              maxLength={255}
              className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-2 py-1 text-xs focus:border-[#ff8d49] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#6b655e]">
            <span>Dimensions:</span>
            <span className="font-mono text-[#2d2a26]/70">
              {blockWidthIn}″ × {blockHeightIn}″
            </span>
            <span className="text-[#6b655e]/60">(from grid unit)</span>
          </div>

          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-[#6b655e]">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Custom"
              maxLength={100}
              className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-2 py-1 text-xs focus:border-[#ff8d49] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-[#6b655e]">
              Tags <span className="text-[#6b655e]/50">(optional)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="modern, stars"
              className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-2 py-1 text-xs focus:border-[#ff8d49] focus:outline-none"
            />
          </div>

          {/* Overlay controls */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#e8e1da]/15">
            <button
              type="button"
              onClick={() => setShowOverlaySelector(true)}
              className="rounded-lg bg-[#fdfaf7] px-2.5 py-1 text-[11px] font-medium text-[#6b655e] hover:text-[#2d2a26]"
            >
              {activeOverlay ? 'Change Overlay' : 'Add Overlay'}
            </button>
            {activeOverlay && (
              <>
                <button
                  type="button"
                  onClick={handleClearOverlay}
                  className="rounded-lg bg-[#fdfaf7] px-2.5 py-1 text-[11px] font-medium text-[#ffc7c7] hover:text-[#ffc7c7]/80"
                >
                  Clear
                </button>
                {overlayDimensions && (
                  <span className="text-[10px] text-[#6b655e] font-mono">
                    {overlayDimensions.width}&quot; × {overlayDimensions.height}&quot;
                  </span>
                )}
              </>
            )}
            {activeOverlay && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] text-[#6b655e]">Opacity</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-12"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-[#ff8d49] py-2.5 text-[13px] font-semibold text-[#2d2a26] hover:bg-[#e67d3f] transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
          >
            {saving ? 'Saving…' : 'Save Block'}
          </button>
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
