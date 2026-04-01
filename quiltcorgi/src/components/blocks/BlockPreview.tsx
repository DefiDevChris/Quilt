'use client';

import { useEffect, useState } from 'react';
import type { BlockListItem } from '@/types/block';
import type { Block } from '@/types/block';
import { sanitizeSvg } from '@/lib/sanitize-svg';
import { useToast } from '@/components/ui/ToastProvider';

interface BlockPreviewProps {
  block: BlockListItem;
  onClose: () => void;
}

export function BlockPreview({ block, onClose }: BlockPreviewProps) {
  const [fullBlock, setFullBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast();

  async function handleUpgrade() {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        toast({
          type: 'error',
          title: 'Checkout failed',
          description: data.error ?? 'Unable to start checkout. Please try again.',
        });
      }
    } catch {
      toast({
        type: 'error',
        title: 'Connection error',
        description: 'Unable to connect. Please check your connection and try again.',
      });
    } finally {
      setIsUpgrading(false);
    }
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-80 rounded-xl bg-surface p-6 shadow-elevation-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-secondary hover:text-on-surface"
        >
          ✕
        </button>

        <h3 className="mb-3 text-lg font-semibold text-on-surface">{block.name}</h3>

        <div className="mb-4 flex items-center justify-center rounded-lg border border-outline-variant bg-background p-4">
          {loading ? (
            <div className="h-40 w-40 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : block.isLocked ? (
            <div className="flex h-40 w-40 flex-col items-center justify-center text-center">
              <span className="mb-2 text-3xl">🔒</span>
              <p className="text-sm text-secondary">Upgrade to Pro to use this block</p>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="mt-3 inline-block rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
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
            <p className="text-sm text-error">{error}</p>
          ) : (
            <div className="flex h-40 w-40 items-center justify-center text-4xl text-secondary">
              ◇
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary">Category</span>
            <span className="text-on-surface">{block.category}</span>
          </div>
          {block.subcategory && (
            <div className="flex justify-between">
              <span className="text-secondary">Subcategory</span>
              <span className="text-on-surface">{block.subcategory}</span>
            </div>
          )}
          {block.tags.length > 0 && (
            <div className="pt-1">
              <span className="text-secondary text-xs">Tags</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {block.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-background px-2 py-0.5 text-[10px] text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
