'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { Search, SlidersHorizontal, ShoppingBag, X } from 'lucide-react';

interface ShopFabric {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  manufacturer: string | null;
  collection: string | null;
  colorFamily: string | null;
  value: string | null;
  hex: string | null;
  pricePerYard: string | null;
  inStock: boolean;
  shopifyVariantId: string | null;
}

type SortOption = 'name' | 'price-asc' | 'price-desc' | 'newest';

export default function ShopPage() {
  const [fabrics, setFabrics] = useState<ShopFabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopEnabled, setShopEnabled] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [colorFamily, setColorFamily] = useState('');
  const [valueFilter, setValueFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>('name');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const toggleDrawer = useCartStore((s) => s.toggleDrawer);

  // Check if shop is enabled
  useEffect(() => {
    fetch('/api/shop/settings')
      .then((res) => (res.ok ? res.json() : { data: { enabled: false } }))
      .then((json) => setShopEnabled(json.data?.enabled === true))
      .catch(() => setShopEnabled(false));
  }, []);

  const fetchFabrics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (manufacturer) params.set('manufacturer', manufacturer);
      if (colorFamily) params.set('colorFamily', colorFamily);
      if (valueFilter) params.set('value', valueFilter);
      if (inStockOnly) params.set('inStock', 'true');
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '24');

      const res = await fetch(`/api/shop/fabrics?${params.toString()}`);
      if (!res.ok) {
        setFabrics([]);
        setTotal(0);
        setTotalPages(1);
        return;
      }

      const json = await res.json();
      setFabrics(json.data.fabrics);
      setTotal(json.data.pagination.total);
      setTotalPages(json.data.pagination.totalPages);
    } catch {
      setFabrics([]);
    } finally {
      setLoading(false);
    }
  }, [search, manufacturer, colorFamily, valueFilter, inStockOnly, sort, page]);

  useEffect(() => {
    if (shopEnabled) {
      fetchFabrics();
    }
  }, [shopEnabled, fetchFabrics]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFabrics();
  };

  const handleAddToCart = (fabric: ShopFabric) => {
    if (!fabric.shopifyVariantId || !fabric.inStock) return;
    addItem({
      fabricId: fabric.id,
      shopifyVariantId: fabric.shopifyVariantId,
      quantityInYards: 0.25,
      pricePerYard: fabric.pricePerYard ? Number(fabric.pricePerYard) : 0,
      fabricName: fabric.name,
      fabricImageUrl: fabric.thumbnailUrl ?? fabric.imageUrl,
    });
    toggleDrawer();
  };

  const clearFilters = () => {
    setSearch('');
    setManufacturer('');
    setColorFamily('');
    setValueFilter('');
    setInStockOnly(false);
    setSort('name');
    setPage(1);
  };

  const hasActiveFilters = manufacturer || colorFamily || valueFilter || inStockOnly || search;

  // Loading shop settings
  if (shopEnabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 bg-primary/20 rounded-full w-48 mx-auto" />
          <div className="h-4 bg-primary/10 rounded-full w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Shop not enabled
  if (!shopEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-neutral border border-neutral-200 rounded-full p-12 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={28} className="text-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Shop Coming Soon</h1>
          <p className="text-secondary">
            Our fabric shop is being set up. Check back soon for a curated selection of quilting
            fabrics!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-neutral border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1
            className="text-3xl font-bold text-neutral-800"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Fabric Shop
          </h1>
          <p className="mt-2 text-secondary">Browse our curated collection of quilting fabrics</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fabrics..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral border border-neutral-200 rounded-full text-sm text-neutral-800 placeholder:text-secondary focus:ring-2 focus:ring-primary/50"
            />
          </form>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${showFilters || hasActiveFilters
              ? 'bg-primary text-white shadow-elevation-1'
              : 'bg-neutral-100 text-secondary hover:bg-neutral-200'
              }`}
          >
            <SlidersHorizontal size={16} />
            Filters
            {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-white" />}
          </button>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortOption);
              setPage(1);
            }}
            className="px-4 py-2.5 rounded-full bg-neutral-100 text-sm text-secondary border border-neutral-200 focus:ring-2 focus:ring-primary/50"
          >
            <option value="name">Name A-Z</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-neutral border border-neutral-200 rounded-full p-4 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-800">Filters</h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-secondary font-medium">Manufacturer</label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => {
                    setManufacturer(e.target.value);
                    setPage(1);
                  }}
                  placeholder="All manufacturers"
                  className="w-full px-3 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-secondary font-medium">Color Family</label>
                <select
                  value={colorFamily}
                  onChange={(e) => {
                    setColorFamily(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-sm"
                >
                  <option value="">All colors</option>
                  <option value="red">Red</option>
                  <option value="orange">Orange</option>
                  <option value="yellow">Yellow</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                  <option value="brown">Brown</option>
                  <option value="white">White</option>
                  <option value="gray">Gray</option>
                  <option value="black">Black</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-secondary font-medium">Value</label>
                <select
                  value={valueFilter}
                  onChange={(e) => {
                    setValueFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-sm"
                >
                  <option value="">All values</option>
                  <option value="Light">Light</option>
                  <option value="Medium">Medium</option>
                  <option value="Dark">Dark</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-secondary font-medium">Availability</label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-100 border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      setPage(1);
                    }}
                    className="rounded-full border-neutral-200 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-neutral-800">In stock only</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-secondary">
            {total} fabric{total !== 1 ? 's' : ''} found
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>

        {/* Fabric Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-neutral border border-neutral-200 rounded-full overflow-hidden animate-pulse">
                <div className="aspect-square bg-primary/10" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-primary/20 rounded-full w-3/4" />
                  <div className="h-3 bg-primary/10 rounded-full w-1/2" />
                  <div className="h-8 bg-primary/10 rounded-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : fabrics.length === 0 ? (
          <div className="bg-neutral border border-neutral-200 rounded-full p-12 text-center">
            <p className="text-lg font-medium text-neutral-800 mb-2">No fabrics found</p>
            <p className="text-sm text-secondary">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms.'
                : 'No purchasable fabrics are available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {fabrics.map((fabric) => (
              <ShopFabricCard key={fabric.id} fabric={fabric} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-full bg-neutral-100 text-sm text-secondary hover:bg-neutral-200 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-full bg-neutral-100 text-sm text-secondary hover:bg-neutral-200 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ShopFabricCard({
  fabric,
  onAddToCart,
}: {
  fabric: ShopFabric;
  onAddToCart: (f: ShopFabric) => void;
}) {
  const price = fabric.pricePerYard ? `$${Number(fabric.pricePerYard).toFixed(2)}/yd` : 'Price TBD';

  return (
    <div className="group bg-neutral border border-neutral-200 rounded-full overflow-hidden hover:shadow-elevation-2 transition-all">
      {/* Swatch */}
      <div className="aspect-square relative">
        {fabric.hex ? (
          <div className="w-full h-full" style={{ backgroundColor: fabric.hex }} />
        ) : (
          <img
            src={fabric.thumbnailUrl ?? fabric.imageUrl}
            alt={fabric.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-medium text-neutral-800 truncate" title={fabric.name}>
          {fabric.name}
        </h3>
        {fabric.manufacturer && (
          <p className="text-xs text-secondary truncate">{fabric.manufacturer}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-neutral-800">{price}</span>
          {fabric.colorFamily && (
            <span className="text-[10px] text-secondary capitalize">{fabric.colorFamily}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAddToCart(fabric)}
          disabled={!fabric.inStock || !fabric.shopifyVariantId}
          className="mt-2 w-full py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-white hover:opacity-90 shadow-elevation-1 hover:shadow-elevation-2"
        >
          {!fabric.shopifyVariantId
            ? 'Not Available'
            : !fabric.inStock
              ? 'Out of Stock'
              : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
