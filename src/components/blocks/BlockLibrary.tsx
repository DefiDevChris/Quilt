'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlockStore } from '@/stores/blockStore';
import { useAuthStore } from '@/stores/authStore';
import { BlockSearch } from '@/components/blocks/BlockSearch';
import { BlockCard } from '@/components/blocks/BlockCard';
import { BlockPreview } from '@/components/blocks/BlockPreview';
import type { BlockListItem } from '@/types/block';

type TabType = 'library' | 'myblocks';

interface BlockLibraryProps {
  onBlockDragStart: (e: React.DragEvent, blockId: string) => void;
  onOpenDrafting?: () => void;
}

export function BlockLibrary({ onBlockDragStart, onOpenDrafting }: BlockLibraryProps) {
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
  const setPanelOpen = useBlockStore((s) => s.setPanelOpen);
  const fetchUserBlocks = useBlockStore((s) => s.fetchUserBlocks);
  const deleteUserBlock = useBlockStore((s) => s.deleteUserBlock);
  const selectedBlockId = useBlockStore((s) => s.selectedBlockId);
  const setSelectedBlockId = useBlockStore((s) => s.setSelectedBlockId);
  const isPro = useAuthStore((s) => s.isPro);

  const [previewBlock, setPreviewBlock] = useState<BlockListItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isPanelOpen && activeTab === 'myblocks' && isPro) {
      fetchUserBlocks();
    }
  }, [isPanelOpen, activeTab, isPro, fetchUserBlocks]);

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
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="flex-shrink-0 overflow-hidden border-r border-outline-variant bg-surface"
          >
            <div className="flex h-full w-[280px] flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-outline-variant px-3 py-2">
                <h2 className="text-sm font-semibold text-on-surface">Block Library</h2>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="text-secondary hover:text-on-surface"
                  title="Close panel"
                >
                  ✕
                </button>
              </div>

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
                  <div className="px-3 py-1 text-caption text-secondary">{total} blocks</div>

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
                        ← Prev
                      </button>
                      <span className="text-caption text-on-surface/50">
                        {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        className="rounded px-2 py-1 text-xs text-on-surface/70 hover:bg-surface-container disabled:opacity-30"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* My Blocks section */}
                  <div className="flex-1 overflow-y-auto px-3 py-2">
                    {!isPro ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-secondary">
                          Upgrade to Pro to create custom blocks
                        </p>
                      </div>
                    ) : isLoadingUserBlocks ? (
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-24 animate-pulse rounded-lg bg-background" />
                        ))}
                      </div>
                    ) : userBlocks.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-secondary mb-2">No custom blocks yet</p>
                        {onOpenDrafting && (
                          <button
                            type="button"
                            onClick={onOpenDrafting}
                            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                          >
                            Draft New Block
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {userBlocks.map((block) => (
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
                              className={`absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center rounded-full text-caption text-white opacity-60 sm:opacity-0 sm:group-hover:flex sm:group-hover:opacity-100 ${
                                confirmDeleteId === block.id
                                  ? 'bg-error ring-2 ring-error/50 !opacity-100'
                                  : 'bg-error'
                              }`}
                            >
                              {confirmDeleteId === block.id ? '✓' : '✕'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {isPro && onOpenDrafting && (
                    <div className="border-t border-outline-variant px-3 py-2">
                      <button
                        type="button"
                        onClick={onOpenDrafting}
                        className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                      >
                        + Draft New Block
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      {previewBlock && <BlockPreview block={previewBlock} onClose={() => setPreviewBlock(null)} />}
    </>
  );
}
