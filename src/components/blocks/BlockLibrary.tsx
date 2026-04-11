'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useBlockStore } from '@/stores/blockStore';
import { useAuthStore } from '@/stores/authStore';
import { BlockSearch } from '@/components/blocks/BlockSearch';
import { BlockCard } from '@/components/blocks/BlockCard';
import { BlockPreview } from '@/components/blocks/BlockPreview';
import { recordBlockUsed, getRecentlyUsedBlocks } from '@/lib/recently-used-blocks';
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

  const fetchBlocks = useBlockStore((s) => s.fetchBlocks);

  useEffect(() => {
    if (blocks.length === 0) {
      fetchBlocks();
    }
  }, [blocks.length, fetchBlocks]);

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
      recordBlockUsed(block.id);
      setRecentlyUsed(getRecentlyUsedBlocks());
    },
    [onBlockDragStart]
  );

  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  useEffect(() => {
    setRecentlyUsed(getRecentlyUsedBlocks());
  }, []);

  return (
    <>
      <div className="flex flex-1 min-h-0 w-full flex-col bg-[#fdfaf7]">
        {/* Tabs */}
        <div className="flex border-b border-[#d4d4d4]">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`flex-1 px-3 py-2.5 text-[14px] leading-[20px] transition-colors duration-150 ${activeTab === 'library'
              ? 'border-b-2 border-[#ff8d49] text-[#1a1a1a]'
              : 'text-[#4a4a4a] hover:text-[#1a1a1a]'
              }`}
          >
            Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('myblocks')}
            className={`flex-1 px-3 py-2.5 text-[14px] leading-[20px] transition-colors duration-150 ${activeTab === 'myblocks'
              ? 'border-b-2 border-[#ff8d49] text-[#1a1a1a]'
              : 'text-[#4a4a4a] hover:text-[#1a1a1a]'
              }`}
          >
            My Blocks
          </button>
        </div>

        {activeTab === 'library' ? (
          <>
            <BlockSearch />

            {recentlyUsed.length > 0 && (
              <div className="px-3 py-2 border-b border-[#d4d4d4]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[14px] leading-[20px] text-[#4a4a4a]">
                    Recently Used
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {recentlyUsed.slice(0, 4).map((id) => {
                    const block = blocks.find((b) => b.id === id);
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

            <div className="px-3 py-1 text-[14px] leading-[20px] text-[#4a4a4a]">{total} blocks</div>

            <div className="flex-1 overflow-y-auto px-3 py-1">
              {isLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-[#fdfaf7]" />
                  ))}
                </div>
              ) : error ? (
                <div className="py-8 text-center">
                  <p className="text-[14px] leading-[20px] text-[#ff8d49]">{error}</p>
                  <button
                    type="button"
                    onClick={() => useBlockStore.getState().fetchBlocks()}
                    className="mt-2 text-[14px] leading-[20px] text-[#ff8d49] hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : blocks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[14px] leading-[20px] text-[#4a4a4a]">No blocks found</p>
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
              <div className="flex items-center justify-between border-t border-[#d4d4d4] px-3 py-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="bg-[#fdfaf7] text-[#4a4a4a] rounded-full px-2 py-1 text-[14px] leading-[20px] hover:bg-[#ff8d49]/10 transition-colors duration-150 disabled:opacity-50"
                >
                  {'\u2190'} Prev
                </button>
                <span className="text-[14px] leading-[20px] text-[#4a4a4a]">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="bg-[#fdfaf7] text-[#4a4a4a] rounded-full px-2 py-1 text-[14px] leading-[20px] hover:bg-[#ff8d49]/10 transition-colors duration-150 disabled:opacity-50"
                >
                  Next {'\u2192'}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {isPro && (
              <div className="flex gap-1 border-b border-[#d4d4d4] px-3 py-1.5">
                {(Object.keys(FILTER_LABELS) as BlockFilter[])
                  .filter((f) => f !== 'svg')
                  .map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setBlockFilter(filter)}
                      className={`rounded-full px-3 py-1 text-[14px] leading-[20px] transition-colors duration-150 ${blockFilter === filter
                        ? 'bg-[#ff8d49] text-[#1a1a1a] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                        : 'bg-[#fdfaf7] text-[#4a4a4a] hover:text-[#1a1a1a]'
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
                  <p className="text-[14px] leading-[20px] text-[#4a4a4a]">Upgrade to Pro to create custom blocks</p>
                </div>
              ) : isLoadingUserBlocks ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-[#fdfaf7]" />
                  ))}
                </div>
              ) : filteredUserBlocks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[14px] leading-[20px] text-[#4a4a4a]">
                    {blockFilter === 'photo'
                      ? 'No photo blocks yet'
                      : blockFilter === 'custom'
                        ? 'No custom blocks yet'
                        : 'No blocks yet'}
                  </p>
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
                        className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white opacity-60 sm:opacity-0 sm:group-hover:flex sm:group-hover:opacity-100 ${confirmDeleteId === block.id
                          ? 'bg-[#ff8d49] ring-2 ring-[#ff8d49]/50 !opacity-100'
                          : 'bg-[#ff8d49]'
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
              <div className="flex gap-2 border-t border-[#d4d4d4] px-3 py-2">
                {onOpenDrafting && (
                  <button
                    type="button"
                    onClick={onOpenDrafting}
                    className="flex-1 rounded-full bg-[#ff8d49] text-[#1a1a1a] px-4 py-2 text-[14px] leading-[20px] hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
                  >
                    + Draft Block
                  </button>
                )}
                {onOpenPhotoUpload && (
                  <button
                    type="button"
                    onClick={onOpenPhotoUpload}
                    className="flex-1 rounded-full bg-[#ffffff] border border-[#d4d4d4] px-4 py-2 text-[14px] leading-[20px] text-[#1a1a1a] hover:bg-[#ff8d49]/10 transition-colors duration-150"
                  >
                    + Photo Block
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {previewBlock && <BlockPreview block={previewBlock} onClose={() => setPreviewBlock(null)} />}
    </>
  );
}
