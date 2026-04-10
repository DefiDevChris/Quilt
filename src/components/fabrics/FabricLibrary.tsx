'use client';

import { useState, useCallback, useEffect } from 'react';
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

/** Neutral solid fabrics that work well for sashing, borders, and binding. */
const QUICK_APPLY_FABRICS: Array<{ id: string; name: string; hex: string }> = [
  { id: 'qa-white', name: 'White', hex: '#FFFFFF' },
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
  const fetchFabrics = useFabricStore((s) => s.fetchFabrics);
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

  // Fetch fabrics on mount if not already loaded
  useEffect(() => {
    if (fabricItems.length === 0 && !isLoading) {
      fetchFabrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'myfabrics' && isPro) {
      fetchUserFabrics();
    }
  }, [activeTab, isPro, fetchUserFabrics]);

  // Fetch shop fabrics when shop tab is active
  useEffect(() => {
    if (activeTab !== 'shop' || !shopEnabled) return;

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
      <div className="flex flex-col w-full flex-1 min-h-0 bg-neutral">
        {/* Tabs */}
        <div className="flex border-b border-neutral-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium ${activeTab === tab.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-800/60 hover:text-neutral-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'library' ? (
          <>
            <div className="px-3 py-1 text-xs text-neutral-500">{total} fabrics</div>

            {/* Quick Apply — neutral solids for sashing/borders */}
            <div className="px-3 py-2 border-b border-neutral-200/20">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Quick Apply — Great for Sashing & Borders
              </span>
              <div className="grid grid-cols-6 gap-1.5 mt-1.5">
                {QUICK_APPLY_FABRICS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      // Use the fabric's hex as a pseudo-id for quick apply
                      e.dataTransfer.setData('application/quiltcorgi-fabric-hex', f.hex);
                      e.dataTransfer.setData('application/quiltcorgi-fabric-name', f.name);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="group flex flex-col items-center gap-0.5"
                    title={f.name}
                  >
                    <div
                      className="w-8 h-8 rounded-full border border-neutral-200/20 group-hover:border-primary/50 transition-colors"
                      style={{ backgroundColor: f.hex }}
                    />
                    <span className="text-[8px] text-neutral-500 truncate w-full text-center">
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
                  <p className="text-sm text-neutral-500">No fabrics found</p>
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
              <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg px-2 py-1 text-xs text-neutral-800/70 hover:bg-neutral-100 disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="text-xs text-neutral-800/50">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg px-2 py-1 text-xs text-neutral-800/70 hover:bg-neutral-100 disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : activeTab === 'presets' ? (
          <>
            <div className="px-3 py-2 text-xs text-neutral-500">
              {fabricPresets.length} preset{fabricPresets.length !== 1 ? 's' : ''}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-1">
              {fabricPresets.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-500">No presets yet</p>
                  <p className="text-xs text-neutral-500 mt-1">Right-click any fabric to add</p>
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
              <span className="text-xs text-neutral-500">
                {shopFabrics.length} purchasable fabric
                {shopFabrics.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-1">
              {shopLoading ? (
                <SkeletonGrid count={9} columns={3} />
              ) : shopFabrics.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-500 mb-1">No shop fabrics available</p>
                  <p className="text-xs text-neutral-500">Check back after the shop is stocked.</p>
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
                  <p className="text-sm text-neutral-500">Upgrade to Pro to upload custom fabrics</p>
                </div>
              ) : isLoadingUserFabrics ? (
                <SkeletonGrid count={6} columns={3} />
              ) : userFabrics.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-500">No fabrics uploaded yet</p>
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
                        className={`absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center rounded-full text-xs text-white opacity-60 sm:opacity-0 sm:group-hover:flex sm:group-hover:opacity-100 ${confirmDeleteId === fabric.id
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
              <div className="border-t border-neutral-200 px-3 py-2">
                <button
                  type="button"
                  onClick={onOpenUpload}
                  className="w-full rounded-lg bg-neutral-800 px-4 py-2 text-[11px] font-semibold tracking-wide text-neutral hover:opacity-90 transition-all"
                >
                  + Import Fabric
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fabric Preview Modal */}
      {previewFabric && (
        <FabricPreviewModal fabric={previewFabric} onClose={() => setPreviewFabric(null)} />
      )}
    </>
  );
}
