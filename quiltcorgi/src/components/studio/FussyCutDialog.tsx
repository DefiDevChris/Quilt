'use client';

import { useFussyCut } from '@/hooks/useFussyCut';

export function FussyCutDialog() {
  const {
    isOpen,
    target,
    config,
    closeDialog,
    updateConfig,
    applyFussyCut,
  } = useFussyCut();

  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[480px] rounded-xl bg-surface p-5 shadow-elevation-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-on-surface">Fussy Cut</h2>
          <button
            type="button"
            onClick={closeDialog}
            className="text-secondary hover:text-on-surface"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-xs text-secondary">
          Position the fabric pattern precisely within this patch. Drag to offset,
          rotate, or scale the fabric motif.
        </p>

        {/* Preview area */}
        <div className="mb-4 flex justify-center rounded border border-outline-variant bg-white">
          <div className="relative h-[200px] w-[200px] overflow-hidden">
            {target.fabricImageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${target.fabricImageUrl})`,
                  transform: `translate(${config.offsetX}px, ${config.offsetY}px) rotate(${config.rotation}deg) scale(${config.scale})`,
                  transformOrigin: 'center center',
                }}
              />
            )}
            {/* Patch shape overlay */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 200 200"
              style={{ pointerEvents: 'none' }}
            >
              {target.patchVertices.length > 2 && (
                <polygon
                  points={target.patchVertices
                    .map((v) => `${v.x},${v.y}`)
                    .join(' ')}
                  fill="none"
                  stroke="#8d4f00"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}
            </svg>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div>
            <label className="flex items-center justify-between text-xs text-secondary">
              <span>Offset X</span>
              <span className="font-mono text-[10px]">{Math.round(config.offsetX)}px</span>
            </label>
            <input
              type="range"
              min={-200}
              max={200}
              value={Math.round(config.offsetX)}
              onChange={(e) => updateConfig({ offsetX: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-secondary">
              <span>Offset Y</span>
              <span className="font-mono text-[10px]">{Math.round(config.offsetY)}px</span>
            </label>
            <input
              type="range"
              min={-200}
              max={200}
              value={Math.round(config.offsetY)}
              onChange={(e) => updateConfig({ offsetY: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-secondary">
              <span>Rotation</span>
              <span className="font-mono text-[10px]">{Math.round(config.rotation)}°</span>
            </label>
            <input
              type="range"
              min={-180}
              max={180}
              value={Math.round(config.rotation)}
              onChange={(e) => updateConfig({ rotation: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-secondary">
              <span>Scale</span>
              <span className="font-mono text-[10px]">{config.scale.toFixed(2)}x</span>
            </label>
            <input
              type="range"
              min={10}
              max={300}
              value={Math.round(config.scale * 100)}
              onChange={(e) => updateConfig({ scale: Number(e.target.value) / 100 })}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              updateConfig({ offsetX: 0, offsetY: 0, rotation: 0, scale: 1 })
            }
            className="rounded-md px-3 py-2 text-sm text-secondary hover:bg-background"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-md px-4 py-2 text-sm text-secondary hover:bg-background"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyFussyCut}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
