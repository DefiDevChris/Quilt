'use client';

import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';
import { formatNumber } from '@/lib/photo-to-quilt/processing';

export default function RightPanel() {
  const result = usePhotoToQuiltStore((s) => s.result);
  const updatePaletteColor = usePhotoToQuiltStore((s) => s.updatePaletteColor);

  if (!result) return null;

  const fabricColors = result.palette.filter(
    (_, i) => i < result.palette.length - 1,
  );

  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col bg-[var(--color-bg)] border-l border-[var(--color-border)]/15 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <section className="card p-4">
          <h2 className="font-[family-name:var(--font-heading)] text-[1.05rem] font-bold tracking-tight text-[var(--color-text)] mb-3">
            Pattern Summary
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
              <span className="block text-[0.72rem] font-bold text-[var(--color-text-dim)]">Blocks</span>
              <strong className="block mt-0.5 font-[family-name:var(--font-heading)] text-[1.05rem]">{result.totalBlocks}</strong>
            </div>
            <div className="p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
              <span className="block text-[0.72rem] font-bold text-[var(--color-text-dim)]">Pieces</span>
              <strong className="block mt-0.5 font-[family-name:var(--font-heading)] text-[1.05rem]">{formatNumber(result.totalPieces)}</strong>
            </div>
            <div className="p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
              <span className="block text-[0.72rem] font-bold text-[var(--color-text-dim)]">Colors</span>
              <strong className="block mt-0.5 font-[family-name:var(--font-heading)] text-[1.05rem]">{fabricColors.length}</strong>
            </div>
            <div className="p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
              <span className="block text-[0.72rem] font-bold text-[var(--color-text-dim)]">Solid</span>
              <strong className="block mt-0.5 font-[family-name:var(--font-heading)] text-[1.05rem]">{result.solidBlocks}</strong>
            </div>
          </div>
        </section>

        <section className="card p-4 mt-3">
          <h2 className="font-[family-name:var(--font-heading)] text-[1.05rem] font-bold tracking-tight text-[var(--color-text)] mb-3">
            Fabric Colors
          </h2>
          <div className="grid gap-2 max-h-[400px] overflow-auto pr-1">
            {fabricColors.map((color, i) => {
              const row = result.cutList[i];
              return (
                <label
                  key={i}
                  className="grid grid-cols-[42px_1fr] items-center gap-2.5 p-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]"
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updatePaletteColor(i, e.target.value)}
                    className="w-[42px] h-[34px] p-0 border-0 bg-transparent cursor-pointer"
                  />
                  <span>
                    <strong className="block text-[0.84rem]">Color {i + 1}</strong>
                    <small className="block mt-0.5 text-[var(--color-text-dim)] text-[0.72rem]">
                      {color} &middot; {row ? formatNumber(row.totalCount) : 0} pcs
                    </small>
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
