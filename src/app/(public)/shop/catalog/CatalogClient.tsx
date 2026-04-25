'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sliders, ChevronDown, Search, X } from 'lucide-react';
import { COLORS } from '@/lib/design-system';
import { useCartStore } from '@/stores/cartStore';
import { CartDrawer } from '@/components/shop/CartDrawer';
import ShopHeader from '@/components/shop/ShopHeader';
import type { ShopFabric } from '@/types/fabric';

const COLOR_FAMILIES = ['Red', 'Pink', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Neutrals'];
const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name', value: 'name' },
];
const CATEGORIES = [
  { label: 'All Fabric', value: '' },
  { label: 'Charm Packs', value: 'charm-packs' },
  { label: 'Fat Quarters', value: 'fat-quarters' },
  { label: 'Solids', value: 'solids' },
  { label: 'Pre-Cuts', value: 'pre-cuts' },
  { label: 'Kits', value: 'kits' },
  { label: 'Thread', value: 'thread' },
  { label: 'Batting', value: 'batting' },
  { label: 'Notions', value: 'notions' },
];

interface FilterState {
  sort: string;
  category: string;
  colorFamily: string;
  inStock: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  search: string;
}

interface CatalogClientProps {
  initialFabrics: ShopFabric[];
  initialTotal: number;
  initialPage: number;
  initialLimit: number;
  initialSort: string;
  initialCategory: string;
}

export default function CatalogClient({
  initialFabrics,
  initialTotal,
  initialPage,
  initialLimit,
  initialSort,
  initialCategory,
}: CatalogClientProps) {
  const [fabrics, setFabrics] = useState<ShopFabric[]>(initialFabrics);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    sort: initialSort,
    category: initialCategory,
    colorFamily: '',
    inStock: false,
    minPrice: null,
    maxPrice: null,
    search: '',
  });

  const addItemAndSync = useCartStore((s) => s.addItemAndSync);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortOpen]);

  const fetchFabrics = useCallback(
    async (newFilters: FilterState, newPage: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (newFilters.sort) params.set('sort', newFilters.sort);
        if (newFilters.category) params.set('category', newFilters.category);
        if (newFilters.colorFamily) params.set('colorFamily', newFilters.colorFamily);
        if (newFilters.inStock) params.set('inStock', 'true');
        if (newFilters.minPrice != null) params.set('minPrice', String(newFilters.minPrice));
        if (newFilters.maxPrice != null) params.set('maxPrice', String(newFilters.maxPrice));
        if (newFilters.search) params.set('search', newFilters.search);
        params.set('page', String(newPage));
        params.set('limit', String(initialLimit));

        const res = await fetch(`/api/shop/fabrics?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setFabrics(json.data.fabrics);
        setTotal(json.data.total);
        setPage(newPage);
      } finally {
        setLoading(false);
      }
    },
    [initialLimit]
  );

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    fetchFabrics(newFilters, 1);
  };

  const handleAddToCart = async (fabric: ShopFabric) => {
    if (!fabric.shopifyVariantId || !fabric.inStock) return;
    setDrawerOpen(true);
    await addItemAndSync({
      fabricId: fabric.id,
      shopifyVariantId: fabric.shopifyVariantId,
      quantityInYards: 0.25,
      pricePerYard: fabric.pricePerYard ? Number(fabric.pricePerYard) : 0,
      fabricName: fabric.name,
      fabricImageUrl: fabric.thumbnailUrl ?? fabric.imageUrl,
    });
  };

  const activeFilterCount = [
    filters.colorFamily,
    filters.inStock,
    filters.minPrice != null,
    filters.maxPrice != null,
  ].filter(Boolean).length;

  const totalPages = Math.ceil(total / initialLimit);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <ShopHeader />

      <main>
        {/* Hero Banner */}
        <div
          className="py-10 mb-0"
          style={{ backgroundColor: COLORS.surface }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1
              className="text-4xl md:text-5xl mb-3"
              style={{
                fontFamily: 'var(--font-heading)',
                color: COLORS.text,
              }}
            >
              {filters.category
                ? CATEGORIES.find((c) => c.value === filters.category)
                    ?.label ?? 'Fabric'
                : 'All Fabric'}
            </h1>
            <p className="text-sm" style={{ color: COLORS.textDim }}>
              {total} products{total === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: COLORS.textDim }}
              />
              <input
                type="text"
                placeholder="Search fabrics..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
                style={{
                  borderColor: `${COLORS.text}1a`,
                  backgroundColor: COLORS.surface,
                  color: COLORS.text,
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Filters Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
                style={{
                  borderColor: `${COLORS.text}1a`,
                  backgroundColor: COLORS.surface,
                  color: COLORS.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.primary}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.surface;
                }}
              >
                <Sliders size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span
                    className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary, color: COLORS.surface }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
                  style={{
                    borderColor: `${COLORS.text}1a`,
                    backgroundColor: COLORS.surface,
                    color: COLORS.text,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${COLORS.primary}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.surface;
                  }}
                >
                  {SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? 'Sort'}
                  <ChevronDown size={16} />
                </button>
                {sortOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 rounded-lg border shadow-md z-10"
                    style={{ backgroundColor: COLORS.surface, borderColor: `${COLORS.text}1a` }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          updateFilters({ sort: option.value });
                          setSortOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                        style={{
                          color:
                            option.value === filters.sort ? COLORS.primary : COLORS.text,
                          backgroundColor:
                            option.value === filters.sort
                              ? `${COLORS.primary}10`
                              : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (option.value !== filters.sort)
                            e.currentTarget.style.backgroundColor = `${COLORS.primary}08`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            option.value === filters.sort
                              ? `${COLORS.primary}10`
                              : 'transparent';
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => updateFilters({ category: cat.value })}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    filters.category === cat.value ? COLORS.text : COLORS.surface,
                  color:
                    filters.category === cat.value ? COLORS.surface : COLORS.textDim,
                  border: `1px solid ${filters.category === cat.value ? COLORS.text : `${COLORS.text}1a`}`,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Fabric Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div
                className="w-8 h-8 rounded-full animate-pulse"
                style={{ backgroundColor: `${COLORS.primary}33` }}
              />
            </div>
          ) : fabrics.length === 0 ? (
            <div className="py-20 text-center" style={{ color: COLORS.textDim }}>
              <p className="text-lg mb-3">No fabrics found</p>
              <button
                onClick={() =>
                  updateFilters({
                    category: '',
                    colorFamily: '',
                    inStock: false,
                    minPrice: null,
                    maxPrice: null,
                    search: '',
                  })
                }
                className="text-sm font-medium transition-colors"
                style={{ color: COLORS.primary }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {fabrics.map((fabric) => {
                const price = fabric.pricePerYard
                  ? `$${Number(fabric.pricePerYard).toFixed(2)}`
                  : '';
                return (
                  <div key={fabric.id} className="group flex flex-col">
                    <a href="#" className="block flex-grow">
                      <div
                        className="relative mb-3 border rounded-lg overflow-hidden transition-shadow duration-300"
                        style={{
                          height: '180px',
                          borderColor: `${COLORS.text}1a`,
                          backgroundColor: COLORS.surface,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow =
                            '0 1px 3px rgba(0,0,0,0.06)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                        }}
                      >
                        {fabric.thumbnailUrl || fabric.imageUrl ? (
                          <img
                            src={fabric.thumbnailUrl || fabric.imageUrl}
                            alt={fabric.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : fabric.hex ? (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: fabric.hex }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: `${COLORS.primary}10` }}
                          />
                        )}
                      </div>
                      {fabric.collection && (
                        <p
                          className="text-[10px] uppercase tracking-widest mb-1"
                          style={{ color: COLORS.textDim }}
                        >
                          {fabric.collection}
                        </p>
                      )}
                      <h3
                        className="font-medium leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2"
                        style={{ color: COLORS.text }}
                      >
                        {fabric.name}
                      </h3>
                    </a>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      {price && (
                        <p className="font-bold" style={{ color: COLORS.primary }}>
                          {price}/yd
                        </p>
                      )}
                      {fabric.shopifyVariantId && fabric.inStock && (
                        <button
                          onClick={() => handleAddToCart(fabric)}
                          className="text-sm font-bold px-5 py-1.5 rounded-full transition-all duration-200 border-2 opacity-0 group-hover:opacity-100"
                          style={{
                            color: COLORS.primary,
                            borderColor: COLORS.primary,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.primary;
                            e.currentTarget.style.color = COLORS.surface;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = COLORS.primary;
                          }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-16">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchFabrics(filters, p)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: p === page ? COLORS.primary : COLORS.surface,
                    color: p === page ? COLORS.text : COLORS.textDim,
                    border: `1px solid ${p === page ? COLORS.primary : `${COLORS.text}1a`}`,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Filter Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="fixed top-0 right-0 h-full w-80 overflow-y-auto z-50 shadow-xl"
            style={{ backgroundColor: COLORS.surface }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg" style={{ color: COLORS.text }}>
                  Filters
                </h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{ color: COLORS.textDim }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Color Family */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: COLORS.textDim }}>
                  Color
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COLOR_FAMILIES.map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        updateFilters({
                          colorFamily: filters.colorFamily === color ? '' : color,
                        })
                      }
                      className="px-3 py-1.5 rounded-full text-sm transition-colors"
                      style={{
                        backgroundColor:
                          filters.colorFamily === color ? COLORS.text : COLORS.bg,
                        color:
                          filters.colorFamily === color ? COLORS.surface : COLORS.text,
                        border: `1px solid ${filters.colorFamily === color ? COLORS.text : `${COLORS.text}1a`}`,
                      }}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock Toggle */}
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: COLORS.text }}>In Stock Only</span>
                <button
                  onClick={() => updateFilters({ inStock: !filters.inStock })}
                  className="relative inline-flex h-6 w-11 rounded-full transition-colors"
                  style={{
                    backgroundColor: filters.inStock ? COLORS.primary : `${COLORS.text}20`,
                  }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
                    style={{
                      backgroundColor: COLORS.surface,
                      transform: filters.inStock ? 'translateX(1.25rem)' : 'translateX(0)',
                    }}
                  />
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: COLORS.textDim }}>
                  Price Range
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice ?? ''}
                    onChange={(e) =>
                      updateFilters({
                        minPrice: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: `${COLORS.text}1a`,
                      backgroundColor: COLORS.bg,
                      color: COLORS.text,
                    }}
                  />
                  <span style={{ color: COLORS.textDim }}>–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice ?? ''}
                    onChange={(e) =>
                      updateFilters({
                        maxPrice: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: `${COLORS.text}1a`,
                      backgroundColor: COLORS.bg,
                      color: COLORS.text,
                    }}
                  />
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    updateFilters({ colorFamily: '', inStock: false, minPrice: null, maxPrice: null });
                    setSidebarOpen(false);
                  }}
                  className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: `${COLORS.text}0a`,
                    color: COLORS.textDim,
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <CartDrawer />
    </div>
  );
}
