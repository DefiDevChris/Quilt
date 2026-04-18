'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { COLOR_FAMILIES, FABRICS_PAGINATION_DEFAULT_LIMIT } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { QuiltPieceRow } from '@/components/decorative/QuiltPiece';
import { FabricUploadDialog } from '@/components/fabrics/FabricUploadDialog';
import { COLORS, SHADOW, MOTION, OPACITY } from '@/lib/design-system';

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

export default function FabricsPage() {
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [colorFamily, setColorFamily] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchFabrics = async () => {
    let cancelled = false;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        scope: 'user',
        page: String(page),
        limit: String(FABRICS_PAGINATION_DEFAULT_LIMIT),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (colorFamily) params.set('colorFamily', colorFamily);

      const res = await fetch(`/api/fabrics?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data: FabricsResponse = await res.json();
      if (cancelled) return;

      setFabrics(data.data.fabrics);
      setTotalPages(data.data.totalPages);
      setTotal(data.data.total);
    } catch {
      if (!cancelled) setFabrics([]);
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFabrics();
  }, [page, debouncedSearch, colorFamily]);

  return (
    <>
      <PageHeader
        label="Collection"
        title="My Fabrics"
        description={`${total} ${total === 1 ? 'fabric' : 'fabrics'} in your personal collection`}
        action={
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-colors"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.text,
              boxShadow: SHADOW.brand,
              transitionDuration: `${MOTION.transitionDuration}ms`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#d97054';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primary;
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Upload Fabric
          </button>
        }
      />

      <div className="max-w-5xl">

      {/* Search + Color filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 transition-colors"
            style={{
              color: COLORS.textDim,
              transitionDuration: `${MOTION.transitionDuration}ms`,
              transitionTimingFunction: MOTION.transitionEasing,
            }}
            size={20}
          />
          <input
            type="text"
            placeholder="Search your fabrics by name or manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 border rounded-lg font-medium focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: COLORS.surface,
              borderColor: COLORS.border,
              color: COLORS.text,
              boxShadow: 'none',
              transitionDuration: `${MOTION.transitionDuration}ms`,
              transitionTimingFunction: MOTION.transitionEasing,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `${COLORS.primary}40`;
              (e.currentTarget.previousElementSibling as SVGSVGElement).style.color =
                COLORS.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              (e.currentTarget.previousElementSibling as SVGSVGElement).style.color =
                COLORS.textDim;
            }}
          />
        </div>

        <select
          value={colorFamily}
          onChange={(e) => {
            setColorFamily(e.target.value);
            setPage(1);
          }}
          className="px-6 py-4 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-colors"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.border,
            color: COLORS.text,
            transitionDuration: `${MOTION.transitionDuration}ms`,
            transitionTimingFunction: MOTION.transitionEasing,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = `${COLORS.primary}40`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.border;
          }}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg animate-pulse border"
              style={{ backgroundColor: `${COLORS.border}80`, borderColor: `${COLORS.border}1a` }}
            />
          ))}
        </div>
      ) : fabrics.length === 0 ? (
        <div className="py-24 text-center">
          <div className="mb-6">
            <QuiltPieceRow count={3} size={10} gap={4} className="mb-8" />
          </div>
          <h3 className="text-headline-sm font-semibold text-[var(--color-text)] mb-3">
            No fabrics yet
          </h3>
          <p className="text-body-md text-[var(--color-text-dim)] max-w-sm mx-auto mb-6">
            {debouncedSearch || colorFamily
              ? 'No fabrics match your filters.'
              : 'Upload fabric photos to build your personal collection.'}
          </p>
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-colors"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.text,
              boxShadow: SHADOW.brand,
              transitionDuration: `${MOTION.transitionDuration}ms`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#d97054';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primary;
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Upload Your First Fabric
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {fabrics.map((fabric) => {
            const imgSrc = fabric.thumbnailUrl ?? fabric.imageUrl;
            return (
              <div
                key={fabric.id}
                className="group relative rounded-lg border overflow-hidden transition-colors"
                style={{
                  borderColor: `${COLORS.border}4d`,
                  backgroundColor: COLORS.surface,
                  transitionDuration: `${MOTION.transitionDuration}ms`,
                  transitionTimingFunction: MOTION.transitionEasing,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${COLORS.primary}66`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${COLORS.border}4d`;
                }}
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
                    <div
                      className="h-full w-full flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS.border}4d` }}
                    >
                      <p className="text-[10px]" style={{ color: `${COLORS.textDim}66` }}>
                        No Preview
                      </p>
                    </div>
                  )}
                  <div
                    className="absolute inset-0 transition-colors"
                    style={{
                      backgroundColor: `${COLORS.text}00`,
                      transitionDuration: `${MOTION.transitionDuration}ms`,
                      transitionTimingFunction: MOTION.transitionEasing,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor =
                        `${COLORS.text}0d`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor =
                        `${COLORS.text}00`;
                    }}
                  />
                </div>

                <div className="p-4" style={{ backgroundColor: COLORS.surface }}>
                  <p className="text-xs font-bold truncate" style={{ color: COLORS.text }}>
                    {fabric.name}
                  </p>
                  {fabric.manufacturer && (
                    <p
                      className="text-[10px] mt-1"
                      style={{ color: COLORS.textDim, opacity: OPACITY.dim }}
                    >
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
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: `${COLORS.border}4d`,
              transitionDuration: `${MOTION.transitionDuration}ms`,
              transitionTimingFunction: MOTION.transitionEasing,
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.border;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            Previous
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs" style={{ color: COLORS.textDim }}>
              Index
            </span>
            <span className="text-sm font-bold" style={{ color: COLORS.text }}>
              {page} <span style={{ color: `${COLORS.textDim}66` }}>/</span> {totalPages}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: `${COLORS.border}4d`,
              transitionDuration: `${MOTION.transitionDuration}ms`,
              transitionTimingFunction: MOTION.transitionEasing,
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.border;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            Next
          </button>
        </div>
      )}
      </div>

      <FabricUploadDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploaded={fetchFabrics}
      />
    </>
  );
}
