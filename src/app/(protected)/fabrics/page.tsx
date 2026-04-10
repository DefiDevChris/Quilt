'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { COLOR_FAMILIES, FABRICS_PAGINATION_DEFAULT_LIMIT } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';

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

type Scope = 'system' | 'user';

export default function FabricsPage() {
  const isPro = useAuthStore((s) => s.isPro);
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [colorFamily, setColorFamily] = useState('');
  const [scope, setScope] = useState<Scope>('system');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
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

  useEffect(() => {
    let cancelled = false;

    async function fetchFabrics() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          scope,
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
    }

    fetchFabrics();
    return () => {
      cancelled = true;
    };
  }, [scope, page, debouncedSearch, colorFamily]);

  return (
    <div className="space-y-10">
      <PageHeader
        label="Archives"
        title="Material Library"
        description={
          isPro
            ? 'Access the curated studio collection of fabrics and textures for your projects.'
            : 'Access the curated studio collection. Upgrade to Pro to integrate your custom textiles.'
        }
      />

      {/* Scope toggle (Pro only) */}
      {isPro && (
        <div className="flex gap-2 p-1 bg-neutral-100 border border-neutral-200 rounded-full w-fit">
          {(['system', 'user'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setScope(s);
                setPage(1);
              }}
              className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${scope === s
                ? 'bg-neutral-800 text-neutral shadow-elevation-2'
                : 'text-secondary hover:bg-neutral-100'
                }`}
            >
              {s === 'system' ? 'Studio Archive' : 'Personal Collection'}
            </button>
          ))}
        </div>
      )}

      {/* Search + Color filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-5 top-1/2 -track-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Filter archive by name or manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-neutral-200 rounded-full text-neutral-800 placeholder:text-secondary/50 font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all"
          />
        </div>

        <select
          value={colorFamily}
          onChange={(e) => {
            setColorFamily(e.target.value);
            setPage(1);
          }}
          className="px-6 py-4 bg-white border border-neutral-200 rounded-full text-neutral-800 text-sm font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 appearance-none cursor-pointer"
        >
          <option value="">Spectrum: All</option>
          {COLOR_FAMILIES.map((c) => (
            <option key={c} value={c.toLowerCase()}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between border-b border-neutral-200/20 pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/60">
          Showing {loading ? '...' : total} Entries
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="aspect-square bg-neutral-100/50 rounded-full animate-pulse border border-neutral-200/10" />
          ))}
        </div>
      ) : fabrics.length === 0 ? (
        <div className="py-24 text-center bg-neutral border border-neutral-200 border-dashed rounded-full">
          <h3 className="text-xl font-black text-neutral-800 mb-2 uppercase tracking-tight">
            No Entries Found
          </h3>
          <p className="text-secondary text-sm font-medium">
            {debouncedSearch || colorFamily
              ? 'No materials match your current filter parameters.'
              : 'Your personal material collection is currently empty.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {fabrics.map((fabric) => {
            const imgSrc = fabric.thumbnailUrl ?? fabric.imageUrl;
            return (
              <div
                key={fabric.id}
                className="group relative rounded-full border border-neutral-200/30 bg-white overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-elevation-3"
              >
                <div className="aspect-square relative overflow-hidden">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={fabric.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-neutral-100/30">
                      <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">No Preview</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>

                <div className="p-4 bg-white">
                  <p className="text-xs font-black text-neutral-800 truncate uppercase tracking-tight">{fabric.name}</p>
                  {fabric.manufacturer && (
                    <p className="text-[9px] text-secondary font-bold uppercase tracking-widest mt-1 opacity-60">{fabric.manufacturer}</p>
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
            className="flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-neutral-200/30 rounded-full hover:bg-neutral-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Index</span>
            <span className="text-sm font-black text-neutral-800">{page} <span className="text-secondary/40">/</span> {totalPages}</span>
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-neutral-200/30 rounded-full hover:bg-neutral-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
