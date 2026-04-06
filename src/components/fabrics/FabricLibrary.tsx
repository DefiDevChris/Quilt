'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFabricStore } from '@/stores/fabricStore';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useShopEnabled } from '@/hooks/useShopEnabled';
import { FabricCard } from '@/components/fabrics/FabricCard';
import { FabricPreviewModal } from '@/components/fabrics/FabricPreviewModal';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { ShoppingBag } from 'lucide-react';
import type { FabricListItem } from '@/types/fabric';

type TabType = 'library' | 'myfabrics' | 'presets' | 'shop';

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
  const fabricPresets = useProjectStore((s) => s.fabricPresets);
  const removeFabricPreset = useProjectStore((s) => s.removeFabricPreset);
  const shopEnabled = useShopEnabled();

  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [shopFabrics, setShopFabrics] = useState<FabricListItem[]>([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [previewFabric, setPreviewFabric] = useState<FabricListItem | null>(null);

  useEffect(() => {
    if (isPanelOpen && activeTab === 'myfabrics' && isPro) {
      fetchUserFabrics();
    }
  }, [isPanelOpen, activeTab, isPro, fetchUserFabrics]);

  // Fetch shop fabrics when shop tab is active
  useEffect(() => {
    if (!isPanelOpen || activeTab !== 'shop' || !shopEnabled) return;

    let cancelled = false;
    const fetchShopFabrics = async () => {
      try {
        const res = await fetch('/api/shop/fabrics?limit=50&inStock=true');
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (cancelled) return;
        if (json?.data?.fabrics) {
          setShopFabrics(
            json.data.fabrics.map(
              (f: Record<string, unknown>): FabricListItem => ({
                id: f.id as string,
                name: f.name as string,
                imageUrl: f.imageUrl as string,
                thumbnailUrl: (f.thumbnailUrl as string) ?? null,
                manufacturer: (f.manufacturer as string) ?? null,
                sku: null,
                collection: (f.collection as string) ?? null,
                colorFamily: (f.colorFamily as string) ?? null,
                value: (f.value as string) ?? null,
                hex: (f.hex as string) ?? null,
                isDefault: true,
                isPurchasable: true,
                shopifyProductId: null,
                shopifyVariantId: (f.shopifyVariantId as string) ?? null,
                pricePerYard: f.pricePerYard !== null ? Number(f.pricePerYard) : null,
                inStock: (f.inStock as boolean) ?? false,
              })
            )
          );
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setShopLoading(false);
      }
    };

    setShopLoading(true);
    fetchShopFabrics();
    return () => {
      cancelled = true;
    };
  }, [isPanelOpen, activeTab, shopEnabled]);

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

  const tabs: { key: TabType; label: string }[] = [
    { key: 'library', label: 'Library' },
    { key: 'presets', label: 'Presets' },
    { key: 'myfabrics', label: 'My Fabrics' },
  ];
  if (shopEnabled) {
    tabs.push({ key: 'shop', label: 'Shop' });
  }

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
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium ${
                      activeTab === tab.key
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-on-surface/60 hover:text-on-surface'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'library' ? (
                <>
                  <div className="px-3 py-1 text-caption text-secondary">{total} fabrics</div>

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
                        <p className="text-sm text-secondary">No fabrics found</p>
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
              ) : activeTab === 'presets' ? (
                <>
                  <div className="px-3 py-2 text-caption text-secondary">
                    {fabricPresets.length} preset{fabricPresets.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 py-1">
                    {fabricPresets.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-secondary">No presets yet</p>
                        <p className="text-xs text-secondary mt-1">Right-click any fabric to add</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {fabricPresets.map((preset) => (
                          <FabricCard
                            key={preset.id}
                            fabric={preset as FabricListItem}
                            onDragStart={handleDragStart}
                            onRemove={() => removeFabricPreset(preset.id)}
                            onClick={() => setPreviewFabric(preset as FabricListItem)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : activeTab === 'shop' ? (
                <>
                  <div className="px-3 py-2 flex items-center gap-1.5">
                    <ShoppingBag size={12} className="text-primary" />
                    <span className="text-caption text-secondary">
                      {shopFabrics.length} purchasable fabric
                      {shopFabrics.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 py-1">
                    {shopLoading ? (
                      <SkeletonGrid count={9} columns={3} />
                    ) : shopFabrics.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-secondary mb-1">No shop fabrics available</p>
                        <p className="text-xs text-secondary">
                          Check back after the shop is stocked.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {shopFabrics.map((fabric) => (
                          <div key={fabric.id} className="relative">
                            <FabricCard
                              fabric={fabric}
                              onDragStart={handleDragStart}
                              onClick={() => setPreviewFabric(fabric)}
                            />
                            {/* Shop badge */}
                            <div className="absolute top-0.5 left-0.5 bg-primary text-white text-[8px] font-bold px-1 py-0.5 rounded leading-none">
                              Shop
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                      <SkeletonGrid count={6} columns={3} />
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
                              className={`absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center rounded-full text-caption text-white opacity-60 sm:opacity-0 sm:group-hover:flex sm:group-hover:opacity-100 ${
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

      {/* Fabric Preview Modal */}
      {previewFabric && (
        <FabricPreviewModal fabric={previewFabric} onClose={() => setPreviewFabric(null)} />
      )}
    </>
  );
}
