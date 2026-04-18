'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useBlockStore } from '@/stores/blockStore';
import { useAuthDerived } from '@/stores/authStore';
import { useCanvasStore, type ToolType } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { ArrowLeft } from 'lucide-react';
import { BlockLibrary } from '@/components/blocks/BlockLibrary';
import { BlockBuilderFabricPicker } from '@/components/blocks/BlockBuilderFabricPicker';
import { BlockOverlaySelector } from '@/components/blocks/BlockOverlaySelector';
import {
  BlockBuilderToolbarUnified,
  BlockBuilderCallbacks,
} from '@/components/blocks/BlockBuilderToolbarUnified';
import { CANVAS, COLORS } from '@/lib/design-system';
import { useBlockBuilder } from '@/hooks/useBlockBuilder';
import { findPatchAtPoint } from '@/lib/blockbuilder-utils';
import { hexToRgb } from '@/lib/color-math';
import { useToast } from '@/components/ui/ToastProvider';

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
const DEFAULT_BLOCK_SIZE = 12;

export function BlockBuilderWorktable() {
  const [blockName, setBlockName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const blockWidthIn = DEFAULT_BLOCK_SIZE;
  const blockHeightIn = DEFAULT_BLOCK_SIZE;
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
  const [publishToLibrary, setPublishToLibrary] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuthDerived();
  const projectName = useProjectStore((s) => s.projectName);

  const handleBackToQuilt = useCallback(() => {
    useCanvasStore.getState().setActiveWorktable('quilt');
  }, []);

  // Escape key returns to quilt so users can't feel trapped in the builder.
  // Ignored when focus is inside a form control so it doesn't interrupt typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }
      handleBackToQuilt();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleBackToQuilt]);

  const blocks = useBlockStore((s) => s.blocks);
  const userBlocks = useBlockStore((s) => s.userBlocks);
  const allBlockCount = blocks.length + userBlocks.length;
  useEffect(() => {
    if (!blockName) {
      setBlockName(`Block ${allBlockCount + 1}`);
    }
  }, [blockName, allBlockCount]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draftCanvasRef = useRef<unknown>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasSize = DEFAULT_CANVAS_SIZE;

  const fetchBlocks = useBlockStore((s) => s.fetchBlocks);
  const fetchUserBlocks = useBlockStore((s) => s.fetchUserBlocks);
  const setSelectedBlockId = useBlockStore((s) => s.setSelectedBlockId);

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
        backgroundColor: COLORS.surface,
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

  const handleClearOverlay = useCallback(() => {
    setActiveOverlay(null);
    setOverlayDimensions(null);
  }, []);

  const generateThumbnailSvg = useCallback(async (): Promise<string> => {
    if (!draftCanvasRef.current) return '';
    const fabric = await import('fabric');
    const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;
    const objs = canvas.getObjects().filter((o) => {
      if (o.stroke === CANVAS.gridLine) return false;
      if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
      return true;
    });
    if (objs.length === 0) return '';

    const parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'];
    for (const obj of objs) parts.push(obj.toSVG());
    parts.push('</svg>');
    return parts.join('');
  }, []);

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

  const resetDraft = useCallback(
    async ({ preserveSelectedBlock = false }: { preserveSelectedBlock?: boolean } = {}) => {
      await handleClearCanvas();
      setError('');
      setBlockName('');
      setCategory('Custom');
      setTags('');
      setCellSizeIn(DEFAULT_CELL_SIZE);
      setActiveMode('select');
      setRightTab('blocks');
      setActiveOverlay(null);
      setOverlayDimensions(null);
      setOverlayOpacity(0.3);
      if (!preserveSelectedBlock) {
        setSelectedBlockId(null);
      }
    },
    [handleClearCanvas, setSelectedBlockId]
  );

  const handleSave = useCallback(async () => {
    if (!draftCanvasRef.current) return;

    setSaving(true);
    setError('');

    try {
      const fabric = await import('fabric');
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      const objs = canvas.getObjects().filter((o) => {
        if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
        if ((o as unknown as { _isGridLine?: boolean })._isGridLine) return false;
        return true;
      });
      if (objs.length === 0) {
        setError('Draw at least one shape before saving');
        setSaving(false);
        return;
      }

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
      const finalName = blockName.trim() || `Block ${blocks.length + 1}`;

      const willPublish = isAdmin && publishToLibrary;

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
          publishToLibrary: willPublish,
          widthIn: blockWidthIn,
          heightIn: blockHeightIn,
        }),
      });

      const data = (await res.json()) as { error?: string; data?: { id?: string } };

      if (!res.ok) {
        setError(data.error ?? 'Failed to save block');
        setSaving(false);
        return;
      }

      setError('');
      if (willPublish) {
        await fetchBlocks();
      } else {
        await fetchUserBlocks();
      }
      if (data.data?.id) {
        setSelectedBlockId(data.data.id);
      }
      await resetDraft({ preserveSelectedBlock: Boolean(data.data?.id) });
      toast({
        type: 'success',
        title: willPublish ? 'Published to Library' : 'Saved to My Blocks',
        description: willPublish
          ? `${finalName} is now available to everyone.`
          : `${finalName} has been saved to your blocks.`,
      });
    } catch {
      setError('Failed to save block');
    } finally {
      setSaving(false);
    }
  }, [
    blockName,
    blocks.length,
    category,
    tags,
    blockWidthIn,
    blockHeightIn,
    fetchBlocks,
    fetchUserBlocks,
    generateThumbnailSvg,
    isAdmin,
    publishToLibrary,
    resetDraft,
    setSelectedBlockId,
    toast,
  ]);

  const handleDeleteBlock = useCallback(async () => {
    await resetDraft();
    toast({
      type: 'success',
      title: 'Block cleared',
      description: 'The builder is ready for a new block.',
    });
  }, [resetDraft, toast]);

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

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Context header — prominent back button + location pill ── */}
      <div className="flex items-center gap-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]/20 px-4 py-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleBackToQuilt}
          className="flex items-center gap-1.5 rounded-full h-10 px-4 text-[14px] font-semibold bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[#d97054] transition-colors shadow-[0_1px_2px_rgba(26,26,26,0.08)]"
          aria-label="Return to quilt canvas"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Back to Quilt
        </button>
        <span
          className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-bg)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/70"
          title={`Building a block for ${projectName || 'Untitled project'}`}
        >
          <span className="text-[var(--color-text-dim)]">Designing a block for </span>
          <span className="font-semibold text-[var(--color-text)]">
            {projectName || 'Untitled project'}
          </span>
        </span>
        <span className="ml-auto text-[11px] text-[var(--color-text-dim)]">
          Press{' '}
          <kbd className="rounded bg-[var(--color-bg)] border border-[var(--color-border)]/40 px-1.5 py-0.5 font-mono text-[10px]">
            Esc
          </kbd>{' '}
          to return
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left: Toolbar (88px, unified) ──────────────────── */}
        <aside className="w-[88px] h-full flex-shrink-0 flex flex-col bg-[var(--color-bg)] border-r border-[var(--color-border)]/15 overflow-y-auto">
          {/* Grid unit slider */}
          <div className="px-2 pt-3 pb-2 border-b border-[var(--color-border)]/15">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-[var(--color-text-dim)]">Grid</span>
              <span className="text-[9px] font-mono text-[var(--color-text-dim)] bg-[var(--color-bg)] py-0.5 px-1 rounded">
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
              className="w-full accent-[var(--color-primary)] h-1"
            />
          </div>

          {/* Unified toolbar */}
          <BlockBuilderToolbarUnified callbacks={toolbarCallbacks} segmentCount={segments.length} />
        </aside>

        {/* ── Center: Canvas (unified styling) ────────────────── */}
        <div
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,196,176,0.22),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(250,249,247,0.9))] p-8"
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-[13px] font-semibold text-[var(--color-text)]">
                Square block workspace
              </p>
              <p className="text-[12px] text-[var(--color-text-dim)]">
                Draft a block here, then save it to your collection.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-surface)] p-3 shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
              <canvas ref={canvasRef} width={canvasSize} height={canvasSize} tabIndex={0} />
            </div>
          </div>
        </div>

        {/* ── Right: Panel (320px, unified) ──────────────────── */}
        <aside className="w-[320px] h-full flex-shrink-0 flex flex-col bg-[var(--color-bg)] border-l border-[var(--color-border)]/15 overflow-hidden">
          {/* Tab toggle */}
          <div className="flex border-b border-[var(--color-border)]/15">
            <button
              type="button"
              onClick={() => setRightTab('blocks')}
              className={`flex-1 py-2.5 text-xs font-semibold  transition-colors ${
                rightTab === 'blocks'
                  ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => setRightTab('fabrics')}
              className={`flex-1 py-2.5 text-xs font-semibold  transition-colors ${
                rightTab === 'fabrics'
                  ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
            >
              Fabrics
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {rightTab === 'blocks' ? (
              <BlockLibrary onBlockDragStart={handleBlockDragStart} />
            ) : (
              <BlockBuilderFabricPicker onFabricDragStart={handleFabricDragStart} />
            )}
          </div>

          <div className="border-t border-[var(--color-border)]/15 px-3 py-3 space-y-2">
            <div className="rounded-lg border border-[var(--color-border)]/15 bg-[var(--color-bg)] px-3 py-2">
              <p className="text-[11px] font-semibold text-[var(--color-text)]">
                {isAdmin && publishToLibrary ? 'Publish to Block Library' : 'Save to My Blocks'}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-[var(--color-text-dim)]">
                {isAdmin && publishToLibrary
                  ? 'Block will be published to the shared library and available to everyone.'
                  : 'Block will be saved to your personal collection.'}
              </p>
            </div>

            {isAdmin && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={publishToLibrary}
                  onChange={(e) => setPublishToLibrary(e.target.checked)}
                  className="accent-[var(--color-primary)] h-3.5 w-3.5"
                />
                <span className="text-[11px] text-[var(--color-text-dim)]">
                  Publish to shared library
                </span>
              </label>
            )}

            {error && <p className="text-[11px] text-[var(--color-accent)]">{error}</p>}

            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-[var(--color-text-dim)]">
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
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-dim)]">
              <span>Dimensions:</span>
              <span className="font-mono text-[var(--color-text)]/70">
                {blockWidthIn}″ × {blockHeightIn}″
              </span>
              <span className="text-[var(--color-text-dim)]/60">(from grid unit)</span>
            </div>

            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-[var(--color-text-dim)]">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Custom"
                maxLength={100}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-[var(--color-text-dim)]">
                Tags <span className="text-[var(--color-text-dim)]/50">(optional)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="modern, stars"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            {/* Overlay controls */}
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border)]/15">
              <button
                type="button"
                onClick={() => setShowOverlaySelector(true)}
                className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
              >
                {activeOverlay ? 'Change Overlay' : 'Add Overlay'}
              </button>
              {activeOverlay && (
                <>
                  <button
                    type="button"
                    onClick={handleClearOverlay}
                    className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80"
                  >
                    Clear
                  </button>
                  {overlayDimensions && (
                    <span className="text-[10px] text-[var(--color-text-dim)] font-mono">
                      {overlayDimensions.width}&quot; × {overlayDimensions.height}&quot;
                    </span>
                  )}
                </>
              )}
              {activeOverlay && (
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-[10px] text-[var(--color-text-dim)]">Opacity</span>
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteBlock}
                disabled={saving}
                className="flex-1 rounded-full border-2 border-[var(--color-accent)]/70 px-4 py-2.5 text-[13px] font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-accent)]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete Block
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-full bg-[var(--color-primary)] py-2.5 text-[14px] font-semibold text-[var(--color-text)] transition-colors duration-150 hover:bg-[#d97054] disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_1px_2px_rgba(26,26,26,0.08)]"
              >
                {saving ? 'Saving…' : isAdmin && publishToLibrary ? 'Publish Block' : 'Save Block'}
              </button>
            </div>
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
    </div>
  );
}
