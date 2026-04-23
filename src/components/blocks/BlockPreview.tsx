'use client';

import { useEffect, useState } from 'react';
import type { BlockListItem, Block } from '@/types/block';
import { sanitizeSvg } from '@/lib/sanitize-svg';
import { startStripeCheckout } from '@/lib/stripe-checkout';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface BlockPreviewProps {
  block: BlockListItem;
  onClose: () => void;
}

export function BlockPreview({ block, onClose }: BlockPreviewProps) {
  const [fullBlock, setFullBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

  async function handleUpgrade() {
    setIsUpgrading(true);
    await startStripeCheckout();
    setIsUpgrading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchBlock() {
      try {
        const res = await fetch(`/api/blocks/${block.id}`);
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(json.error ?? 'Failed to load block');
          return;
        }
        setFullBlock(json.data);
      } catch {
        if (!cancelled) setError('Failed to load block');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!block.isLocked) {
      fetchBlock();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [block.id, block.isLocked]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/40"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-preview-title"
        tabIndex={-1}
        className="relative w-80 rounded-lg bg-surface border border-default p-6 shadow-[0_1px_2px_rgba(54,49,45,0.08)] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute right-3 top-3 text-dim hover:text-default transition-colors duration-150"
        >
          ✕
        </button>

        <h3 id="block-preview-title" className="mb-3 text-[18px] leading-[28px] text-default">
          {block.name}
        </h3>

        <div className="mb-4 flex items-center justify-center rounded-lg border border-default bg-default p-4">
          {loading ? (
            <div className="h-40 w-40 flex items-center justify-center">
              <div className="h-6 w-6 rounded-lg bg-[var(--color-secondary)] animate-pulse" />
            </div>
          ) : block.isLocked ? (
            <div className="flex h-40 w-40 flex-col items-center justify-center text-center">
              <span className="mb-2 text-3xl">🔒</span>
              <p className="text-[14px] leading-[20px] text-dim">
                Upgrade to Pro to use this block
              </p>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="mt-3 rounded-full bg-primary text-default px-4 py-1.5 text-[14px] leading-[20px] hover:bg-primary-dark transition-colors duration-150 disabled:opacity-50 shadow-[0_1px_2px_rgba(54,49,45,0.08)]"
              >
                {isUpgrading ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            </div>
          ) : fullBlock?.svgData ? (
            <div
              className="h-40 w-40"
              dangerouslySetInnerHTML={{ __html: sanitizeSvg(fullBlock.svgData) }}
            />
          ) : error ? (
            <p className="text-[14px] leading-[20px] text-primary">{error}</p>
          ) : (
            <div className="flex h-40 w-40 items-center justify-center text-[32px] leading-[40px] text-dim">
              ◇
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-[14px] leading-[20px]">
          <div className="flex justify-between">
            <span className="text-dim">Category</span>
            <span className="text-default">{block.category}</span>
          </div>
          {block.subcategory && (
            <div className="flex justify-between">
              <span className="text-dim">Subcategory</span>
              <span className="text-default">{block.subcategory}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
