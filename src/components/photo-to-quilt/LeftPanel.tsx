'use client';

import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';
import {
  PIECE_SIZE_SLIDER_MAX,
  sliderValueToPieceSize,
  pieceSizeToSliderValue,
} from '@/lib/photo-to-quilt/auto-piece-size';

export default function LeftPanel() {
  const previewUrl = usePhotoToQuiltStore((s) => s.previewUrl);
  const pieceSizeDetail = usePhotoToQuiltStore((s) => s.pieceSizeDetail);
  const colorCount = usePhotoToQuiltStore((s) => s.colorCount);
  const enhance = usePhotoToQuiltStore((s) => s.enhance);
  const setPieceSizeDetail = usePhotoToQuiltStore((s) => s.setPieceSizeDetail);
  const setColorCount = usePhotoToQuiltStore((s) => s.setColorCount);
  const setEnhance = usePhotoToQuiltStore((s) => s.setEnhance);

  const fileRef = useRef<HTMLInputElement>(null);

  const sliderVal = pieceSizeToSliderValue(pieceSizeDetail);

  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col bg-[var(--color-bg)] border-r border-[var(--color-border)]/15 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <section className="card p-4">
          <h2 className="font-[family-name:var(--font-heading)] text-[1.05rem] font-bold tracking-tight text-[var(--color-text)] mb-3">
            Photo
          </h2>
          {previewUrl ? (
            <div className="rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
              <img src={previewUrl} alt="Preview" className="w-full object-contain max-h-[180px]" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer hover:bg-[var(--color-border)] transition-colors duration-150" onClick={() => fileRef.current?.click()}>
              <ImagePlus strokeWidth={2} size={24} className="text-[var(--color-primary)]" />
              <span className="font-bold text-[13px] text-[var(--color-primary-hover)]">No photo</span>
            </div>
          )}
        </section>

        <section className="card p-4 mt-3">
          <h2 className="font-[family-name:var(--font-heading)] text-[1.05rem] font-bold tracking-tight text-[var(--color-text)] mb-4">
            Design Settings
          </h2>
          <div className="grid gap-5">
            <label>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-[0.82rem] text-[var(--color-text-dim)]">Piece Size</span>
              </div>
              <input
                type="range"
                min={0}
                max={PIECE_SIZE_SLIDER_MAX}
                step={1}
                value={sliderVal}
                onChange={(e) => setPieceSizeDetail(sliderValueToPieceSize(Number(e.target.value)))}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-[0.68rem] text-[var(--color-text-dim)] mt-1">
                <span>Fine</span>
                <span>Large</span>
              </div>
            </label>

            <label>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-[0.82rem] text-[var(--color-text-dim)]">Fabric Palette</span>
                <strong className="text-[0.85rem] text-[var(--color-primary-hover)]">{colorCount} colors</strong>
              </div>
              <input
                type="range"
                min={3}
                max={64}
                value={colorCount}
                onChange={(e) => setColorCount(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-[0.68rem] text-[var(--color-text-dim)] mt-1">
                <span>Simple</span>
                <span>Detailed</span>
              </div>
            </label>

            <label>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-[0.82rem] text-[var(--color-text-dim)] flex items-center gap-1">
                  Photo Enhance
                </span>
                <strong className={`text-[0.85rem] ${enhance === 0 ? 'text-[var(--color-text-dim)]' : 'text-[var(--color-primary-hover)]'}`}>
                  {enhance}%
                </strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={enhance}
                onChange={(e) => setEnhance(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-[0.68rem] text-[var(--color-text-dim)] mt-1">
                <span>Original</span>
                <span>Enhanced</span>
              </div>
            </label>
          </div>
        </section>
      </div>
    </aside>
  );
}
