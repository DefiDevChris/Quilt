'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { FabricListItem } from '@/types/fabric';

interface FabricPreviewModalProps {
  fabric: FabricListItem;
  onClose: () => void;
}

export function FabricPreviewModal({ fabric, onClose }: FabricPreviewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const hasAffiliate = fabric.isActive && fabric.deeplinkOverride;
  const price = fabric.pricePerYard ? `$${Number(fabric.pricePerYard).toFixed(2)}/yd` : null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[var(--color-text)]/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fabric-preview-title"
        tabIndex={-1}
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(54,49,45,0.08)] outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:bg-[var(--color-primary)]/10 transition-colors duration-150 focus:outline-2 focus:outline-[var(--color-primary)]"
          aria-label="Close preview"
        >
          <X size={16} />
        </button>

        <div className="aspect-square w-full">
          {fabric.hex ? (
            <div className="w-full h-full" style={{ backgroundColor: fabric.hex }} />
          ) : (
            <img
              src={fabric.thumbnailUrl ?? fabric.imageUrl}
              alt={fabric.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="p-5 space-y-3">
          <div>
            <h3
              id="fabric-preview-title"
              className="text-lg font-semibold text-[var(--color-text)]"
            >
              {fabric.name}
            </h3>
            {fabric.manufacturer && (
              <p className="text-sm text-[var(--color-text-dim)]">{fabric.manufacturer}</p>
            )}
            {fabric.collection && (
              <p className="text-xs text-[var(--color-text-dim)]">{fabric.collection}</p>
            )}
          </div>

          {hasAffiliate && price && (
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-[var(--color-text)]">{price}</span>
              {fabric.retailerName && (
                <span className="text-xs text-[var(--color-text-dim)]">via {fabric.retailerName}</span>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {hasAffiliate ? (
              <a
                href={`/api/affiliate/click/${fabric.id}`}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-primary)] text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors duration-150 shadow-[0_1px_2px_rgba(54,49,45,0.08)]"
              >
                <ExternalLink size={14} />
                Buy at {fabric.retailerName ?? 'Retailer'}
              </a>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-full bg-[var(--color-bg)] text-sm text-[var(--color-text-dim)] hover:bg-[var(--color-primary)]/10 transition-colors duration-150"
              >
                Close
              </button>
            )}
          </div>

          {hasAffiliate && (
            <p className="text-[10px] text-[var(--color-text-dim)] leading-tight">
              Affiliate link — QuiltCorgi may earn a commission at no extra cost to you.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
