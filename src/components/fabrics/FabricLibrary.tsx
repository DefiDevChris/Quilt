'use client';

import { useState, useCallback, useEffect } from 'react';
import { useFabricStore } from '@/stores/fabricStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useAuthDerived } from '@/stores/authStore';
import { FabricCard } from '@/components/fabrics/FabricCard';
import { FabricPreviewModal } from '@/components/fabrics/FabricPreviewModal';
import { SkeletonGrid } from '@/components/ui/skeleton';
import { getRecentFabrics } from '@/lib/recent-fabrics';
import { COLORS } from '@/lib/design-system';
import type { FabricListItem } from '@/types/fabric';

type TabType = 'library' | 'myfabrics' | 'uploads';
type FabricPickerTargetType = 'selection' | 'background';

const QUICK_APPLY_FABRICS: Array<{ id: string; name: string; hex: string }> = [
  { id: 'qa-white', name: 'White', hex: COLORS.surface },
  { id: 'qa-cream', name: 'Cream', hex: '#F5F0E8' },
  { id: 'qa-light-gray', name: 'Light Gray', hex: '#D0D0D0' },
  { id: 'qa-med-gray', name: 'Medium Gray', hex: '#B0B0B0' },
  { id: 'qa-black', name: 'Black', hex: '#333333' },
  { id: 'qa-navy', name: 'Navy', hex: '#2C3E50' },
];

interface FabricLibraryProps {
  onFabricDragStart: (e: React.DragEvent, fabricId: string) => void;
  onOpenUpload?: () => void;
}

export function FabricLibrary({ onFabricDragStart, onOpenUpload }: FabricLibraryProps) {
  const fabricItems = useFabricStore((s) => s.fabrics);
  const userFabrics = useFabricStore((s) => s.userFabrics);
  const uploadedFabrics = useFabricStore((s) => s.uploadedFabrics);
  const isLoading = useFabricStore((s) => s.isLoading);
  const isLoadingUserFabrics = useFabricStore((s) => s.isLoadingUserFabrics);
  const isLoadingUploads = useFabricStore((s) => s.isLoadingUploads);
  const error = useFabricStore((s) => s.error);
  const page = useFabricStore((s) => s.page);
  const totalPages = useFabricStore((s) => s.totalPages);
  const total = useFabricStore((s) => s.total);
  const setPage = useFabricStore((s) => s.setPage);
  const fetchFabrics = useFabricStore((s) => s.fetchFabrics);
  const fetchUserFabrics = useFabricStore((s) => s.fetchUserFabrics);
  const fetchUploadedFabrics = useFabricStore((s) => s.fetchUploadedFabrics);
  const deleteUserFabric = useFabricStore((s) => s.deleteUserFabric);
  const { isPro } = useAuthDerived();

  const fabricPickerTarget = useCanvasStore((s) => s.fabricPickerTarget);
  const setFabricPickerTarget = useCanvasStore((s) => s.setFabricPickerTarget);

  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewFabric, setPreviewFabric] = useState<FabricListItem | null>(null);

  const recentFabrics = getRecentFabrics();

  useEffect(() => {
    if (fabricItems.length === 0 && !isLoading) {
      fetchFabrics();
    }
  }, [fabricItems.length, isLoading, fetchFabrics]);

  useEffect(() => {
    if (activeTab === 'myfabrics' && isPro) {
      fetchUserFabrics();
    }
  }, [activeTab, isPro, fetchUserFabrics]);

  useEffect(() => {
    if (activeTab === 'uploads' && isPro) {
      fetchUploadedFabrics();
    }
  }, [activeTab, isPro, fetchUploadedFabrics]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, fabric: FabricListItem) => {
      e.dataTransfer.setData('application/quiltcorgi-fabric-id', fabric.id);
      e.dataTransfer.setData('application/quiltcorgi-fabric-url', fabric.imageUrl);
      e.dataTransfer.setData('application/quiltcorgi-fabric-name', fabric.name);
      e.dataTransfer.effectAllowed = 'copy';
      onFabricDragStart(e, fabric.id);
    },
    [onFabricDragStart]
  );

  const handleClearPickerTarget = useCallback(() => {
    setFabricPickerTarget(null);
  }, [setFabricPickerTarget]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'library', label: 'Library' },
    { key: 'myfabrics', label: 'My Fabrics' },
    { key: 'uploads', label: 'Uploads' },
  ];

  const targetLabel = fabricPickerTarget === 'selection' ? 'Block' : 'Background';

  return (
    <>
      <div className="flex flex-col w-full flex-1 min-h-0 bg-[var(--color-bg)]">
        {fabricPickerTarget && (
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]/40 bg-[var(--color-primary)]/10">
            <span className="text-xs font-medium text-[var(--color-primary)]">
              Coloring: {targetLabel}
            </span>
            <button
              type="button"
              onClick={handleClearPickerTarget}
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        <div className="flex border-b border-[var(--color-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'library' ? (
          <>
            <div className="px-3 py-1 text-xs text-[var(--color-text-dim)]">{total} fabrics</div>

            {recentFabrics.length > 0 && (
              <div className="border-b border-[var(--color-border)]/20 px-3 py-2">
                <span className="text-[12px] leading-[18px] font-medium text-[var(--color-text-dim)]">
                  Recently Used
                </span>
                <div className="grid grid-cols-6 gap-1.5 mt-1.5">
                  {recentFabrics.slice(0, 6).map((fabric) => (
                    <button
                      key={fabric.id}
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, fabric as unknown as FabricListItem)}
                      className="group flex flex-col items-center gap-0.5"
                      title={fabric.name}
                    >
                      <div
                        className="w-8 h-8 rounded-full border border-[var(--color-border)]/20 group-hover:border-primary/50 transition-colors bg-cover bg-center"
                        style={{ backgroundImage: `url(${fabric.imageUrl})` }}
                      />
                      <span className="text-[8px] text-[var(--color-text-dim)] truncate w-full text-center">
                        {fabric.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-3 py-2 border-b border-[var(--color-border)]/20">
              <span className="text-[14px] leading-[20px] font-semibold text-[var(--color-text-dim)]">
                Quick Apply
              </span>
              <div className="grid grid-cols-6 gap-1.5 mt-1.5">
                {QUICK_APPLY_FABRICS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/quiltcorgi-fabric-hex', f.hex);
                      e.dataTransfer.setData('application/quiltcorgi-fabric-name', f.name);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="group flex flex-col items-center gap-0.5"
                    title={f.name}
                  >
                    <div
                      className="w-8 h-8 rounded-full border border-[var(--color-border)]/20 group-hover:border-primary/50 transition-colors"
                      style={{ backgroundColor: f.hex }}
                    />
                    <span className="text-[8px] text-[var(--color-text-dim)] truncate w-full text-center">
                      {f.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-1">
              {isLoading ? (
                <SkeletonGrid count={12} columns={3} />
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
                  <p className="text-sm text-[var(--color-text-dim)]">No fabrics found</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {fabricItems.map((fabric) => (
                    <FabricCard
                      key={fabric.id}
                      fabric={fabric}
                      onDragStart={handleDragStart}
                      onClick={() => setPreviewFabric(fabric)}
                    />
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--color-border)] px-3 py-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg px-2 py-1 text-xs text-[var(--color-text-dim)] hover:bg-[var(--color-primary)]/10 disabled:opacity-50"
                >
                  ← Prev
                </button>
                <span className="text-xs text-[var(--color-text-dim)]">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg px-2 py-1 text-xs text-[var(--color-text-dim)] hover:bg-[var(--color-primary)]/10 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : activeTab === 'myfabrics' ? (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {!isPro ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--color-text-dim)]">
                    Upgrade to Pro to save custom fabrics
                  </p>
                </div>
              ) : isLoadingUserFabrics ? (
                <SkeletonGrid count={6} columns={3} />
              ) : userFabrics.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--color-text-dim)]">No fabrics saved yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {userFabrics.map((fabric) => (
                    <div key={fabric.id} className="group relative">
                      <FabricCard
                        fabric={fabric}
                        onDragStart={handleDragStart}
                        onClick={() => setPreviewFabric(fabric)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (confirmDeleteId === fabric.id) {
                            deleteUserFabric(fabric.id);
                            setConfirmDeleteId(null);
                          } else {
                            setConfirmDeleteId(fabric.id);
                          }
                        }}
                        onBlur={() => setConfirmDeleteId(null)}
                        title={
                          confirmDeleteId === fabric.id
                            ? 'Click again to confirm delete'
                            : 'Delete fabric'
                        }
                        className={`absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center rounded-full text-xs text-white opacity-60 sm:opacity-0 sm:group-hover:flex sm:group-hover:opacity-100 ${
                          confirmDeleteId === fabric.id
                            ? 'bg-error ring-2 ring-error/50 !opacity-100'
                            : 'bg-error'
                        }`}
                      >
                        {confirmDeleteId === fabric.id ? '✓' : '✕'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {isPro && onOpenUpload && (
              <div className="px-3 py-2 border-b border-[var(--color-border)]/20">
                <button
                  type="button"
                  onClick={onOpenUpload}
                  className="w-full rounded-full bg-[var(--color-primary)] text-[var(--color-text)] px-4 py-2 text-[14px] leading-[20px] hover:bg-[var(--color-primary)] transition-colors duration-150 shadow-[0_1px_2px_rgba(26,26,26,0.08)]"
                >
                  + Upload fabric
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-2">
              {!isPro ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--color-text-dim)]">
                    Upgrade to Pro to upload fabrics
                  </p>
                </div>
              ) : isLoadingUploads ? (
                <SkeletonGrid count={6} columns={3} />
              ) : uploadedFabrics.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--color-text-dim)]">No uploads yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {uploadedFabrics.map((fabric) => (
                    <div key={fabric.id} className="group relative">
                      <FabricCard
                        fabric={fabric}
                        onDragStart={handleDragStart}
                        onClick={() => setPreviewFabric(fabric)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {previewFabric && (
        <FabricPreviewModal fabric={previewFabric} onClose={() => setPreviewFabric(null)} />
      )}
    </>
  );
}
