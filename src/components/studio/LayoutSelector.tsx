'use client';

import { useCallback, useMemo } from 'react';
import { LAYOUT_PRESETS, PRESET_SVG } from '@/lib/layout-library';
import { LAYOUT_TYPE_CARDS, type LayoutTypeCard } from '@/lib/layout-type-cards';
import { useLayoutStore } from '@/stores/layoutStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useStudioDialogs } from '@/components/studio/StudioDialogs';
import { useCanvasContext } from '@/contexts/CanvasContext';
import type { LayoutType, BorderConfig } from '@/lib/layout-utils';
import { computeLayoutSize } from '@/lib/layout-size-utils';

interface LayoutSelectorProps {
  readonly onLayoutSelect?: (presetId: string) => void;
  readonly onStartOver?: () => void;
}

type CanvasLikeObject = Record<string, unknown> & {
  left?: number;
  top?: number;
  set?: (props: Record<string, unknown>) => void;
  setCoords?: () => void;
};

type LayoutCanvas = {
  getObjects: () => CanvasLikeObject[];
  remove: (...objs: unknown[]) => void;
  toJSON: () => Record<string, unknown>;
  requestRenderAll: () => void;
};

function removeBlockGroupsFromCanvas(getCanvas: () => unknown): void {
  const canvas = getCanvas();
  if (!canvas) return;
  const c = canvas as unknown as LayoutCanvas;
  const toRemove = c.getObjects().filter((obj) => obj.__isBlockGroup || obj._inFenceCellId);
  if (toRemove.length > 0) {
    const json = JSON.stringify(c.toJSON());
    useCanvasStore.getState().pushUndoState(json);
    c.remove(...toRemove);
    c.requestRenderAll();
  }
}

function isOverlayObject(obj: CanvasLikeObject): boolean {
  return (
    obj._fenceElement === true ||
    obj.name === 'overlay-ref' ||
    obj.stroke === '#E5E2DD' ||
    obj.excludeFromExport === true
  );
}

function shiftCanvasObjects(canvas: LayoutCanvas, dxPx: number, dyPx: number): void {
  canvas.getObjects().forEach((obj) => {
    if (isOverlayObject(obj)) return;
    const currentLeft = typeof obj.left === 'number' ? obj.left : null;
    const currentTop = typeof obj.top === 'number' ? obj.top : null;
    if (currentLeft === null && currentTop === null) return;

    if (obj.set) {
      obj.set({
        left: (currentLeft ?? 0) + dxPx,
        top: (currentTop ?? 0) + dyPx,
      });
    } else {
      if (currentLeft !== null) obj.left = currentLeft + dxPx;
      if (currentTop !== null) obj.top = currentTop + dyPx;
    }

    obj.setCoords?.();
  });

  canvas.requestRenderAll();
}

function getLayoutCard(layoutType: LayoutType, selectedPresetId: string | null): LayoutTypeCard | null {
  if (layoutType === 'free-form') {
    return LAYOUT_TYPE_CARDS.find((card) => card.id === 'free-form') ?? null;
  }

  if (selectedPresetId) {
    return (
      LAYOUT_TYPE_CARDS.find(
        (card) => selectedPresetId === card.defaultPresetId || selectedPresetId.startsWith(card.id)
      ) ?? null
    );
  }

  return null;
}

export function LayoutSelector({ onLayoutSelect, onStartOver }: LayoutSelectorProps) {
  const expandedCardId = useLayoutStore((s) => s.expandedCardId);
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout);
  const selectedPresetId = useLayoutStore((s) => s.selectedPresetId);
  const dialogs = useStudioDialogs();
  const { getCanvas } = useCanvasContext();

  const handleCardClick = useCallback(
    (card: LayoutTypeCard) => {
      const ls = useLayoutStore.getState();
      if (ls.expandedCardId === card.id) {
        ls.setExpandedCardId(null);
        return;
      }

      const doExpand = () => {
        removeBlockGroupsFromCanvas(getCanvas);
        const preset = LAYOUT_PRESETS.find((p) => p.id === card.defaultPresetId);
        if (preset) {
          ls.setLayoutType(preset.config.type as LayoutType);
          ls.setRows(preset.config.rows);
          ls.setCols(preset.config.cols);
          ls.setBlockSize(preset.config.blockSize);
          ls.setSashing(preset.config.sashing);
          ls.setBorders((preset.config.borders ?? []) as BorderConfig[]);
          ls.setSelectedPreset(preset.id);
          ls.setPreviewMode(true);
        }
        ls.setExpandedCardId(card.id);
      };

      const appliedTypeIsSame = ls.hasAppliedLayout && ls.selectedPresetId?.startsWith(card.id);
      if (appliedTypeIsSame) {
        doExpand();
      } else {
        dialogs.confirmChangeLayout(doExpand);
      }
    },
    [dialogs, getCanvas]
  );

  if (hasAppliedLayout) {
    return <LockedLayoutPanel onStartOver={onStartOver} />;
  }

  return (
    <div className="p-3 space-y-2">
      {LAYOUT_TYPE_CARDS.map((card) => {
        const isExpanded = expandedCardId === card.id;
        const isApplied = hasAppliedLayout && selectedPresetId?.startsWith(card.id);

        return (
          <LayoutCard
            key={card.id}
            card={card}
            isExpanded={isExpanded}
            isApplied={!!isApplied}
            onSelect={() => handleCardClick(card)}
            onLayoutSelect={onLayoutSelect}
          />
        );
      })}
    </div>
  );
}

function LockedLayoutPanel({ onStartOver }: { readonly onStartOver?: () => void }) {
  const { getCanvas } = useCanvasContext();
  const layoutType = useLayoutStore((s) => s.layoutType);
  const selectedPresetId = useLayoutStore((s) => s.selectedPresetId);
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const sashing = useLayoutStore((s) => s.sashing);
  const borders = useLayoutStore((s) => s.borders);
  const bindingWidth = useLayoutStore((s) => s.bindingWidth);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const unitSystem = useCanvasStore((s) => s.unitSystem);

  const card = useMemo(() => getLayoutCard(layoutType, selectedPresetId), [layoutType, selectedPresetId]);
  const size = useMemo(() => {
    if (layoutType === 'free-form') return null;
    return computeLayoutSize({
      type: layoutType,
      rows,
      cols,
      blockSize,
      sashingWidth: sashing.width,
      borders,
      bindingWidth,
    });
  }, [layoutType, rows, cols, blockSize, sashing.width, borders, bindingWidth]);

  const handleResizeForBorders = useCallback(
    async (mutate: () => void) => {
      const previousBorderTotal = useLayoutStore
        .getState()
        .borders.reduce((total, border) => total + border.width, 0);
      const previousWidth = useProjectStore.getState().canvasWidth;
      const previousHeight = useProjectStore.getState().canvasHeight;

      mutate();

      const layoutState = useLayoutStore.getState();
      const nextBorderTotal = layoutState.borders.reduce((total, border) => total + border.width, 0);

      let nextWidth = previousWidth;
      let nextHeight = previousHeight;

      if (layoutState.layoutType === 'free-form') {
        const delta = nextBorderTotal - previousBorderTotal;
        nextWidth = Math.max(1, previousWidth + delta * 2);
        nextHeight = Math.max(1, previousHeight + delta * 2);
      } else {
        const nextSize = computeLayoutSize({
          type: layoutState.layoutType,
          rows: layoutState.rows,
          cols: layoutState.cols,
          blockSize: layoutState.blockSize,
          sashingWidth: layoutState.sashing.width,
          borders: layoutState.borders,
          bindingWidth: layoutState.bindingWidth,
        });
        nextWidth = nextSize.width;
        nextHeight = nextSize.height;
      }

      const deltaXUnits = (nextWidth - previousWidth) / 2;
      const deltaYUnits = (nextHeight - previousHeight) / 2;
      const canvas = getCanvas();

      if (canvas && (deltaXUnits !== 0 || deltaYUnits !== 0)) {
        const { getPixelsPerUnit } = await import('@/lib/canvas-utils');
        const pixelsPerUnit = getPixelsPerUnit(unitSystem);
        const layoutCanvas = canvas as unknown as LayoutCanvas;
        useCanvasStore.getState().pushUndoState(JSON.stringify(layoutCanvas.toJSON()));
        shiftCanvasObjects(layoutCanvas, deltaXUnits * pixelsPerUnit, deltaYUnits * pixelsPerUnit);
      }

      useProjectStore.getState().setCanvasDimensions(nextWidth, nextHeight);
      useProjectStore.getState().setDirty(true);

      requestAnimationFrame(() => {
        useCanvasStore.getState().centerAndFitViewport(getCanvas(), nextWidth, nextHeight);
      });
    },
    [getCanvas, unitSystem]
  );

  const handleAddBorder = useCallback(async () => {
    await handleResizeForBorders(() => {
      useLayoutStore.getState().addBorder();
    });
  }, [handleResizeForBorders]);

  const handleRemoveBorder = useCallback(
    async (index: number) => {
      await handleResizeForBorders(() => {
        useLayoutStore.getState().removeBorder(index);
      });
    },
    [handleResizeForBorders]
  );

  const handleUpdateBorder = useCallback(
    async (index: number, width: number) => {
      await handleResizeForBorders(() => {
        useLayoutStore.getState().updateBorder(index, { width });
      });
    },
    [handleResizeForBorders]
  );

  return (
    <div className="p-3 space-y-3">
      <div className="rounded-lg border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-[var(--color-text-dim)]">Current layout</p>
            <h3 className="mt-1 text-[15px] font-semibold text-[var(--color-text)]">
              {card?.name ?? (layoutType === 'free-form' ? 'Free-form' : 'Quilt layout')}
            </h3>
            <p className="mt-1 text-[12px] leading-[18px] text-[var(--color-text-dim)]">
              {layoutType === 'free-form'
                ? 'This quilt stays open for free placement and drawing, snapped to the active grid.'
                : 'Layout choice is locked after setup so your placed blocks and fabrics stay intact.'}
            </p>
          </div>
          {onStartOver && (
            <button
              type="button"
              onClick={onStartOver}
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-dim)] transition-colors duration-150 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-text)]"
            >
              Start over
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)]/15 bg-[var(--color-bg)] p-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)]/15 bg-[var(--color-bg)] p-1">
            {card ? (
              PRESET_SVG[card.defaultPresetId] ? (
                <div
                  className="h-full w-full"
                  dangerouslySetInnerHTML={{ __html: PRESET_SVG[card.defaultPresetId] }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">{card.icon}</div>
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg">✂️</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--color-text-dim)]">Finished size</p>
            <p className="text-[15px] font-semibold text-[var(--color-text)] font-mono">
              {canvasWidth}″ × {canvasHeight}″
            </p>
          </div>
        </div>

        {layoutType !== 'free-form' && size && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-[var(--color-text-dim)]">
            <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2">
              Rows × cols: <span className="font-medium text-[var(--color-text)]">{rows} × {cols}</span>
            </div>
            <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2">
              Block size: <span className="font-medium text-[var(--color-text)]">{blockSize}″</span>
            </div>
            <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2">
              Perimeter: <span className="font-medium text-[var(--color-text)]">{size.perimeter}″</span>
            </div>
            <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2">
              Binding: <span className="font-medium text-[var(--color-text)]">{size.bindingYardage} yd</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[var(--color-border)]/15 p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[13px] font-semibold text-[var(--color-text)]">Borders</h4>
            <p className="text-[11px] leading-[18px] text-[var(--color-text-dim)]">
              Add borders around the current quilt. Existing blocks and fabrics stay centered.
            </p>
          </div>
          {borders.length < 5 && (
            <button
              type="button"
              onClick={() => void handleAddBorder()}
              className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-[12px] font-medium text-[var(--color-primary)] transition-colors duration-150 hover:bg-[var(--color-primary)]/15"
            >
              Add border
            </button>
          )}
        </div>

        {borders.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-dim)]">
            No borders added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {borders.map((border, index) => (
              <div key={border.id ?? index} className="rounded-lg bg-[var(--color-bg)] px-3 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[12px] font-medium text-[var(--color-text)]">
                    Border {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleRemoveBorder(index)}
                    className="rounded-full border border-[var(--color-accent)]/20 px-3 py-1 text-[11px] font-medium text-[var(--color-accent)] transition-colors duration-150 hover:bg-[var(--color-accent)]/10"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.5}
                    max={8}
                    step={0.5}
                    value={border.width}
                    onChange={(e) => void handleUpdateBorder(index, parseFloat(e.target.value))}
                    className="flex-1 accent-[var(--color-primary)] h-1"
                  />
                  <span className="w-12 text-right text-[11px] font-mono text-[var(--color-text)]">
                    {border.width}″
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutCard({
  card,
  isExpanded,
  isApplied,
  onSelect,
  onLayoutSelect,
}: {
  readonly card: LayoutTypeCard;
  readonly isExpanded: boolean;
  readonly isApplied: boolean;
  readonly onSelect: () => void;
  readonly onLayoutSelect?: (presetId: string) => void;
}) {
  const svgContent = PRESET_SVG[card.defaultPresetId] ?? '';

  return (
    <div
      className={`rounded-lg border-2 overflow-hidden transition-colors duration-150 ${
        isApplied
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-[0_1px_2px_rgba(26,26,26,0.08)]'
          : isExpanded
            ? 'border-[var(--color-primary)]/40 bg-[var(--color-bg)] shadow-[0_1px_2px_rgba(26,26,26,0.08)]'
            : 'border-[var(--color-border)]/20 bg-[var(--color-bg)] hover:border-[var(--color-primary)]/30 hover:shadow-[0_1px_2px_rgba(26,26,26,0.08)]'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--color-bg)]"
      >
        <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]/10 flex items-center justify-center overflow-hidden p-1">
          {svgContent ? (
            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svgContent }} />
          ) : (
            <span className="text-lg">{card.icon}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-[var(--color-text)]">{card.name}</span>
            {isApplied && (
              <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-text-dim)] leading-tight mt-0.5">
            {card.description}
          </p>
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={`flex-shrink-0 text-[var(--color-text-dim)]/50 transition-colors duration-150 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path
            d="M3 5L7 9L11 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isExpanded && card.id !== 'free-form' && (
        <LayoutConfigForm card={card} onLayoutSelect={onLayoutSelect} />
      )}

      {isExpanded && card.id === 'free-form' && (
        <FreeFormApply card={card} onLayoutSelect={onLayoutSelect} />
      )}
    </div>
  );
}

function FreeFormApply({
  card,
  onLayoutSelect,
}: {
  readonly card: LayoutTypeCard;
  readonly onLayoutSelect?: (presetId: string) => void;
}) {
  const handleApply = useCallback(() => {
    const ls = useLayoutStore.getState();
    ls.setLayoutType('free-form');
    ls.setSelectedPreset(card.defaultPresetId);
    ls.applyLayout();
    ls.setExpandedCardId(null);
    onLayoutSelect?.(card.defaultPresetId);
  }, [card.defaultPresetId, onLayoutSelect]);

  return (
    <div className="px-3 pb-3 border-t border-[var(--color-border)]/10">
      <p className="text-[11px] text-[var(--color-text-dim)] py-2">
        No layout fence — place blocks and shapes anywhere on the canvas with snap-to-grid.
      </p>
      <button
        type="button"
        onClick={handleApply}
        className="w-full rounded-full bg-[var(--color-primary)] py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-primary)] transition-colors duration-150"
      >
        Apply
      </button>
    </div>
  );
}

function LayoutConfigForm({
  card,
  onLayoutSelect,
}: {
  readonly card: LayoutTypeCard;
  readonly onLayoutSelect?: (presetId: string) => void;
}) {
  const { getCanvas } = useCanvasContext();
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const sashing = useLayoutStore((s) => s.sashing);
  const borders = useLayoutStore((s) => s.borders);
  const hasCornerstones = useLayoutStore((s) => s.hasCornerstones);
  const bindingWidth = useLayoutStore((s) => s.bindingWidth);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const selectedPresetId = useLayoutStore((s) => s.selectedPresetId);

  const setRows = useLayoutStore((s) => s.setRows);
  const setCols = useLayoutStore((s) => s.setCols);
  const setBlockSize = useLayoutStore((s) => s.setBlockSize);
  const setSashing = useLayoutStore((s) => s.setSashing);
  const setHasCornerstones = useLayoutStore((s) => s.setHasCornerstones);
  const setBindingWidth = useLayoutStore((s) => s.setBindingWidth);
  const addBorder = useLayoutStore((s) => s.addBorder);
  const updateBorder = useLayoutStore((s) => s.updateBorder);
  const removeBorder = useLayoutStore((s) => s.removeBorder);

  const size = useMemo(
    () =>
      computeLayoutSize({
        type: layoutType,
        rows,
        cols,
        blockSize,
        sashingWidth: sashing.width,
        borders,
        bindingWidth,
      }),
    [layoutType, rows, cols, blockSize, sashing.width, borders, bindingWidth]
  );

  const handleApply = useCallback(() => {
    const ls = useLayoutStore.getState();
    ls.applyLayout();
    ls.setExpandedCardId(null);
    useProjectStore.getState().setCanvasWidth(size.width);
    useProjectStore.getState().setCanvasHeight(size.height);
    requestAnimationFrame(() => {
      useCanvasStore.getState().centerAndFitViewport(getCanvas(), size.width, size.height);
    });
    onLayoutSelect?.(selectedPresetId ?? card.defaultPresetId);
  }, [size, selectedPresetId, card.defaultPresetId, onLayoutSelect, getCanvas]);

  return (
    <div className="px-3 pb-3 space-y-3 border-t border-[var(--color-border)]/10">
      <div className="pt-2">
        <h4 className="text-[11px] font-semibold text-[var(--color-text)]/70 mb-2">
          {card.icon} {card.name} Layout
        </h4>

        {card.hasGridConfig && (
          <div className="space-y-2">
            <SliderRow
              label="Rows"
              value={rows}
              min={1}
              max={20}
              step={1}
              suffix={`→ ${rows * blockSize}″`}
              onChange={setRows}
            />
            <SliderRow
              label="Cols"
              value={cols}
              min={1}
              max={20}
              step={1}
              suffix={`→ ${cols * blockSize}″`}
              onChange={setCols}
            />
            <SliderRow
              label="Block size"
              value={blockSize}
              min={2}
              max={24}
              step={0.5}
              suffix={`${blockSize}″`}
              onChange={setBlockSize}
            />
          </div>
        )}

        {card.hasSashing && (
          <div className="mt-2">
            <SliderRow
              label="Sashing"
              value={sashing.width}
              min={0.25}
              max={6}
              step={0.25}
              suffix={`${sashing.width}″`}
              onChange={(v) => setSashing({ width: v })}
            />
          </div>
        )}

        {card.hasCornerstones && (
          <div className="mt-2 rounded-lg border border-[var(--color-border)]/15 p-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasCornerstones}
                onChange={(e) => setHasCornerstones(e.target.checked)}
                className="rounded accent-[var(--color-primary)]"
              />
              <span className="text-[11px] text-[var(--color-text)]">
                Cornerstones at sashing intersections
              </span>
            </label>
          </div>
        )}

        {card.hasBorders && (
          <div className="mt-2 space-y-2 rounded-lg border border-[var(--color-border)]/15 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--color-text)]/70">Borders</span>
              {borders.length < 5 && (
                <button
                  type="button"
                  onClick={addBorder}
                  aria-label="Add border"
                  className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-[10px] font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/15"
                >
                  Add border
                </button>
              )}
            </div>

            {borders.length === 0 ? (
              <p className="text-[11px] text-[var(--color-text-dim)]">
                No borders added. Use the button above to add one.
              </p>
            ) : (
              borders.map((border: BorderConfig, i: number) => (
                <div key={border.id ?? i} className="rounded-lg bg-[var(--color-bg)] px-2 py-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span
                      id={`border-label-${i + 1}`}
                      className="text-[11px] font-medium text-[var(--color-text-dim)]"
                    >
                      Border {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBorder(i)}
                      aria-label={`Remove border ${i + 1}`}
                      className="rounded-full border border-[var(--color-accent)]/20 px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/8"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0.5}
                      max={8}
                      step={0.5}
                      value={border.width}
                      onChange={(e) => updateBorder(i, { width: parseFloat(e.target.value) })}
                      aria-labelledby={`border-label-${i + 1}`}
                      className="flex-1 accent-[var(--color-primary)] h-1"
                    />
                    <span className="w-10 text-right font-mono text-[10px] text-[var(--color-text-dim)]">
                      {border.width}″
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {card.hasBinding && (
          <div className="mt-2">
            <SliderRow
              label="Binding"
              value={bindingWidth}
              min={0}
              max={2}
              step={0.125}
              suffix={`${bindingWidth}″`}
              onChange={setBindingWidth}
            />
          </div>
        )}

        <div className="mt-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]/15 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--color-text-dim)]">Total finished size</span>
            <span className="font-semibold text-[var(--color-text)] font-mono">
              {size.width}″ × {size.height}″
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className="text-[var(--color-text-dim)]">Perimeter: {size.perimeter}″</span>
            <span className="text-[var(--color-text-dim)]">Binding: {size.bindingYardage} yd</span>
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={handleApply}
            className="w-full rounded-full bg-[var(--color-primary)] py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-primary)] transition-colors duration-150"
          >
            Use this layout
          </button>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly suffix: string;
  readonly onChange: (value: number) => void;
}) {
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-[11px] text-[var(--color-text-dim)] w-16 flex-shrink-0">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[var(--color-primary)] h-1"
      />
      <span className="text-[10px] font-mono text-[var(--color-text)]/70 w-16 text-right flex-shrink-0">
        {suffix}
      </span>
    </div>
  );
}
