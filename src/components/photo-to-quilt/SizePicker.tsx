'use client';

import { useMemo } from 'react';
import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';
import { validQuiltSizes, type ValidQuiltSize } from '@/lib/photo-to-quilt/auto-piece-size';
import { formatFraction } from '@/lib/fraction-math';

function formatSize(s: ValidQuiltSize): string {
  const w = formatFraction(s.width, '-');
  const h = formatFraction(s.height, '-');
  return `${w}" × ${h}"`;
}

export default function SizePicker() {
  const workingSize = usePhotoToQuiltStore((s) => s.workingSize);
  const targetQuiltSize = usePhotoToQuiltStore((s) => s.targetQuiltSize);
  const setTargetQuiltSize = usePhotoToQuiltStore((s) => s.setTargetQuiltSize);

  const imageAspect = workingSize.height > 0 ? workingSize.width / workingSize.height : null;

  const sizes = useMemo(() => {
    if (!imageAspect) return [];
    return validQuiltSizes(imageAspect);
  }, [imageAspect]);

  if (sizes.length === 0) return null;

  const selectedKey = targetQuiltSize
    ? `${targetQuiltSize.width}x${targetQuiltSize.height}`
    : null;

  return (
    <div className="grid gap-1.5">
      {sizes.map((s) => {
        const key = `${s.width}x${s.height}`;
        const isSelected = selectedKey === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() =>
              setTargetQuiltSize(
                isSelected
                  ? null
                  : { width: s.width, height: s.height, pieceSize: s.pieceSize },
              )
            }
            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors duration-150 ${
              isSelected
                ? 'border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-text)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:border-[var(--color-primary)]/40'
            }`}
          >
            <span className="text-[0.82rem] font-bold">
              {s.label ?? formatSize(s)}
            </span>
            <span className="text-[0.72rem]">
              {formatFraction(s.pieceSize, '-')}&quot; · {s.blockCols}×{s.blockRows} blocks
            </span>
          </button>
        );
      })}
    </div>
  );
}
