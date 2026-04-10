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
        <div className="flex gap-2 p-1 bg-[#e8e1da] border border-[#e8e1da] rounded-lg w-fit">
          {(['system', 'user'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setScope(s);
                setPage(1);
              }}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${scope === s
                ? 'bg-[#2d2a26] text-[#fdfaf7] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                : 'text-[#6b655e] hover:bg-[#e8e1da]/60'
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
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6b655e] group-focus-within:text-[#ff8d49] transition-colors duration-150" size={20} />
          <input
            type="text"
            placeholder="Filter archive by name or manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-[#ffffff] border border-[#e8e1da] rounded-lg text-[#2d2a26] placeholder:text-[#6b655e]/50 font-medium focus:outline-none focus:ring-2 focus:ring-[#ff8d49]/20 focus:border-[#ff8d49]/40 transition-colors duration-150"
          />
        </div>

        <select
          value={colorFamily}
          onChange={(e) => {
            setColorFamily(e.target.value);
            setPage(1);
          }}
          className="px-6 py-4 bg-[#ffffff] border border-[#e8e1da] rounded-lg text-[#2d2a26] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ff8d49]/20 focus:border-[#ff8d49]/40 appearance-none cursor-pointer transition-colors duration-150"
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
      <div className="flex items-center justify-between border-b border-[#e8e1da] pb-4">
        <p className="text-xs text-[#6b655e]">
          Showing {loading ? '...' : total} Entries
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="aspect-square bg-[#e8e1da]/50 rounded-lg animate-pulse border border-[#e8e1da]/10" />
          ))}
        </div>
      ) : fabrics.length === 0 ? (
        <div className="py-24 text-center bg-[#fdfaf7] border border-[#e8e1da] border-dashed rounded-lg">
          <h3 className="text-xl font-bold text-[#2d2a26] mb-2">
            No Entries Found
          </h3>
          <p className="text-[#6b655e] text-sm">
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
                className="group relative rounded-lg border border-[#e8e1da]/30 bg-[#ffffff] overflow-hidden hover:border-[#ff8d49]/40 transition-colors duration-150"
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
                    <div className="h-full w-full flex items-center justify-center bg-[#e8e1da]/30">
                      <p className="text-[10px] text-[#6b655e]/40">No Preview</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-150" />
                </div>

                <div className="p-4 bg-[#ffffff]">
                  <p className="text-xs font-bold text-[#2d2a26] truncate">{fabric.name}</p>
                  {fabric.manufacturer && (
                    <p className="text-[10px] text-[#6b655e] mt-1 opacity-60">{fabric.manufacturer}</p>
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
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium border border-[#e8e1da]/30 rounded-lg hover:bg-[#e8e1da] transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs text-[#6b655e]">Index</span>
            <span className="text-sm font-bold text-[#2d2a26]">{page} <span className="text-[#6b655e]/40">/</span> {totalPages}</span>
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium border border-[#e8e1da]/30 rounded-lg hover:bg-[#e8e1da] transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
