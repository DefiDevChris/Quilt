'use client';

import { useEffect, useState } from 'react';
import type { BlockListItem } from '@/types/block';
import type { Block } from '@/types/block';
import { sanitizeSvg } from '@/lib/sanitize-svg';
import { startStripeCheckout } from '@/lib/stripe-checkout';

interface BlockPreviewProps {
  block: BlockListItem;
  onClose: () => void;
}

export function BlockPreview({ block, onClose }: BlockPreviewProps) {
  const [fullBlock, setFullBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/40"
      onClick={onClose}
    >
      <div
        className="relative w-80 rounded-lg bg-[#ffffff] border border-[#d4d4d4] p-6 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-[#4a4a4a] hover:text-[#1a1a1a] transition-colors duration-150"
        >
          ✕
        </button>

        <h3 className="mb-3 text-[18px] leading-[28px] text-[#1a1a1a]">{block.name}</h3>

        <div className="mb-4 flex items-center justify-center rounded-lg border border-[#d4d4d4] bg-[#fdfaf7] p-4">
          {loading ? (
            <div className="h-40 w-40 flex items-center justify-center">
              <div className="h-6 w-6 rounded-lg bg-[#ffc8a6] animate-pulse" />
            </div>
          ) : block.isLocked ? (
            <div className="flex h-40 w-40 flex-col items-center justify-center text-center">
              <span className="mb-2 text-3xl">🔒</span>
              <p className="text-[14px] leading-[20px] text-[#4a4a4a]">Upgrade to Pro to use this block</p>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="mt-3 rounded-full bg-[#ff8d49] text-[#1a1a1a] px-4 py-1.5 text-[14px] leading-[20px] hover:bg-[#e67d3f] transition-colors duration-150 disabled:opacity-50 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
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
            <p className="text-[14px] leading-[20px] text-[#ff8d49]">{error}</p>
          ) : (
            <div className="flex h-40 w-40 items-center justify-center text-[32px] leading-[40px] text-[#4a4a4a]">
              ◇
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-[14px] leading-[20px]">
          <div className="flex justify-between">
            <span className="text-[#4a4a4a]">Category</span>
            <span className="text-[#1a1a1a]">{block.category}</span>
          </div>
          {block.subcategory && (
            <div className="flex justify-between">
              <span className="text-[#4a4a4a]">Subcategory</span>
              <span className="text-[#1a1a1a]">{block.subcategory}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
