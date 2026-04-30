'use client';

import Link from 'next/link';
import type { FabricListItem } from '@/types/fabric';

interface FabricBrowseCardProps {
  fabric: FabricListItem;
}

export function FabricBrowseCard({ fabric }: FabricBrowseCardProps) {
  const price = fabric.pricePerYard
    ? `$${Number(fabric.pricePerYard).toFixed(2)}/yd`
    : null;

  return (
    <Link
      href={`/fabrics/${fabric.id}`}
      className="group block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden transition-colors duration-150 hover:border-[var(--color-border-strong)]"
    >
      <div className="aspect-square overflow-hidden">
        {fabric.hex ? (
          <div className="w-full h-full" style={{ backgroundColor: fabric.hex }} />
        ) : (
          <img
            src={fabric.thumbnailUrl ?? fabric.imageUrl}
            alt={fabric.name}
            className="w-full h-full object-cover transition-colors duration-150"
            loading="lazy"
          />
        )}
      </div>

      <div className="p-3 space-y-1">
        <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">
          {fabric.name}
        </h3>
        {fabric.manufacturer && (
          <p className="text-xs text-[var(--color-text-dim)] truncate">
            {fabric.manufacturer}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          {fabric.colorFamily && (
            <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">
              {fabric.colorFamily}
            </span>
          )}
          {price && (
            <span className="text-xs font-medium text-[var(--color-text)]">
              {price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
