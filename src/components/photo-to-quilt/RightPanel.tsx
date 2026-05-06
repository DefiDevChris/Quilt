'use client';

import { useEffect } from 'react';
import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';
import { formatNumber } from '@/lib/photo-to-quilt/processing';
import SizePicker from './SizePicker';
import { validQuiltSizes } from '@/lib/photo-to-quilt/auto-piece-size';

export default function RightPanel() {
  const workingSize = usePhotoToQuiltStore((s) => s.workingSize);
  const result = usePhotoToQuiltStore((s) => s.result);
  const targetQuiltSize = usePhotoToQuiltStore((s) => s.targetQuiltSize);
  const setTargetQuiltSize = usePhotoToQuiltStore((s) => s.setTargetQuiltSize);
  const updatePaletteColor = usePhotoToQuiltStore((s) => s.updatePaletteColor);

  const imageAspect = workingSize.height > 0 ? workingSize.width / workingSize.height : null;

  useEffect(() => {
    if (!targetQuiltSize && imageAspect) {
      const sizes = validQuiltSizes(imageAspect);
      if (sizes.length > 0) {
        const presets = sizes.filter((s) => s.label && !s.label.includes('(adj)'));
        const candidates = presets.length > 0 ? presets : sizes;
        let best = candidates[0];
        let bestDiff = Math.abs((best.width / best.height) - imageAspect);
        for (let i = 1; i < candidates.length; i++) {
          const diff = Math.abs((candidates[i].width / candidates[i].height) - imageAspect);
          if (diff < bestDiff) {
            bestDiff = diff;
            best = candidates[i];
          }
        }
        setTargetQuiltSize({
          width: best.width,
          height: best.height,
          pieceSize: best.pieceSize,
        });
      }
    }
  }, [targetQuiltSize, imageAspect, setTargetQuiltSize]);

  if (!result) return null;

  const fabricColors = result.palette.filter(
    (_, i) => i < result.palette.length - 1,
  );

  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col bg-[var(--color-bg)] border-l border-[var(--color-border)]/15 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <section className="card p-4 mb-3">
          <h2 className="font-[family-name:var(--font-heading)] text-[1.05rem] font-bold tracking-tight text-[var(--color-text)] mb-3">
            Quilt Size
          </h2>
          <SizePicker />
        </section>

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
