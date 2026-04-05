'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { COLOR_FAMILIES, FABRICS_PAGINATION_DEFAULT_LIMIT } from '@/lib/constants';

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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">
          Fabric Library
        </h1>
        <p className="text-secondary">
          Browse fabrics to use in your quilt designs.
          {!isPro && ' Upgrade to Pro to upload your own fabrics.'}
        </p>
      </div>

      {/* Scope toggle (Pro only) */}
      {isPro && (
        <div className="flex gap-1 p-1 bg-surface-container rounded-lg w-fit mb-6">
          {(['system', 'user'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setScope(s);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                scope === s
                  ? 'bg-surface shadow-sm text-on-surface'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              {s === 'system' ? 'Library' : 'My Fabrics'}
            </button>
          ))}
        </div>
      )}

      {/* Search + Color filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
          <input
            type="text"
            placeholder="Search fabrics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <select
          value={colorFamily}
          onChange={(e) => {
            setColorFamily(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Colors</option>
          {COLOR_FAMILIES.map((c) => (
            <option key={c} value={c.toLowerCase()}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-secondary mb-4">
        {loading ? 'Loading...' : `${total} fabric${total !== 1 ? 's' : ''} found`}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="aspect-square bg-surface-container rounded-lg animate-pulse" />
          ))}
        </div>
      ) : fabrics.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-container flex items-center justify-center">
            <span className="text-2xl">🧵</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">
            {debouncedSearch || colorFamily ? 'No matching fabrics' : 'No fabrics yet'}
          </h3>
          <p className="text-secondary text-sm">
            {debouncedSearch || colorFamily
              ? 'Try adjusting your search or filters'
              : scope === 'user'
                ? 'Upload your first fabric from the Studio'
                : 'Fabrics will appear here once loaded'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {fabrics.map((fabric) => {
            const imgSrc = fabric.thumbnailUrl ?? fabric.imageUrl;
            return (
              <div
                key={fabric.id}
                className="group relative rounded-lg border border-outline-variant bg-surface overflow-hidden hover:border-primary transition-colors"
                title={fabric.name}
              >
                <div className="aspect-square">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={fabric.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-surface-container">
                      <span className="text-xl text-secondary">🧵</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-caption text-white truncate">{fabric.name}</p>
                  {fabric.manufacturer && (
                    <p className="text-[9px] text-white/70 truncate">{fabric.manufacturer}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-surface-container text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-secondary px-3">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-surface-container text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
