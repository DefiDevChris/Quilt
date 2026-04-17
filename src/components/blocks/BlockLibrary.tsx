'use client';

import { useState, useCallback, useEffect } from 'react';
import { useBlockStore } from '@/stores/blockStore';
import { useAuthDerived } from '@/stores/authStore';
import { BlockSearch } from '@/components/blocks/BlockSearch';
import { BlockCard } from '@/components/blocks/BlockCard';
import { BlockPreview } from '@/components/blocks/BlockPreview';
import { recordBlockUsed, getRecentlyUsedBlocks } from '@/lib/recently-used-blocks';
import type { BlockListItem } from '@/types/block';

interface BlockLibraryProps {
  onBlockDragStart: (e: React.DragEvent, blockId: string) => void;
  onOpenDrafting?: () => void;
  onOpenPhotoUpload?: () => void;
}

export function BlockLibrary({
  onBlockDragStart,
  onOpenDrafting,
  onOpenPhotoUpload,
}: BlockLibraryProps) {
  const blocks = useBlockStore((s) => s.blocks);
  const userBlocks = useBlockStore((s) => s.userBlocks);
  const isLoading = useBlockStore((s) => s.isLoading);
  const isLoadingUserBlocks = useBlockStore((s) => s.isLoadingUserBlocks);
  const error = useBlockStore((s) => s.error);
  const page = useBlockStore((s) => s.page);
  const totalPages = useBlockStore((s) => s.totalPages);
  const total = useBlockStore((s) => s.total);
  const setPage = useBlockStore((s) => s.setPage);
  const fetchBlocks = useBlockStore((s) => s.fetchBlocks);
  const fetchUserBlocks = useBlockStore((s) => s.fetchUserBlocks);
  const deleteUserBlock = useBlockStore((s) => s.deleteUserBlock);
  const selectedBlockId = useBlockStore((s) => s.selectedBlockId);
  const setSelectedBlockId = useBlockStore((s) => s.setSelectedBlockId);
  const { isAdmin } = useAuthDerived();

  const [activeTab, setActiveTab] = useState<'library' | 'mine'>('library');
  const [previewBlock, setPreviewBlock] = useState<BlockListItem | null>(null);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(getRecentlyUsedBlocks());

  useEffect(() => {
    if (blocks.length === 0) {
      fetchBlocks();
    }
  }, [blocks.length, fetchBlocks]);

  useEffect(() => {
    if (activeTab === 'mine' && userBlocks.length === 0) {
      fetchUserBlocks();
    }
  }, [activeTab, userBlocks.length, fetchUserBlocks]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, block: BlockListItem) => {
      e.dataTransfer.setData('application/quiltcorgi-block-id', block.id);
      e.dataTransfer.effectAllowed = 'copy';
      onBlockDragStart(e, block.id);
      recordBlockUsed(block.id);
      setRecentlyUsed(getRecentlyUsedBlocks());
    },
    [onBlockDragStart]
  );

  const handleDeleteUserBlock = useCallback(
    async (blockId: string) => {
      await deleteUserBlock(blockId);
    },
    [deleteUserBlock]
  );

  return (
    <>
      <div className="flex flex-1 min-h-0 w-full flex-col bg-default">
        <div className="flex border-b border-default">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'library'
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mine')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'mine'
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            My Blocks{userBlocks.length > 0 ? ` (${userBlocks.length})` : ''}
          </button>
        </div>

        {activeTab === 'library' ? (
          <>
            <div className="border-b border-default px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] leading-[18px] text-dim">
                  Shared blocks available to everyone.
                </p>
                <span className="text-[12px] leading-[18px] text-dim">{total} blocks</span>
              </div>
            </div>

            <BlockSearch />

            {recentlyUsed.length > 0 && (
              <div className="border-b border-default px-3 py-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[14px] leading-[20px] text-dim">Recently Used</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {recentlyUsed.slice(0, 4).map((id) => {
                    const block = blocks.find((entry) => entry.id === id);
                    if (!block) return null;
                    return (
                      <BlockCard
                        key={block.id}
                        block={block}
                        onPreview={setPreviewBlock}
                        onDragStart={handleDragStart}
                        isSelected={selectedBlockId === block.id}
                        onSelect={setSelectedBlockId}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-2">
              {isLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-default" />
                  ))}
                </div>
              ) : error ? (
                <div className="py-8 text-center">
                  <p className="text-[14px] leading-[20px] text-primary">{error}</p>
                  <button
                    type="button"
                    onClick={() => useBlockStore.getState().fetchBlocks()}
                    className="mt-2 text-[14px] leading-[20px] text-primary hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : blocks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[14px] leading-[20px] text-dim">No blocks in the library yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {blocks.map((block) => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      onPreview={setPreviewBlock}
                      onDragStart={handleDragStart}
                      isSelected={selectedBlockId === block.id}
                      onSelect={setSelectedBlockId}
                    />
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-default px-3 py-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-full bg-default px-2 py-1 text-[14px] leading-[20px] text-dim transition-colors duration-150 hover:bg-primary/10 disabled:opacity-50"
                >
                  {'←'} Prev
                </button>
                <span className="text-[14px] leading-[20px] text-dim">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-full bg-default px-2 py-1 text-[14px] leading-[20px] text-dim transition-colors duration-150 hover:bg-primary/10 disabled:opacity-50"
                >
                  Next {'→'}
                </button>
              </div>
            )}

            {isAdmin && (onOpenDrafting || onOpenPhotoUpload) && (
              <div className="border-t border-default px-3 py-2">
                <p className="mb-2 text-[12px] leading-[18px] text-dim">
                  Admin: publish blocks to the shared library.
                </p>
                <div className="flex gap-2">
                  {onOpenDrafting && (
                    <button
                      type="button"
                      onClick={onOpenDrafting}
                      className="flex-1 rounded-full bg-primary px-4 py-2 text-[14px] leading-[20px] text-default shadow-brand transition-colors duration-150 hover:bg-primary-dark"
                    >
                      Block Builder
                    </button>
                  )}
                  {onOpenPhotoUpload && (
                    <button
                      type="button"
                      onClick={onOpenPhotoUpload}
                      className="flex-1 rounded-full border border-default bg-surface px-4 py-2 text-[14px] leading-[20px] text-default transition-colors duration-150 hover:bg-primary/10"
                    >
                      Add Photo Block
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="border-b border-default px-3 py-2">
              <p className="text-[12px] leading-[18px] text-dim">
                Blocks you&apos;ve created. Drag them into your quilt.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2">
              {isLoadingUserBlocks ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-default" />
                  ))}
                </div>
              ) : userBlocks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[14px] leading-[20px] text-dim">No personal blocks yet.</p>
                  <p className="mt-1 text-[12px] leading-[18px] text-dim">
                    Use the Block Builder tab to create one.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {userBlocks.map((block) => (
                    <div key={block.id} className="relative group">
                      <BlockCard
                        block={block}
                        onPreview={setPreviewBlock}
                        onDragStart={handleDragStart}
                        isSelected={selectedBlockId === block.id}
                        onSelect={setSelectedBlockId}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteUserBlock(block.id)}
                        className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[10px] leading-none"
                        title="Delete block"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {previewBlock && <BlockPreview block={previewBlock} onClose={() => setPreviewBlock(null)} />}
    </>
  );
}
