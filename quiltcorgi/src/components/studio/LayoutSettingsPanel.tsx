'use client';

import { useLayoutStore } from '@/stores/layoutStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { getUnitLabel } from '@/lib/canvas-utils';
import type { LayoutType } from '@/lib/layout-utils';

interface LayoutSettingsPanelProps {
  onClose: () => void;
}

const LAYOUT_OPTIONS: Array<{ id: LayoutType; label: string; desc: string }> = [
  { id: 'free-form', label: 'Free-Form', desc: 'No forced layout, snap-to-grid only' },
  { id: 'grid', label: 'Grid', desc: 'Rows x columns of evenly spaced blocks' },
  { id: 'sashing', label: 'Sashing', desc: 'Grid with configurable strips between blocks' },
  { id: 'on-point', label: 'On-Point', desc: '45-degree rotation with setting triangles' },
];

export function LayoutSettingsPanel({ onClose }: LayoutSettingsPanelProps) {
  const layoutType = useLayoutStore((s) => s.layoutType);
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const sashing = useLayoutStore((s) => s.sashing);
  const borders = useLayoutStore((s) => s.borders);
  const setLayoutType = useLayoutStore((s) => s.setLayoutType);
  const setRows = useLayoutStore((s) => s.setRows);
  const setCols = useLayoutStore((s) => s.setCols);
  const setBlockSize = useLayoutStore((s) => s.setBlockSize);
  const setSashing = useLayoutStore((s) => s.setSashing);
  const addBorder = useLayoutStore((s) => s.addBorder);
  const updateBorder = useLayoutStore((s) => s.updateBorder);
  const removeBorder = useLayoutStore((s) => s.removeBorder);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const unit = getUnitLabel(unitSystem);

  const showGridControls = layoutType !== 'free-form';
  const showSashingControls = layoutType === 'sashing';
  const showBorderControls = layoutType !== 'free-form';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-md rounded-xl bg-surface shadow-elevation-3 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Layout Settings</h2>

        {/* Layout Type Selection */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-medium text-secondary uppercase tracking-wider">
            Layout Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLayoutType(opt.id)}
                className={`rounded-lg border-2 p-3 text-left transition-colors ${
                  layoutType === opt.id
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant hover:border-primary-container'
                }`}
              >
                <div className="text-sm font-medium text-on-surface">{opt.label}</div>
                <div className="text-[10px] text-secondary mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Grid Controls (shown for grid, sashing, on-point) */}
        {showGridControls && (
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="layout-rows" className="block text-xs text-secondary mb-1">
                  Rows
                </label>
                <input
                  id="layout-rows"
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={rows}
                  onChange={(e) => setRows(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="layout-cols" className="block text-xs text-secondary mb-1">
                  Columns
                </label>
                <input
                  id="layout-cols"
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={cols}
                  onChange={(e) => setCols(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="layout-block-size" className="block text-xs text-secondary mb-1">
                Block Size ({unit})
              </label>
              <input
                id="layout-block-size"
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={blockSize}
                onChange={(e) => setBlockSize(parseFloat(e.target.value) || 6)}
                className="w-24 rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        )}

        {/* Sashing Controls */}
        {showSashingControls && (
          <div className="space-y-4 mb-6">
            <div className="border-t border-outline-variant pt-4">
              <label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-3">
                Sashing
              </label>
              <div className="flex gap-4">
                <div>
                  <label htmlFor="sashing-width" className="block text-xs text-secondary mb-1">
                    Width ({unit})
                  </label>
                  <input
                    id="sashing-width"
                    type="number"
                    min={0.25}
                    max={6}
                    step={0.25}
                    value={sashing.width}
                    onChange={(e) =>
                      setSashing({
                        width: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-24 rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label htmlFor="sashing-color" className="block text-xs text-secondary mb-1">
                    Color
                  </label>
                  <input
                    id="sashing-color"
                    type="color"
                    value={sashing.color}
                    onChange={(e) => setSashing({ color: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded-sm border border-outline-variant"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Border Controls */}
        {showBorderControls && (
          <div className="space-y-3 mb-6">
            <div className="border-t border-outline-variant pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-medium text-secondary uppercase tracking-wider">
                  Borders
                </label>
                {borders.length < 5 && (
                  <button
                    type="button"
                    onClick={addBorder}
                    className="text-xs text-primary hover:underline"
                  >
                    + Add Border
                  </button>
                )}
              </div>

              {borders.length === 0 && (
                <p className="text-xs text-secondary">
                  No borders added. Click &quot;+ Add Border&quot; to add one.
                </p>
              )}

              {borders.map((border, i) => (
                <div
                  key={border.id ?? i}
                  className="flex items-end gap-3 mb-2 rounded-lg border border-outline-variant p-2"
                >
                  <div>
                    <label
                      htmlFor={`border-width-${i}`}
                      className="block text-[10px] text-secondary mb-0.5"
                    >
                      Width ({unit})
                    </label>
                    <input
                      id={`border-width-${i}`}
                      type="number"
                      min={0.5}
                      max={12}
                      step={0.5}
                      value={border.width}
                      onChange={(e) =>
                        updateBorder(i, {
                          width: parseFloat(e.target.value) || 2,
                        })
                      }
                      className="w-20 rounded-sm border border-outline-variant bg-surface px-2 py-1 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`border-color-${i}`}
                      className="block text-[10px] text-secondary mb-0.5"
                    >
                      Color
                    </label>
                    <input
                      id={`border-color-${i}`}
                      type="color"
                      value={border.color}
                      onChange={(e) => updateBorder(i, { color: e.target.value })}
                      className="h-8 w-10 cursor-pointer rounded-sm border border-outline-variant"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBorder(i)}
                    title="Remove border"
                    className="mb-0.5 text-sm text-error hover:text-error/80"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layout Info */}
        {layoutType === 'on-point' && (
          <div className="rounded-lg bg-background/50 border border-outline-variant p-3 mb-6">
            <p className="text-xs text-secondary">
              On-Point rotates blocks 45 degrees. Setting triangles fill the edges to create a
              rectangular quilt shape.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
