'use client';

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { LAYOUT_PRESETS, PRESET_SVG } from '@/lib/layout-library';
import { LAYOUT_TYPE_CARDS, type LayoutTypeCard } from '@/lib/layout-type-cards';
import { useLayoutStore } from '@/stores/layoutStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useStudioDialogs } from '@/components/studio/StudioDialogs';
import type { LayoutType, BorderConfig } from '@/lib/layout-utils';
import { computeLayoutSize, type LayoutSizeOptions } from '@/lib/layout-size-utils';
import { COLORS } from '@/lib/design-system';

interface LayoutSelectorProps {
  readonly onLayoutSelect?: (presetId: string) => void;
}

function removeBlockGroupsFromCanvas(): void {
  const canvas = useCanvasStore.getState().fabricCanvas;
  if (!canvas) return;
  const c = canvas as unknown as {
    getObjects: () => Array<Record<string, unknown>>;
    remove: (...objs: unknown[]) => void;
    toJSON: () => Record<string, unknown>;
    requestRenderAll: () => void;
  };
  const toRemove = c.getObjects().filter((obj) => obj.__isBlockGroup || obj._inFenceCellId);
  if (toRemove.length > 0) {
    const json = JSON.stringify(c.toJSON());
    useCanvasStore.getState().pushUndoState(json);
    c.remove(...toRemove);
    c.requestRenderAll();
  }
}

export function LayoutSelector({ onLayoutSelect }: LayoutSelectorProps) {
  const expandedCardId = useLayoutStore((s) => s.expandedCardId);
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout);
  const selectedPresetId = useLayoutStore((s) => s.selectedPresetId);
  const dialogs = useStudioDialogs();

  const handleCardClick = useCallback(
    (card: LayoutTypeCard) => {
      const ls = useLayoutStore.getState();
      if (ls.expandedCardId === card.id) {
        ls.setExpandedCardId(null);
        return;
      }

      const doExpand = () => {
        removeBlockGroupsFromCanvas();
        const preset = LAYOUT_PRESETS.find((p) => p.id === card.defaultPresetId);
        if (preset) {
          ls.setLayoutType(preset.config.type as LayoutType);
          ls.setRows(preset.config.rows);
          ls.setCols(preset.config.cols);
          ls.setBlockSize(preset.config.blockSize);
          ls.setSashing(preset.config.sashing);
          ls.setBorders((preset.config.borders ?? []) as BorderConfig[]);
          ls.setSelectedPreset(preset.id);
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
    [dialogs]
  );

  const handleClearLayout = useCallback(() => {
    dialogs.confirmClearLayout(() => {
      removeBlockGroupsFromCanvas();
      useLayoutStore.getState().clearLayout();
    });
  }, [dialogs]);

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

      {hasAppliedLayout && (
        <div className="pt-3 border-t border-[var(--color-border)]/20">
          <button
            type="button"
            onClick={handleClearLayout}
            className="w-full rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-4 py-2.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-accent)]/10 transition-colors duration-150"
          >
            Clear Layout
          </button>
          <p className="text-[10px] text-[var(--color-text-dim)] mt-1 text-center">
            Removes fence and placed blocks
          </p>
        </div>
      )}
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
          <p className="text-[11px] text-[var(--color-text-dim)] leading-tight mt-0.5">{card.description}</p>
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
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const sashing = useLayoutStore((s) => s.sashing);
  const borders = useLayoutStore((s) => s.borders);
  const hasCornerstones = useLayoutStore((s) => s.hasCornerstones);
  const bindingWidth = useLayoutStore((s) => s.bindingWidth);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const previewMode = useLayoutStore((s) => s.previewMode);
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

  const handlePreview = useCallback(() => {
    useLayoutStore.getState().setPreviewMode(true);
  }, []);

  const handleApply = useCallback(() => {
    const ls = useLayoutStore.getState();
    ls.applyLayout();
    ls.setExpandedCardId(null);
    useProjectStore.getState().setCanvasWidth(size.width);
    useProjectStore.getState().setCanvasHeight(size.height);
    requestAnimationFrame(() => {
      useCanvasStore.getState().centerAndFitViewport();
    });
    onLayoutSelect?.(selectedPresetId ?? card.defaultPresetId);
  }, [size, selectedPresetId, card.defaultPresetId, onLayoutSelect]);

  return (
    <div className="px-3 pb-3 space-y-3 border-t border-[var(--color-border)]/10">
      <div className="pt-2">
        <h4 className="text-[11px] font-semibold text-[var(--color-text)]/70 mb-2">
          {card.icon} {card.name} Layout
        </h4>

        {card.hasGridConfig && (
          <div className="space-y-2">
            <SliderRow label="Rows" value={rows} min={1} max={20} step={1} suffix={`\u2192 ${rows * blockSize}\u2033`} onChange={setRows} />
            <SliderRow label="Cols" value={cols} min={1} max={20} step={1} suffix={`\u2192 ${cols * blockSize}\u2033`} onChange={setCols} />
            <SliderRow label="Block size" value={blockSize} min={2} max={24} step={0.5} suffix={`${blockSize}\u2033`} onChange={setBlockSize} />
          </div>
        )}

        {card.hasSashing && (
          <div className="mt-2">
            <SliderRow label="Sashing" value={sashing.width} min={0.25} max={6} step={0.25} suffix={`${sashing.width}\u2033`} onChange={(v) => setSashing({ width: v })} />
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
          <div className="mt-2 space-y-1.5">
            {borders.map((border: BorderConfig, i: number) => (
              <div key={border.id ?? i} className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-dim)] w-12 flex-shrink-0">
                  Border {i + 1}
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={border.width}
                  onChange={(e) => updateBorder(i, { width: parseFloat(e.target.value) })}
                  className="flex-1 accent-[var(--color-primary)] h-1"
                />
                <span className="text-[10px] font-mono text-[var(--color-text-dim)] w-8 text-right">
                  {border.width}\u2033
                </span>
                <button
                  type="button"
                  onClick={() => removeBorder(i)}
                  className="text-[10px] text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 w-4"
                >
                  \u2715
                </button>
              </div>
            ))}
            {borders.length < 5 && (
              <button
                type="button"
                onClick={addBorder}
                className="text-[10px] text-[var(--color-primary)] hover:opacity-80"
              >
                + Add Border
              </button>
            )}
          </div>
        )}

        {card.hasBinding && (
          <div className="mt-2">
            <SliderRow label="Binding" value={bindingWidth} min={0} max={2} step={0.125} suffix={`${bindingWidth}\u2033`} onChange={setBindingWidth} />
          </div>
        )}

        <div className="mt-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]/15 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--color-text-dim)]">Total finished size</span>
            <span className="font-semibold text-[var(--color-text)] font-mono">
              {size.width}\u2033 \u00d7 {size.height}\u2033
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className="text-[var(--color-text-dim)]">Perimeter: {size.perimeter}\u2033</span>
            <span className="text-[var(--color-text-dim)]">Binding: {size.bindingYardage} yd</span>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewMode}
            className={`flex-1 rounded-full border py-2 text-xs font-medium transition-colors duration-150 ${
              previewMode
                ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'border-[var(--color-border)]/30 text-[var(--color-text)] hover:bg-[var(--color-bg)]'
            }`}
          >
            {previewMode ? 'Previewing\u2026' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-full bg-[var(--color-primary)] py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-primary)] transition-colors duration-150"
          >
            Apply
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
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[var(--color-text-dim)] w-16 flex-shrink-0">{label}</span>
      <input
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
