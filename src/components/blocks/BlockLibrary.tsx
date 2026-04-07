'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useBlockStore } from '@/stores/blockStore';
import { useAuthStore } from '@/stores/authStore';
import { BlockSearch } from '@/components/blocks/BlockSearch';
import { BlockCard } from '@/components/blocks/BlockCard';
import { BlockPreview } from '@/components/blocks/BlockPreview';
import type { BlockListItem } from '@/types/block';

type TabType = 'library' | 'myblocks';
type BlockFilter = 'all' | 'svg' | 'custom' | 'photo';

interface BlockLibraryProps {
  onBlockDragStart: (e: React.DragEvent, blockId: string) => void;
  onOpenDrafting?: () => void;
  onOpenPhotoUpload?: () => void;
}

const FILTER_LABELS: Record<BlockFilter, string> = {
  all: 'All',
  svg: 'SVG Blocks',
  custom: 'My Blocks',
  photo: 'Photo Blocks',
};

export function BlockLibrary({
  onBlockDragStart,
  onOpenDrafting,
  onOpenPhotoUpload,
}: BlockLibraryProps) {
  const isPanelOpen = useBlockStore((s) => s.isPanelOpen);
  const blocks = useBlockStore((s) => s.blocks);
  const userBlocks = useBlockStore((s) => s.userBlocks);
  const isLoading = useBlockStore((s) => s.isLoading);
  const isLoadingUserBlocks = useBlockStore((s) => s.isLoadingUserBlocks);
  const error = useBlockStore((s) => s.error);
  const page = useBlockStore((s) => s.page);
  const totalPages = useBlockStore((s) => s.totalPages);
  const total = useBlockStore((s) => s.total);
  const setPage = useBlockStore((s) => s.setPage);
  const fetchUserBlocks = useBlockStore((s) => s.fetchUserBlocks);
  const deleteUserBlock = useBlockStore((s) => s.deleteUserBlock);
  const selectedBlockId = useBlockStore((s) => s.selectedBlockId);
  const setSelectedBlockId = useBlockStore((s) => s.setSelectedBlockId);
  const isPro = useAuthStore((s) => s.isPro);

  const [previewBlock, setPreviewBlock] = useState<BlockListItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [blockFilter, setBlockFilter] = useState<BlockFilter>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'myblocks' && isPro) {
      fetchUserBlocks();
    }
  }, [activeTab, isPro, fetchUserBlocks]);

  const filteredUserBlocks = useMemo(() => {
    if (blockFilter === 'all') return userBlocks;
    if (blockFilter === 'custom') return userBlocks.filter((b) => b.blockType === 'custom');
    if (blockFilter === 'photo') return userBlocks.filter((b) => b.blockType === 'photo');
    return userBlocks;
  }, [userBlocks, blockFilter]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, block: BlockListItem) => {
      e.dataTransfer.setData('application/quiltcorgi-block-id', block.id);
      e.dataTransfer.effectAllowed = 'copy';
      onBlockDragStart(e, block.id);
    },
    [onBlockDragStart]
  );

  return (
    <>
      <div className="flex flex-1 min-h-0 w-full flex-col bg-surface">
        {/* Tabs */}
        <div className="flex border-b border-outline-variant">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium ${
              activeTab === 'library'
                ? 'border-b-2 border-primary text-primary'
                : 'text-on-surface/60 hover:text-on-surface'
            }`}
          >
            Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('myblocks')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium ${
              activeTab === 'myblocks'
                ? 'border-b-2 border-primary text-primary'
                : 'text-on-surface/60 hover:text-on-surface'
            }`}
          >
            My Blocks
          </button>
        </div>

        {activeTab === 'library' ? (
          <>
            {/* Search */}
            <BlockSearch />

            {/* Block count */}
            <div className="px-3 py-1 text-[10px] text-secondary">{total} blocks</div>

            {/* Block Grid */}
            <div className="flex-1 overflow-y-auto px-3 py-1">
              {isLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-background" />
                  ))}
                </div>
              ) : error ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-error">{error}</p>
                  <button
                    type="button"
                    onClick={() => useBlockStore.getState().fetchBlocks()}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : blocks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-secondary">No blocks found</p>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-outline-variant px-3 py-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded px-2 py-1 text-xs text-on-surface/70 hover:bg-surface-container disabled:opacity-30"
                >
                  {'\u2190'} Prev
                </button>
                <span className="text-[10px] text-on-surface/50">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded px-2 py-1 text-xs text-on-surface/70 hover:bg-surface-container disabled:opacity-30"
                >
                  Next {'\u2192'}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* My Blocks section */}
            {isPro && (
              <div className="flex gap-1 border-b border-outline-variant px-3 py-1.5">
                {(Object.keys(FILTER_LABELS) as BlockFilter[])
                  .filter((f) => f !== 'svg')
                  .map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setBlockFilter(filter)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        blockFilter === filter
                          ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white'
                          : 'bg-background text-secondary hover:text-on-surface'
                      }`}
                    >
                      {FILTER_LABELS[filter]}
                    </button>
                  ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-2">
              {!isPro ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-secondary">Upgrade to Pro to create custom blocks</p>
                </div>
              ) : isLoadingUserBlocks ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-background" />
                  ))}
                </div>
              ) : filteredUserBlocks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="mb-2 text-sm text-secondary">
                    {blockFilter === 'photo'
                      ? 'No photo blocks yet'
                      : blockFilter === 'custom'
                        ? 'No custom blocks yet'
                        : 'No blocks yet'}
                  </p>
                  {blockFilter !== 'photo' && onOpenDrafting && (
                    <button
                      type="button"
                      onClick={onOpenDrafting}
                      className="rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      Draft New Block
                    </button>
                  )}
                  {blockFilter === 'photo' && onOpenPhotoUpload && (
                    <button
                      type="button"
                      onClick={onOpenPhotoUpload}
                      className="rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      Upload Block Photo
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredUserBlocks.map((block) => (
                    <div key={block.id} className="group relative">
                      <BlockCard
                        block={block}
                        onPreview={setPreviewBlock}
                        onDragStart={handleDragStart}
                        isSelected={selectedBlockId === block.id}
                        onSelect={setSelectedBlockId}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          if (confirmDeleteId === block.id) {
                            deleteUserBlock(block.id);
                            setConfirmDeleteId(null);
                          } else {
                            setConfirmDeleteId(block.id);
                          }
                        }}
                        onBlur={() => setConfirmDeleteId(null)}
                        title={
                          confirmDeleteId === block.id
                            ? 'Click again to confirm delete'
                            : 'Delete block'
                        }
                        className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white opacity-60 sm:opacity-0 sm:group-hover:flex sm:group-hover:opacity-100 ${
                          confirmDeleteId === block.id
                            ? 'bg-error ring-2 ring-error/50 !opacity-100'
                            : 'bg-error'
                        }`}
                      >
                        {confirmDeleteId === block.id ? '\u2713' : '\u2715'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {isPro && (
              <div className="flex gap-2 border-t border-outline-variant px-3 py-2">
                {onOpenDrafting && (
                  <button
                    type="button"
                    onClick={onOpenDrafting}
                    className="flex-1 rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                  >
                    + Draft Block
                  </button>
                )}
                {onOpenPhotoUpload && (
                  <button
                    type="button"
                    onClick={onOpenPhotoUpload}
                    className="flex-1 rounded-md bg-background px-3 py-1.5 text-xs font-medium text-secondary hover:text-on-surface"
                  >
                    + Photo Block
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewBlock && <BlockPreview block={previewBlock} onClose={() => setPreviewBlock(null)} />}
    </>
  );
}
