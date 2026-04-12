'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMobileUploadStore } from '@/stores/mobileUploadStore';
import { UploadCard } from './UploadCard';
import type { MobileUploadAssignedType } from '@/types/mobile-upload';
import { COLORS, SHADOW, MOTION } from '@/lib/design-system';

type FilterType = 'all' | 'fabric' | 'block' | 'quilt';

const FILTER_CHIPS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'fabric', label: 'Fabric' },
  { value: 'block', label: 'Block' },
  { value: 'quilt', label: 'Quilt' },
];

export function MobileUploadsPanel() {
  const router = useRouter();
  const uploads = useMobileUploadStore((s) => s.uploads);
  const isLoading = useMobileUploadStore((s) => s.isLoading);
  const error = useMobileUploadStore((s) => s.error);
  const fetchUploads = useMobileUploadStore((s) => s.fetchUploads);
  const updateType = useMobileUploadStore((s) => s.updateType);
  const processUpload = useMobileUploadStore((s) => s.processUpload);
  const deleteUpload = useMobileUploadStore((s) => s.deleteUpload);

  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchUploads('pending');
  }, [fetchUploads]);

  const pendingUploads = uploads.filter((u) => u.status === 'pending');

  const filteredUploads =
    filter === 'all' ? pendingUploads : pendingUploads.filter((u) => u.assignedType === filter);

  const handleUpdateType = useCallback(
    (id: string, type: MobileUploadAssignedType) => {
      updateType(id, type);
    },
    [updateType]
  );

  const handleProcess = useCallback(
    async (id: string, type: 'fabric' | 'block' | 'quilt') => {
      const result = await processUpload(id, type);
      if (!result) return;

      const upload = uploads.find((u) => u.id === id);
      if (!upload) return;

      switch (type) {
        case 'block':
          router.push(
            `/dashboard?tab=blocks&upload=true&preloadUrl=${encodeURIComponent(upload.imageUrl)}&uploadId=${id}`
          );
          break;
        case 'quilt':
          router.push(
            `/dashboard?action=photo-to-design&preloadUrl=${encodeURIComponent(upload.imageUrl)}&uploadId=${id}`
          );
          break;
        case 'fabric':
          router.push(
            `/dashboard?tab=fabrics&preloadUrl=${encodeURIComponent(upload.imageUrl)}&uploadId=${id}`
          );
          break;
      }
    },
    [processUpload, uploads, router]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteUpload(id);
    },
    [deleteUpload]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-headline-sm font-semibold text-[var(--color-text)]">Mobile Uploads</h2>
        <p className="text-body-md text-secondary mt-1">
          Photos from your phone. Assign each a type, then process.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {FILTER_CHIPS.map((chip) => {
          const count =
            chip.value === 'all'
              ? pendingUploads.length
              : pendingUploads.filter((u) => u.assignedType === chip.value).length;

          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilter(chip.value)}
              className={`px-3 py-1.5 text-[14px] font-medium rounded-full transition-colors duration-150 ${filter === chip.value
                ? 'text-[var(--color-text)]'
                : 'border border-[var(--color-border)] text-[var(--color-text-dim)]'
                }`}
              style={filter === chip.value
                ? { backgroundColor: COLORS.primary, boxShadow: SHADOW.brand }
                : undefined}
              onMouseEnter={(e) => {
                if (filter !== chip.value) e.currentTarget.style.backgroundColor = `${COLORS.primary}1a`;
              }}
              onMouseLeave={(e) => {
                if (filter !== chip.value) e.currentTarget.style.backgroundColor = '';
              }}
            >
              {chip.label}
              {count > 0 && <span className="ml-1.5 text-[12px] opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-full border" style={{ backgroundColor: `${COLORS.primary}1a`, borderColor: `${COLORS.primary}33` }}>
          <p className="text-[14px]" style={{ color: COLORS.primary }}>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
              <div className="aspect-square bg-[var(--color-bg)] animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-[var(--color-border)] rounded-full animate-pulse" />
                <div className="h-6 bg-[var(--color-border)]/50 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredUploads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${COLORS.primary}1a` }}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18.01" />
            </svg>
          </div>
          <p className="text-body-lg font-medium text-[var(--color-text)] mb-1">No uploads waiting</p>
          <p className="text-body-sm text-secondary max-w-xs">
            Take photos on your phone and they&apos;ll appear here for you to sort and process.
          </p>
        </div>
      )}

      {/* Upload grid */}
      {!isLoading && filteredUploads.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredUploads.map((upload) => (
            <UploadCard
              key={upload.id}
              upload={upload}
              onUpdateType={handleUpdateType}
              onProcess={handleProcess}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
