'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { COLORS, SHADOW, COLORS_HOVER } from '@/lib/design-system';
import { ShoppingBagLargeIcon } from '@/components/shop/ShopIcons';
import { QuiltPieceRow } from '@/components/decorative/QuiltPiece';

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
  description: string | null;
  inStock: boolean;
  shopifyVariantId: string | null;
}

type SortOption = 'name' | 'price-asc' | 'price-desc' | 'newest';

const COLOR_SWATCHES: Record<string, { hex: string; label: string }> = {
  red: { hex: '#E63946', label: 'Red' },
  orange: { hex: '#FF8C00', label: 'Orange' },
  yellow: { hex: '#FFD700', label: 'Yellow' },
  green: { hex: '#228B22', label: 'Green' },
  blue: { hex: '#4169E1', label: 'Blue' },
  purple: { hex: '#800080', label: 'Purple' },
  pink: { hex: '#FFC0CB', label: 'Pink' },
  brown: { hex: '#7B3F00', label: 'Brown' },
  white: { hex: '#F8F8F8', label: 'White' },
  gray: { hex: '#D3D3D3', label: 'Gray' },
  black: { hex: '#1A1A1A', label: 'Black' },
};

const MANUFACTURERS = [
  'Alison Glass',
  'Andover Fabrics',
  'Charisma Horton',
  'Makower UK',
];

const COLLECTIONS = [
  'Color Camp - Bloom',
  'Color Camp - Grove',
  'Color Camp - Sun',
  'Countryside Classics',
  'Dream Weaver',
  'Our Simple Life',
  'Snowberry',
];

const THEMES = [
  'Floral',
  'Geometric',
  'Modern',
  'Solid',
  'Tonal',
  'Traditional',
];

export default function ShopPage() {
  const [fabrics, setFabrics] = useState<ShopFabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopEnabled, setShopEnabled] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>('name');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    collection: true,
    manufacturer: true,
    color: true,
    theme: false,
    value: false,
  });

  const addItem = useCartStore((s) => s.addItem);
  const toggleDrawer = useCartStore((s) => s.toggleDrawer);

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
      if (selectedManufacturers.length) params.set('manufacturer', selectedManufacturers.join(','));
      if (selectedCollections.length) params.set('collection', selectedCollections.join(','));
      if (selectedColors.length) params.set('colorFamily', selectedColors.join(','));
      if (selectedValue) params.set('value', selectedValue);
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
  }, [search, selectedManufacturers, selectedCollections, selectedColors, selectedValue, inStockOnly, sort, page]);

  useEffect(() => {
    if (shopEnabled) fetchFabrics();
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

  const toggleFilter = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch('');
    setSelectedManufacturers([]);
    setSelectedCollections([]);
    setSelectedColors([]);
    setSelectedThemes([]);
    setSelectedValue('');
    setInStockOnly(false);
    setSort('name');
    setPage(1);
  };

  const activeFilterCount =
    selectedManufacturers.length +
    selectedCollections.length +
    selectedColors.length +
    selectedThemes.length +
    (selectedValue ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (shopEnabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 rounded w-48 mx-auto" style={{ backgroundColor: `${COLORS.primary}33` }} />
        </div>
      </div>
    );
  }

  if (!shopEnabled) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-12 text-center max-w-md" style={{ boxShadow: SHADOW.brand }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${COLORS.primary}1a` }}>
            <ShoppingBagLargeIcon size={32} color={COLORS.primary} />
          </div>
          <h1 className="text-[28px] font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}>
            Shop Coming Soon
          </h1>
          <p style={{ color: COLORS.textDim }}>We're curating our fabric collection. Check back soon!</p>
        </div>
      </div>
    );
  }

  const activeFilters = [
    ...selectedManufacturers.map((v) => ({ label: v, type: 'manufacturer' as const, value: v })),
    ...selectedCollections.map((v) => ({ label: v, type: 'collection' as const, value: v })),
    ...selectedColors.map((v) => ({ label: COLOR_SWATCHES[v]?.label ?? v, type: 'color' as const, value: v })),
    ...selectedThemes.map((v) => ({ label: v, type: 'theme' as const, value: v })),
    ...(selectedValue ? [{ label: selectedValue, type: 'value' as const, value: selectedValue }] : []),
    ...(inStockOnly ? [{ label: 'In Stock', type: 'stock' as const, value: 'true' }] : []),
  ];

  const removeFilter = (f: (typeof activeFilters)[0]) => {
    if (f.type === 'manufacturer') toggleFilter(selectedManufacturers, setSelectedManufacturers, f.value);
    else if (f.type === 'collection') toggleFilter(selectedCollections, setSelectedCollections, f.value);
    else if (f.type === 'color') toggleFilter(selectedColors, setSelectedColors, f.value);
    else if (f.type === 'theme') toggleFilter(selectedThemes, setSelectedThemes, f.value);
    else if (f.type === 'value') setSelectedValue('');
    else if (f.type === 'stock') setInStockOnly(false);
    setPage(1);
  };

  // ---- Filter Panel ----
  const FilterPanel = ({ className = '', isMobile = false }: { className?: string; isMobile?: boolean }) => (
    <div className={className}>
      {/* Collections */}
      <div className="border-b border-[var(--color-border)]">
        <button
          onClick={() => toggleSection('collection')}
          className="w-full flex items-center justify-between py-2.5 text-xs font-semibold uppercase tracking-wide"
          style={{ color: COLORS.text }}
        >
          Collections
          {openSections.collection ? <ChevronUp size={14} style={{ color: COLORS.textDim }} /> : <ChevronDown size={14} style={{ color: COLORS.textDim }} />}
        </button>
        {openSections.collection && (
          <div className="pb-3 space-y-1">
            {COLLECTIONS.map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCollections.includes(c)}
                  onChange={() => toggleFilter(selectedCollections, setSelectedCollections, c)}
                  className="rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                />
                <span className="text-xs group-hover:text-[var(--color-text)]" style={{ color: COLORS.textDim }}>{c}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Manufacturer */}
      <div className="border-b border-[var(--color-border)]">
        <button
          onClick={() => toggleSection('manufacturer')}
          className="w-full flex items-center justify-between py-2.5 text-xs font-semibold uppercase tracking-wide"
          style={{ color: COLORS.text }}
        >
          Manufacturer
          {openSections.manufacturer ? <ChevronUp size={14} style={{ color: COLORS.textDim }} /> : <ChevronDown size={14} style={{ color: COLORS.textDim }} />}
        </button>
        {openSections.manufacturer && (
          <div className="pb-3 space-y-1">
            {MANUFACTURERS.map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedManufacturers.includes(m)}
                  onChange={() => toggleFilter(selectedManufacturers, setSelectedManufacturers, m)}
                  className="rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                />
                <span className="text-xs group-hover:text-[var(--color-text)]" style={{ color: COLORS.textDim }}>{m}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Color */}
      <div className="border-b border-[var(--color-border)]">
        <button
          onClick={() => toggleSection('color')}
          className="w-full flex items-center justify-between py-2.5 text-xs font-semibold uppercase tracking-wide"
          style={{ color: COLORS.text }}
        >
          Color
          {openSections.color ? <ChevronUp size={14} style={{ color: COLORS.textDim }} /> : <ChevronDown size={14} style={{ color: COLORS.textDim }} />}
        </button>
        {openSections.color && (
          <div className="pb-3">
            <div className="grid grid-cols-6 gap-1.5">
              {Object.entries(COLOR_SWATCHES).map(([name, { hex }]) => {
                const isActive = selectedColors.includes(name);
                const isLight = ['white', 'yellow'].includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggleFilter(selectedColors, setSelectedColors, name)}
                    title={COLOR_SWATCHES[name].label}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-150"
                    style={{
                      backgroundColor: hex,
                      borderColor: isActive ? COLORS.primary : 'var(--color-border)',
                      boxShadow: isActive ? `0 0 0 1px ${COLORS.primary}` : 'none',
                    }}
                  >
                    {isActive && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.5 7.5L8 2.5" stroke={isLight ? '#333' : '#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Theme / Subject */}
      <div className="border-b border-[var(--color-border)]">
        <button
          onClick={() => toggleSection('theme')}
          className="w-full flex items-center justify-between py-2.5 text-xs font-semibold uppercase tracking-wide"
          style={{ color: COLORS.text }}
        >
          Style
          {openSections.theme ? <ChevronUp size={14} style={{ color: COLORS.textDim }} /> : <ChevronDown size={14} style={{ color: COLORS.textDim }} />}
        </button>
        {openSections.theme && (
          <div className="pb-3 space-y-1">
            {THEMES.map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedThemes.includes(t)}
                  onChange={() => toggleFilter(selectedThemes, setSelectedThemes, t)}
                  className="rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                />
                <span className="text-xs group-hover:text-[var(--color-text)]" style={{ color: COLORS.textDim }}>{t}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="border-b border-[var(--color-border)]">
        <button
          onClick={() => toggleSection('value')}
          className="w-full flex items-center justify-between py-2.5 text-xs font-semibold uppercase tracking-wide"
          style={{ color: COLORS.text }}
        >
          Value
          {openSections.value ? <ChevronUp size={14} style={{ color: COLORS.textDim }} /> : <ChevronDown size={14} style={{ color: COLORS.textDim }} />}
        </button>
        {openSections.value && (
          <div className="pb-3 space-y-1">
            {['Light', 'Medium', 'Dark'].map((v) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="value"
                  checked={selectedValue === v}
                  onChange={() => { setSelectedValue(selectedValue === v ? '' : v); setPage(1); }}
                  className="accent-[var(--color-primary)]"
                />
                <span className="text-xs" style={{ color: COLORS.textDim }}>{v}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* In Stock */}
      <div className="py-2.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }}
            className="rounded border-[var(--color-border)] accent-[var(--color-primary)]"
          />
          <span className="text-xs font-medium" style={{ color: COLORS.text }}>In Stock Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Top bar */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1
              className="text-lg font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
            >
              Fabric Shop
            </h1>
            <QuiltPieceRow count={3} size={6} gap={3} />
          </div>
          {/* Mobile filter button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile filter overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--color-surface)] shadow-xl overflow-y-auto">
            <div className="p-4 flex items-center justify-between border-b border-[var(--color-border)]">
              <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>Filters</h2>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="text-xs" style={{ color: COLORS.primary }}>Clear all</button>
                )}
                <button onClick={() => setShowMobileFilters(false)}><X size={18} style={{ color: COLORS.textDim }} /></button>
              </div>
            </div>
            <div className="p-4">
              <FilterPanel />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-16">
              <FilterPanel />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0 py-4">
            {/* Search + Sort bar */}
            <div className="flex items-center gap-3 mb-4">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <label htmlFor="shop-search" className="sr-only">Search fabrics</label>
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: COLORS.textDim }}
                />
                <input
                  id="shop-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search fabrics..."
                  className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm"
                  style={{ color: COLORS.text, outlineColor: COLORS.primary }}
                />
              </form>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as SortOption); setPage(1); }}
                className="px-3 py-2 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border)]"
                style={{ color: COLORS.textDim }}
              >
                <option value="name">Sort: Name A–Z</option>
                <option value="price-asc">Sort: Price Low → High</option>
                <option value="price-desc">Sort: Price High → Low</option>
                <option value="newest">Sort: Newest</option>
              </select>
            </div>

            {/* Active filter pills */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {activeFilters.map((f) => (
                  <span
                    key={`${f.type}-${f.value}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                    style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
                  >
                    {f.label}
                    <button onClick={() => removeFilter(f)} className="hover:opacity-70">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <button onClick={clearAllFilters} className="text-xs font-medium ml-1" style={{ color: COLORS.textDim }}>
                  Clear all
                </button>
              </div>
            )}

            {/* Results count */}
            <p className="text-xs mb-4" style={{ color: COLORS.textDim }}>
              <span className="font-semibold" style={{ color: COLORS.text }}>{total}</span> fabrics
            </p>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden animate-pulse">
                    <div className="aspect-square" style={{ backgroundColor: `${COLORS.primary}1a` }} />
                    <div className="p-2.5 space-y-1.5">
                      <div className="h-2.5 rounded w-3/4" style={{ backgroundColor: `${COLORS.primary}33` }} />
                      <div className="h-2 rounded w-1/2" style={{ backgroundColor: `${COLORS.primary}1a` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : fabrics.length === 0 ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-16 text-center">
                <ShoppingBagLargeIcon size={48} color={COLORS.primary} />
                <p className="text-base font-medium mt-4 mb-1" style={{ color: COLORS.text }}>No fabrics found</p>
                <p className="text-sm mb-4" style={{ color: COLORS.textDim }}>
                  {activeFilterCount > 0 ? 'Try adjusting your filters.' : 'More fabrics coming soon.'}
                </p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="text-sm font-medium" style={{ color: COLORS.primary }}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {fabrics.map((fabric) => (
                  <FabricCard key={fabric.id} fabric={fabric} onAddToCart={handleAddToCart} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8 pb-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded text-xs disabled:opacity-40"
                  style={{ color: COLORS.textDim }}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  if (totalPages > 7) {
                    if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className="w-7 h-7 rounded text-xs font-medium"
                          style={{
                            backgroundColor: p === page ? COLORS.primary : 'transparent',
                            color: p === page ? COLORS.text : COLORS.textDim,
                          }}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === page - 2 || p === page + 2) {
                      return <span key={p} className="text-xs" style={{ color: COLORS.textDim }}>…</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-7 h-7 rounded text-xs font-medium"
                      style={{
                        backgroundColor: p === page ? COLORS.primary : 'transparent',
                        color: p === page ? COLORS.text : COLORS.textDim,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded text-xs disabled:opacity-40"
                  style={{ color: COLORS.textDim }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FabricCard({
  fabric,
  onAddToCart,
}: {
  fabric: ShopFabric;
  onAddToCart: (f: ShopFabric) => void;
}) {
  const price = fabric.pricePerYard ? `$${Number(fabric.pricePerYard).toFixed(2)}` : '—';

  return (
    <div className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
      {/* Swatch */}
      <div className="aspect-square relative overflow-hidden bg-[var(--color-bg)]">
        {fabric.imageUrl.startsWith('/') ? (
          <img
            src={fabric.imageUrl}
            alt={fabric.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : fabric.hex ? (
          <div className="w-full h-full" style={{ backgroundColor: fabric.hex }} />
        ) : null}
      </div>

      {/* Info */}
      <div className="p-2.5 space-y-0.5">
        <h3 className="text-[11px] font-medium leading-snug" style={{ color: COLORS.text }}>
          {fabric.name}
        </h3>
        {fabric.collection && (
          <p className="text-[10px]" style={{ color: COLORS.textDim }}>
            {fabric.collection}
          </p>
        )}
        {fabric.description && (
          <p className="text-[10px] line-clamp-2 leading-tight" style={{ color: COLORS.textDim }}>
            {fabric.description.split('\n')[0]}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold" style={{ color: COLORS.text }}>
            {price}<span className="text-[10px] font-normal" style={{ color: COLORS.textDim }}>/yd</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddToCart(fabric)}
          disabled={!fabric.inStock || !fabric.shopifyVariantId}
          className="w-full mt-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: COLORS.primary,
            color: COLORS.text,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS_HOVER.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
        >
          {!fabric.shopifyVariantId ? 'Coming Soon' : !fabric.inStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
