'use client';

import { useCallback, useState } from 'react';
import { useDesignerStore } from '@/stores/designerStore';
import { COLORS } from '@/lib/design-system';
import { X, Plus } from 'lucide-react';

/** Neutral solid fabrics for quick-apply sashing/borders. */
const QUICK_APPLY_FABRICS: Array<{ id: string; name: string; hex: string }> = [
  { id: 'qa-white', name: 'White', hex: COLORS.surface },
  { id: 'qa-cream', name: 'Cream', hex: '#F5F0E8' },
  { id: 'qa-light-gray', name: 'Light Gray', hex: '#D0D0D0' },
  { id: 'qa-med-gray', name: 'Medium Gray', hex: '#B0B0B0' },
  { id: 'qa-black', name: 'Black', hex: '#333333' },
  { id: 'qa-navy', name: 'Navy', hex: '#2C3E50' },
];

const MAX_BORDERS = 3;

interface FabricDropZoneProps {
  role: 'sashing' | 'border';
  borderIndex?: number;
  fabricId: string | null;
  fabricUrl: string | null;
  onFabricDragOver: (e: React.DragEvent) => void;
  onFabricDrop: (e: React.DragEvent) => void;
  onFabricDragLeave: (e: React.DragEvent) => void;
}

function FabricDropZone({
  role,
  borderIndex,
  fabricId,
  fabricUrl,
  onFabricDragOver,
  onFabricDrop,
  onFabricDragLeave,
}: FabricDropZoneProps) {
  const label =
    role === 'sashing'
      ? 'Sashing Fabric'
      : `Border ${borderIndex !== undefined ? borderIndex + 1 : ''} Fabric`;

  return (
    <div className="space-y-1.5">
      <label className="text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)]">
        {label}
      </label>
      <div
        role="button"
        tabIndex={0}
        draggable={false}
        onDragOver={onFabricDragOver}
        onDrop={onFabricDrop}
        onDragLeave={onFabricDragLeave}
        className={`w-full h-16 rounded-lg border-2 transition-colors duration-150 flex items-center justify-center text-sm ${
          fabricUrl || fabricId
            ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5'
            : 'border-dashed border-[var(--color-border)] text-[var(--color-text-dim)]'
        }`}
        title="Drop fabric from library here"
      >
        {fabricUrl || fabricId ? (
          <div className="flex items-center gap-2">
            {fabricUrl ? (
              <img
                src={fabricUrl}
                alt={fabricId || 'fabric'}
                className="w-10 h-10 rounded-full object-cover border border-[var(--color-border)]"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full border border-[var(--color-border)]"
                style={{ backgroundColor: fabricId ?? '#fff' }}
              />
            )}
            <span className="text-xs text-[var(--color-text)] truncate max-w-[100px]">
              {fabricId}
            </span>
          </div>
        ) : (
          'Drop fabric here'
        )}
      </div>
    </div>
  );
}

interface SashingBorderPanelProps {
  onFabricDragStart?: (e: React.DragEvent, fabricId: string) => void;
  onFabricDragOver?: (e: React.DragEvent) => void;
  onFabricDrop?: (e: React.DragEvent) => void;
  onFabricDragLeave?: (e: React.DragEvent) => void;
}

export function SashingBorderPanel({
  onFabricDragStart,
  onFabricDragOver,
  onFabricDrop,
  onFabricDragLeave,
}: SashingBorderPanelProps) {
  const sashingWidth = useDesignerStore((s) => s.sashingWidth);
  const sashingFabricId = useDesignerStore((s) => s.sashingFabricId);
  const sashingFabricUrl = useDesignerStore((s) => s.sashingFabricUrl);
  const borders = useDesignerStore((s) => s.borders);
  const setSashing = useDesignerStore((s) => s.setSashing);
  const addBorder = useDesignerStore((s) => s.addBorder);
  const removeBorder = useDesignerStore((s) => s.removeBorder);

  const [localSashingWidth, setLocalSashingWidth] = useState(sashingWidth);

  const handleSashingWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value) || 0;
      setLocalSashingWidth(val);
      setSashing(val);
    },
    [setSashing]
  );

  const handleQuickApply = useCallback(
    (fabricId: string) => {
      setSashing(sashingWidth, fabricId, null);
    },
    [setSashing, sashingWidth]
  );

  const handleAddBorder = useCallback(() => {
    if (borders.length >= MAX_BORDERS) return;
    addBorder({ width: 2, fabricId: null, fabricUrl: null });
  }, [borders.length, addBorder]);

  const handleBorderWidthChange = useCallback(
    (index: number, width: number) => {
      const updated = [...borders];
      updated[index] = { ...updated[index], width };
      useDesignerStore.getState().setBorders(updated);
    },
    [borders]
  );

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
      {/* SASHING SECTION */}
      <div className="space-y-3">
        <h3 className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)]">
          Sashing
        </h3>

        {/* Width input */}
        <div className="space-y-1.5">
          <label
            htmlFor="sashing-width-input"
            className="text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)]"
          >
            Width (inches)
          </label>
          <input
            id="sashing-width-input"
            type="number"
            min={0}
            max={6}
            step={0.25}
            value={localSashingWidth}
            onChange={handleSashingWidthChange}
            className="w-full px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[14px] leading-[20px] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          />
        </div>

        {/* Quick Apply swatches */}
        <div className="space-y-1.5">
          <span className="text-[14px] leading-[20px] font-semibold text-[var(--color-text-dim)]">
            Quick Apply
          </span>
          <div className="grid grid-cols-6 gap-1.5">
            {QUICK_APPLY_FABRICS.map((f) => (
              <button
                key={f.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/quiltcorgi-fabric-hex', f.hex);
                  e.dataTransfer.setData('application/quiltcorgi-fabric-name', f.name);
                  e.dataTransfer.effectAllowed = 'copy';
                  onFabricDragStart?.(e, f.id);
                }}
                onClick={() => handleQuickApply(f.id)}
                className="group flex flex-col items-center gap-0.5"
                title={f.name}
              >
                <div
                  className={`w-8 h-8 rounded-full border transition-colors ${
                    sashingFabricId === f.id
                      ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30'
                      : 'border-[var(--color-border)]/20 group-hover:border-[var(--color-primary)]/50'
                  }`}
                  style={{ backgroundColor: f.hex }}
                />
                <span className="text-[8px] text-[var(--color-text-dim)] truncate w-full text-center">
                  {f.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Fabric drop zone */}
        <FabricDropZone
          role="sashing"
          fabricId={sashingFabricId}
          fabricUrl={sashingFabricUrl}
          onFabricDragOver={onFabricDragOver ?? (() => {})}
          onFabricDrop={onFabricDrop ?? (() => {})}
          onFabricDragLeave={onFabricDragLeave ?? (() => {})}
        />
      </div>

      {/* DIVIDER */}
      <div className="border-t border-[var(--color-border)]/30" />

      {/* BORDERS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)]">
            Borders
          </h3>
          <button
            type="button"
            onClick={handleAddBorder}
            disabled={borders.length >= MAX_BORDERS}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            title={borders.length >= MAX_BORDERS ? 'Maximum 3 borders' : 'Add border'}
          >
            <Plus size={12} />
            Add
          </button>
        </div>

        {borders.length === 0 && (
          <p className="text-sm text-[var(--color-text-dim)] text-center py-4">
            No borders yet. Click &quot;Add&quot; to add a border.
          </p>
        )}

        {borders.map((border, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border border-[var(--color-border)]/30 space-y-2.5 bg-[var(--color-surface)]"
            style={{ boxShadow: `0 1px 2px rgba(26,26,26,0.08)` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px] leading-[20px] font-medium text-[var(--color-text)]">
                Border {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeBorder(index)}
                className="p-1 rounded-full hover:bg-[var(--color-primary)]/10 text-[var(--color-text-dim)] hover:text-error transition-colors duration-150"
                title="Remove border"
              >
                <X size={14} />
              </button>
            </div>

            {/* Width input */}
            <div className="space-y-1">
              <label
                htmlFor={`border-width-input-${index}`}
                className="text-xs text-[var(--color-text-dim)]"
              >
                Width (inches)
              </label>
              <input
                id={`border-width-input-${index}`}
                type="number"
                min={0.5}
                max={8}
                step={0.25}
                value={border.width}
                onChange={(e) => handleBorderWidthChange(index, parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[14px] leading-[20px] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              />
            </div>

            {/* Fabric drop zone for this border */}
            <FabricDropZone
              role="border"
              borderIndex={index}
              fabricId={border.fabricId}
              fabricUrl={border.fabricUrl}
              onFabricDragOver={onFabricDragOver ?? (() => {})}
              onFabricDrop={onFabricDrop ?? (() => {})}
              onFabricDragLeave={onFabricDragLeave ?? (() => {})}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
