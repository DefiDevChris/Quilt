'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { FabricListItem } from '@/types/fabric';
import { FabricBrowseCard } from '@/components/fabrics/FabricBrowseCard';
import { COLOR_FAMILIES, FABRIC_MANUFACTURERS } from '@/lib/constants';
import { FABRICS_PAGINATION_DEFAULT_LIMIT } from '@/lib/constants';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function FabricLibraryPage() {
  const [fabrics, setFabrics] = useState<FabricListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: FABRICS_PAGINATION_DEFAULT_LIMIT,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [colorFamily, setColorFamily] = useState('');
  const [manufacturer, setManufacturer] = useState('');

  const fetchFabrics = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(FABRICS_PAGINATION_DEFAULT_LIMIT));
      if (search) params.set('search', search);
      if (colorFamily) params.set('colorFamily', colorFamily);
      if (manufacturer) params.set('manufacturer', manufacturer);

      const res = await fetch(`/api/fabrics/public?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();

      setFabrics(json.data.fabrics);
      setPagination(json.data.pagination);
    } catch {
      setFabrics([]);
    } finally {
      setLoading(false);
    }
  }, [search, colorFamily, manufacturer]);

  useEffect(() => {
    const timer = setTimeout(() => fetchFabrics(1), 300);
    return () => clearTimeout(timer);
  }, [fetchFabrics]);

  function handlePageChange(page: number) {
    fetchFabrics(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="mb-10">
          <h1
            className="text-4xl lg:text-5xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            Fabric Library
          </h1>
          <p className="text-lg text-[var(--color-text-dim)]">
            Browse our curated collection of quilting fabrics. Click any swatch for details and
            shop links.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
            />
            <input
              type="text"
              placeholder="Search fabrics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-border-strong)] transition-colors duration-150"
            />
          </div>

          <select
            value={colorFamily}
            onChange={(e) => setColorFamily(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-strong)] transition-colors duration-150"
          >
            <option value="">All Colors</option>
            {COLOR_FAMILIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-strong)] transition-colors duration-150"
          >
            <option value="">All Brands</option>
            {FABRIC_MANUFACTURERS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-[var(--color-border)] animate-pulse"
              />
            ))}
          </div>
        ) : fabrics.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--color-text-dim)] text-lg">No fabrics found.</p>
            <p className="text-sm text-[var(--color-text-dim)] mt-2">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-dim)] mb-4">
              {pagination.total} fabric{pagination.total !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {fabrics.map((fabric) => (
                <FabricBrowseCard key={fabric.id} fabric={fabric} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-primary)]/10 transition-colors duration-150"
                >
                  Previous
                </button>
                <span className="text-sm text-[var(--color-text-dim)]">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-primary)]/10 transition-colors duration-150"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
