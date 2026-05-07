'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useDeferredValue } from 'react';
import { Search, Plus } from 'lucide-react';
import { COLOR_FAMILIES } from '@/lib/constants/fabrics';
import { FABRICS_PAGINATION_DEFAULT_LIMIT } from '@/lib/constants/pagination';
import { PageHeader } from '@/components/ui/PageHeader';
import { FabricUploadDialog } from '@/components/fabrics/FabricUploadDialog';

interface FabricItem {
  id: string;
  name: string;
  manufacturer: string | null;
  colorFamily: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
}

interface FabricsResponse {
  success: boolean;
  data: {
    fabrics: FabricItem[];
    total: number;
    page: number;
    totalPages: number;
  };
}

function PaginationButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-6 py-3 text-sm font-medium border rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-border)] border-[var(--color-border)]/30"
    >
      {children}
    </button>
  );
}

export default function FabricsPage() {
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDeferredValue(search);
const [colorFamily, setColorFamily] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, colorFamily]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          scope: 'user',
          page: String(page),
          limit: String(FABRICS_PAGINATION_DEFAULT_LIMIT),
        });
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (colorFamily) params.set('colorFamily', colorFamily);

        const res = await fetch(`/api/fabrics?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch');

        const data: FabricsResponse = await res.json();
        setFabrics(data.data.fabrics ?? []);
        setTotalPages(data.data.totalPages ?? 1);
        setTotal(data.data.total ?? 0);
      } catch {
        if (!controller.signal.aborted) setFabrics([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [page, debouncedSearch, colorFamily]);

  return (
    <>
      <PageHeader
        label="Collection"
        title="My Uploads"
        description={`${total ?? 0} ${total === 1 ? 'item' : 'items'} in your personal collection`}
        action={
          <button onClick={() => setUploadDialogOpen(true)} className="btn-primary gap-2">
            <Plus size={16} strokeWidth={2.5} />
            Upload Fabric
          </button>
        }
      />

      <div className="w-full">
        {/* Search + Color filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="md:col-span-3 relative group">
            <Search
              size={20}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] transition-colors duration-150 group-focus-within:text-[var(--color-primary)]"
            />
            <input
              type="text"
              placeholder="Search your fabrics by name or manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 border rounded-lg font-medium bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:border-[var(--color-primary)]/40 transition-colors duration-150"
            />
          </div>

          <select
            value={colorFamily}
            onChange={(e) => setColorFamily(e.target.value)}
            className="px-6 py-4 border rounded-lg text-sm font-medium bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-colors duration-150 focus:border-[var(--color-primary)]/40"
          >
            <option value="">All Colors</option>
            {COLOR_FAMILIES.map((c) => (
              <option key={c} value={c.toLowerCase()}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {Array.from({ length: 18 }, (_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg animate-pulse border border-[var(--color-border)]/10 bg-[var(--color-border)]/50"
              />
            ))}
          </div>
        ) : fabrics.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mb-6">
              <img
                src="/icons/quilt-09-measuring-tape-Photoroom.png"
                alt="Fabrics"
                width={96}
                height={96}
                className="mx-auto opacity-20"
              />
            </div>
            <h3 className="text-headline-sm font-semibold text-[var(--color-text)] mb-3">
              No fabrics yet
            </h3>
            <p className="text-body-md text-[var(--color-text-dim)] max-w-sm mx-auto mb-6">
              {debouncedSearch || colorFamily
                ? 'No fabrics match your filters.'
                : 'Upload fabric photos to build your personal collection.'}
            </p>
            <button onClick={() => setUploadDialogOpen(true)} className="btn-primary gap-2 px-6 py-3">
              <Plus size={18} strokeWidth={2.5} />
              Upload Your First Fabric
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {fabrics.map((fabric) => {
              const imgSrc = fabric.thumbnailUrl ?? fabric.imageUrl;
              return (
                <div
                  key={fabric.id}
                  className="group relative rounded-lg border overflow-hidden transition-colors duration-150 bg-[var(--color-surface)] border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/40"
                >
                  <div className="aspect-square relative overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={fabric.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-[var(--color-border)]/30">
                        <p className="text-[10px] text-[var(--color-text-dim)]/40">
                          No Preview
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-150 group-hover:bg-black/5" />
                  </div>

                  <div className="p-4 bg-[var(--color-surface)]">
                    <p className="text-xs font-bold truncate text-[var(--color-text)]">
                      {fabric.name}
                    </p>
                    {fabric.manufacturer && (
                      <p className="text-[10px] mt-1 text-[var(--color-text-dim)]/60">
                        {fabric.manufacturer}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 pt-12">
            <PaginationButton
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </PaginationButton>
            <div className="flex flex-col items-center">
              <span className="text-xs text-[var(--color-text-dim)]">Index</span>
              <span className="text-sm font-bold text-[var(--color-text)]">
                {page} <span className="text-[var(--color-text-dim)]/40">/</span> {totalPages}
              </span>
            </div>
            <PaginationButton
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </PaginationButton>
          </div>
        )}
      </div>

      <FabricUploadDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploaded={() => {
          const controller = new AbortController();
          async function load() {
            setLoading(true);
            try {
              const params = new URLSearchParams({
                scope: 'user',
                page: '1',
                limit: String(FABRICS_PAGINATION_DEFAULT_LIMIT),
              });
              const res = await fetch(`/api/fabrics?${params}`, { signal: controller.signal });
              if (!res.ok) throw new Error('Failed to fetch');
              const data: FabricsResponse = await res.json();
              setFabrics(data.data.fabrics ?? []);
              setTotalPages(data.data.totalPages ?? 1);
              setTotal(data.data.total ?? 0);
            } catch {
              setFabrics([]);
            } finally {
              setLoading(false);
              setPage(1);
            }
          }
          load();
        }}
      />
    </>
  );
}
