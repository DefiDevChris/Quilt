'use client';

import { useCallback, useEffect, useState } from 'react';
import { LAYOUT_PRESETS, PRESET_SVG } from '@/lib/layout-library';
import { useLayoutStore } from '@/stores/layoutStore';
import { useCanvasStore, type WorktableTab } from '@/stores/canvasStore';
import type { LayoutType } from '@/lib/layout-utils';
import type { BorderConfig } from '@/lib/layout-utils';

interface LayoutSelectorProps {
  readonly onLayoutSelect?: (presetId: string) => void;
}

const CATEGORY_ORDER = ['grid', 'sashing', 'on-point'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  grid: 'Grid',
  sashing: 'Sashing',
  'on-point': 'On-Point',
};

/**
 * Layout selector shown in the ContextPanel Layouts tab.
 * Shows layout presets grouped by category with SVG thumbnails.
 * Clicking a layout:
 * - If current worktable has blocks/fabrics → creates a NEW tab
 * - If current worktable is empty → applies layout directly
 */
export function LayoutSelector({ onLayoutSelect }: LayoutSelectorProps) {
  const currentPresetId = useLayoutStore((s) => s.selectedPresetId);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = useCallback(
    (presetId: string) => {
      const preset = LAYOUT_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      const layoutStore = useLayoutStore.getState();

      // Check if current canvas has user content (blocks/fabrics)
      const hasUserContent = fabricCanvas
        ? (fabricCanvas as unknown as { getObjects: () => Array<Record<string, unknown>> })
          .getObjects()
          .some((o) => {
            const isFence = o['_fenceElement'] || o['_dragHighlight'];
            const isGrid = o.stroke === '#E5E2DD';
            return !isFence && !isGrid;
          })
        : false;

      layoutStore.setLayoutType(preset.config.type as LayoutType);
      layoutStore.setSelectedPreset(preset.id);
      layoutStore.setRows(preset.config.rows);
      layoutStore.setCols(preset.config.cols);
      layoutStore.setBlockSize(preset.config.blockSize);
      layoutStore.setSashing(preset.config.sashing);
      if (preset.config.borders) {
        layoutStore.setBorders(preset.config.borders as BorderConfig[]);
      }

      // Only create a new tab if there's existing content to preserve
      if (hasUserContent) {
        const tab: WorktableTab = {
          id: `wt-${Date.now()}`,
          name: preset.name,
          type: 'quilt',
          layoutSnapshot: {
            layoutType: preset.config.type,
            rows: preset.config.rows,
            cols: preset.config.cols,
            blockSize: preset.config.blockSize,
            sashingWidth: preset.config.sashing.width,
            hasCornerstones: false,
            borders: preset.config.borders ?? [],
            bindingWidth: 0,
            selectedPresetId: preset.id,
          },
          createdAt: Date.now(),
        };
        useCanvasStore.getState().addWorktableTab(tab);
      }

      onLayoutSelect?.(presetId);
    },
    [fabricCanvas, onLayoutSelect]
  );

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    presets: LAYOUT_PRESETS.filter((p) => p.category === cat),
  }));

  return (
    <div className="p-3 space-y-4">
      {grouped.map(({ category, label, presets }) => (
        <section key={category}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-on-surface/50 mb-2">
            {label}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => {
              const isActive = preset.id === currentPresetId;
              const isHovered = hoveredId === preset.id;
              const svgPath = PRESET_SVG[preset.id];

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelect(preset.id)}
                  onMouseEnter={() => setHoveredId(preset.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group relative flex flex-col rounded-xl border-2 transition-all duration-150 overflow-hidden ${isActive
                    ? 'border-primary bg-primary/5 shadow-elevation-1'
                    : 'border-outline-variant/20 bg-white/60 hover:border-primary/40 hover:shadow-elevation-1'
                    }`}
                  title={preset.description}
                >
                  {/* SVG thumbnail */}
                  <div className="relative aspect-[4/3] bg-white/80 overflow-hidden">
                    {svgPath ? (
                      <LayoutThumbnail src={svgPath} isActive={isActive} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary text-xs">
                        No preview
                      </div>
                    )}
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-5 h5 rounded-full bg-primary flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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

                  {/* Label */}
                  <div className="px-2 py-1.5">
                    <p
                      className={`text-[11px] font-medium truncate ${isActive ? 'text-primary' : 'text-on-surface'
                        }`}
                    >
                      {preset.name}
                    </p>
                    {isHovered && !isActive && (
                      <p className="text-[9px] text-secondary mt-0.5 line-clamp-2">
                        {preset.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Lazy-loads and renders an SVG layout thumbnail */
function LayoutThumbnail({ src, isActive }: { src: string; isActive: boolean }) {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    fetch(src)
      .then((res) => {
        if (!res.ok) return null;
        return res.text();
      })
      .then((text) => {
        if (text) setSvgContent(text);
      })
      .catch(() => {
        // Silently fail
      });
  });

  if (!svgContent) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-dashed border-outline-variant/40 rounded" />
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center p-2 transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
        }`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
