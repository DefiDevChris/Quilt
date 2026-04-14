'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlockUploadDialog } from '@/components/designer/BlockUploadDialog';
import { useAuthStore } from '@/stores/authStore';

interface DesignerBlock {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  name: string;
}

interface MyBlocksPanelProps {
  onBlockUploaded?: (blockId: string) => void;
}

export function MyBlocksPanel({ onBlockUploaded }: MyBlocksPanelProps) {
  const isPro = useAuthStore((s) => s.isPro);
  const [blocks, setBlocks] = useState<DesignerBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const fetchBlocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/blocks?scope=user&limit=50');
      if (!res.ok) {
        setError('Failed to load blocks');
        return;
      }
      const json = await res.json();
      const userBlocks = (json.data?.blocks ?? [])
        .filter((b: { blockType: string }) => b.blockType === 'photo' || b.blockType === 'custom')
        .map(
          (b: {
            id: string;
            name: string;
            thumbnailUrl: string | null;
            fabricJsData: { imageUrl?: string } | null;
          }) => ({
            id: b.id,
            name: b.name,
            thumbnailUrl: b.thumbnailUrl ?? b.fabricJsData?.imageUrl ?? '',
            imageUrl: b.fabricJsData?.imageUrl ?? b.thumbnailUrl ?? '',
          })
        );
      setBlocks(userBlocks);
    } catch {
      setError('Failed to load blocks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const handleDragStart = useCallback((e: React.DragEvent, block: DesignerBlock) => {
    e.dataTransfer.setData(
      'application/quiltcorgi-designer-block',
      JSON.stringify({ blockId: block.id, imageUrl: block.imageUrl })
    );
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleSaved = useCallback(
    (blockId?: string) => {
      setShowUploadDialog(false);
      fetchBlocks();
      if (blockId && onBlockUploaded) {
        onBlockUploaded(blockId);
      }
    },
    [fetchBlocks, onBlockUploaded]
  );

  return (
    <div className="flex flex-1 min-h-0 w-full flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]/15">
        <h2 className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)]">
          My Blocks
        </h2>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-3 py-2 border-b border-[var(--color-border)]/15">
        <button
          type="button"
          onClick={() => setShowUploadDialog(true)}
          className="flex-1 rounded-full bg-[var(--color-primary)] text-[var(--color-text)] px-4 py-2 text-[14px] leading-[20px] hover:bg-[var(--color-primary)]/90 transition-colors duration-150 shadow-brand"
        >
          Upload Blocks
        </button>
      </div>

      {/* Block grid */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-[var(--color-bg)]" />
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-[14px] leading-[20px] text-[var(--color-primary)]">{error}</p>
            <button
              type="button"
              onClick={fetchBlocks}
              className="mt-2 text-[14px] leading-[20px] text-[var(--color-primary)] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : blocks.length === 0 ? (
          <div className="py-8 text-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-3"
            >
              <rect x="8" y="12" width="24" height="18" rx="2" />
              <line x1="16" y1="8" x2="24" y2="8" />
              <line x1="20" y1="8" x2="20" y2="12" />
              <circle cx="20" cy="21" r="3" />
            </svg>
            <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)] mb-3">
              No blocks yet
            </p>
            <button
              type="button"
              onClick={() => setShowUploadDialog(true)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-primary)]/90 transition-colors duration-150"
            >
              Upload Your First Block
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {blocks.map((block) => (
              <div
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, block)}
                className="group cursor-grab active:cursor-grabbing rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-bg)] overflow-hidden hover:border-[var(--color-primary)]/40 transition-colors duration-150"
              >
                <div className="aspect-square w-full overflow-hidden bg-[var(--color-bg)]">
                  {block.thumbnailUrl ? (
                    <img
                      src={block.thumbnailUrl}
                      alt={block.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[var(--color-text-dim)]/40">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="px-1.5 py-1">
                  <p className="text-[10px] leading-[14px] text-[var(--color-text)] truncate">
                    {block.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload dialog */}
      {showUploadDialog && (
        <BlockUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
