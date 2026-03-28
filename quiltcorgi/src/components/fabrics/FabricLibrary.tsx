'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFabricStore } from '@/stores/fabricStore';
import { useAuthStore } from '@/stores/authStore';
import { FabricSearch } from '@/components/fabrics/FabricSearch';
import { FabricCard } from '@/components/fabrics/FabricCard';
import type { FabricListItem } from '@/types/fabric';

type TabType = 'library' | 'myfabrics';

interface FabricLibraryProps {
  onFabricDragStart: (e: React.DragEvent, fabricId: string) => void;
  onOpenUpload?: () => void;
}

export function FabricLibrary({ onFabricDragStart, onOpenUpload }: FabricLibraryProps) {
  const isPanelOpen = useFabricStore((s) => s.isPanelOpen);
  const fabricItems = useFabricStore((s) => s.fabrics);
  const userFabrics = useFabricStore((s) => s.userFabrics);
  const isLoading = useFabricStore((s) => s.isLoading);
  const isLoadingUserFabrics = useFabricStore((s) => s.isLoadingUserFabrics);
  const error = useFabricStore((s) => s.error);
  const page = useFabricStore((s) => s.page);
  const totalPages = useFabricStore((s) => s.totalPages);
  const total = useFabricStore((s) => s.total);
  const setPage = useFabricStore((s) => s.setPage);
  const setPanelOpen = useFabricStore((s) => s.setPanelOpen);
  const fetchUserFabrics = useFabricStore((s) => s.fetchUserFabrics);
  const deleteUserFabric = useFabricStore((s) => s.deleteUserFabric);
  const isPro = useAuthStore((s) => s.isPro);

  const [activeTab, setActiveTab] = useState<TabType>('library');

  useEffect(() => {
    if (isPanelOpen && activeTab === 'myfabrics' && isPro) {
      fetchUserFabrics();
    }
  }, [isPanelOpen, activeTab, isPro, fetchUserFabrics]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, fabric: FabricListItem) => {
      e.dataTransfer.setData('application/quiltcorgi-fabric-id', fabric.id);
      e.dataTransfer.setData('application/quiltcorgi-fabric-url', fabric.imageUrl);
      e.dataTransfer.effectAllowed = 'copy';
      onFabricDragStart(e, fabric.id);
    },
    [onFabricDragStart]
  );

  return (
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
              <h2 className="text-sm font-semibold text-on-surface">Fabric Library</h2>
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
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Library
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('myfabrics')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium ${
                  activeTab === 'myfabrics'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                My Fabrics
              </button>
            </div>

            {activeTab === 'library' ? (
              <>
                <FabricSearch />

                <div className="px-3 py-1 text-[10px] text-secondary">{total} fabrics</div>

                <div className="flex-1 overflow-y-auto px-3 py-1">
                  {isLoading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square animate-pulse rounded-lg bg-background"
                        />
                      ))}
                    </div>
                  ) : error ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-error">{error}</p>
                      <button
                        type="button"
                        onClick={() => useFabricStore.getState().fetchFabrics()}
                        className="mt-2 text-sm text-primary hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : fabricItems.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-secondary">No fabrics found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {fabricItems.map((fabric) => (
                        <FabricCard key={fabric.id} fabric={fabric} onDragStart={handleDragStart} />
                      ))}
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-outline-variant px-3 py-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="rounded px-2 py-1 text-xs text-secondary hover:bg-background disabled:opacity-30"
                    >
                      ← Prev
                    </button>
                    <span className="text-[10px] text-secondary">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="rounded px-2 py-1 text-xs text-secondary hover:bg-background disabled:opacity-30"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  {!isPro ? (
                    <div className="py-8 text-center">
                      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-2">
                        Pro Feature
                      </span>
                      <p className="text-sm text-secondary">
                        Upgrade to Pro to upload custom fabrics
                      </p>
                    </div>
                  ) : isLoadingUserFabrics ? (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square animate-pulse rounded-lg bg-background"
                        />
                      ))}
                    </div>
                  ) : userFabrics.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-secondary mb-2">No fabrics uploaded yet</p>
                      {onOpenUpload && (
                        <button
                          type="button"
                          onClick={onOpenUpload}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          Import Fabric
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {userFabrics.map((fabric) => (
                        <div key={fabric.id} className="group relative">
                          <FabricCard fabric={fabric} onDragStart={handleDragStart} />
                          <button
                            type="button"
                            onClick={() => deleteUserFabric(fabric.id)}
                            title="Delete fabric"
                            className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] text-white group-hover:flex"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {isPro && onOpenUpload && (
                  <div className="border-t border-outline-variant px-3 py-2">
                    <button
                      type="button"
                      onClick={onOpenUpload}
                      className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      + Import Fabric
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
