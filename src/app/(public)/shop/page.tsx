'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { Search, ChevronDown, Sparkles, ShoppingBag } from 'lucide-react';
import { COLORS, SHADOW, COLORS_HOVER, RADIUS, MOTION } from '@/lib/design-system';
import { ShoppingBagLargeIcon } from '@/components/shop/ShopIcons';

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

const MANUFACTURERS = ['Alison Glass', 'Andover Fabrics', 'Charisma Horton', 'Makower UK'];

const COLLECTIONS = [
  'Color Camp - Bloom',
  'Color Camp - Grove',
  'Color Camp - Sun',
  'Countryside Classics',
  'Dream Weaver',
  'Our Simple Life',
  'Snowberry',
];

const THEMES = ['Floral', 'Geometric', 'Modern', 'Solid', 'Tonal', 'Traditional'];

// ─── Collapsible Filter Section ───────────────────────────────────────

function FilterSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 text-sm font-medium"
        style={{ color: COLORS.text, fontFamily: 'var(--font-display)' }}
      >
        {title}
        <ChevronDown
          size={14}
          style={{
            color: COLORS.textDim,
            transition: `transform ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  );
}

// ─── Color Swatch ─────────────────────────────────────────────────────

function ColorSwatch({
  name,
  hex,
  isSelected,
  onClick,
}: {
  name: string;
  hex: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isLight = ['white', 'yellow'].includes(name);
  return (
    <button
      onClick={onClick}
      title={COLOR_SWATCHES[name].label}
      className="w-7 h-7 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: hex,
        border: `2px solid ${isSelected ? COLORS.primary : COLORS.border}`,
        boxShadow: isSelected ? `0 0 0 1px ${COLORS.surface}, 0 0 0 3px ${COLORS.primary}` : 'none',
        transition: `box-shadow ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
      }}
    >
      {isSelected && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke={isLight ? COLORS.text : COLORS.surface}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────

function FilterPanel({
  openSections,
  toggleSection,
  selectedManufacturers,
  setSelectedManufacturers,
  selectedCollections,
  setSelectedCollections,
  selectedColors,
  setSelectedColors,
  selectedThemes,
  setSelectedThemes,
  selectedValue,
  setSelectedValue,
  inStockOnly,
  setInStockOnly,
  onClearAll,
  activeFilterCount,
}: {
  openSections: Record<string, boolean>;
  toggleSection: (s: string) => void;
  selectedManufacturers: string[];
  setSelectedManufacturers: (v: string[]) => void;
  selectedCollections: string[];
  setSelectedCollections: (v: string[]) => void;
  selectedColors: string[];
  setSelectedColors: (v: string[]) => void;
  selectedThemes: string[];
  setSelectedThemes: (v: string[]) => void;
  selectedValue: string;
  setSelectedValue: (v: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  onClearAll: () => void;
  activeFilterCount: number;
}) {
  const toggle = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  return (
    <div>
      {activeFilterCount > 0 && (
        <button
          onClick={onClearAll}
          className="w-full mb-4 py-2 text-xs font-medium rounded-full"
          style={{
            backgroundColor: `${COLORS.primary}12`,
            color: COLORS.primary,
          }}
        >
          Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
        </button>
      )}

      <FilterSection
        title="Collections"
        isOpen={openSections.collection}
        onToggle={() => toggleSection('collection')}
      >
        <div className="space-y-1.5">
          {COLLECTIONS.map((c) => (
            <label key={c} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCollections.includes(c)}
                onChange={() => toggle(selectedCollections, setSelectedCollections, c)}
                className="rounded accent-[var(--color-primary)] w-3.5 h-3.5"
              />
              <span className="text-[13px]" style={{ color: COLORS.textDim }}>
                {c}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Manufacturer"
        isOpen={openSections.manufacturer}
        onToggle={() => toggleSection('manufacturer')}
      >
        <div className="space-y-1.5">
          {MANUFACTURERS.map((m) => (
            <label key={m} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedManufacturers.includes(m)}
                onChange={() => toggle(selectedManufacturers, setSelectedManufacturers, m)}
                className="rounded accent-[var(--color-primary)] w-3.5 h-3.5"
              />
              <span className="text-[13px]" style={{ color: COLORS.textDim }}>
                {m}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Color"
        isOpen={openSections.color}
        onToggle={() => toggleSection('color')}
      >
        <div className="grid grid-cols-6 gap-1.5">
          {Object.entries(COLOR_SWATCHES).map(([name, { hex }]) => (
            <ColorSwatch
              key={name}
              name={name}
              hex={hex}
              isSelected={selectedColors.includes(name)}
              onClick={() => toggle(selectedColors, setSelectedColors, name)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Style"
        isOpen={openSections.theme}
        onToggle={() => toggleSection('theme')}
      >
        <div className="space-y-1.5">
          {THEMES.map((t) => (
            <label key={t} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedThemes.includes(t)}
                onChange={() => toggle(selectedThemes, setSelectedThemes, t)}
                className="rounded accent-[var(--color-primary)] w-3.5 h-3.5"
              />
              <span className="text-[13px]" style={{ color: COLORS.textDim }}>
                {t}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Value"
        isOpen={openSections.value}
        onToggle={() => toggleSection('value')}
      >
        <div className="space-y-1.5">
          {['Light', 'Medium', 'Dark'].map((v) => (
            <label key={v} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="value-filter"
                checked={selectedValue === v}
                onChange={() => setSelectedValue(selectedValue === v ? '' : v)}
                className="accent-[var(--color-primary)] w-3.5 h-3.5"
              />
              <span className="text-[13px]" style={{ color: COLORS.textDim }}>
                {v}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <div className="pt-3">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded accent-[var(--color-primary)] w-3.5 h-3.5"
          />
          <span className="text-[13px] font-medium" style={{ color: COLORS.text }}>
            In Stock Only
          </span>
        </label>
      </div>
    </div>
  );
}

// ─── Fabric Card ──────────────────────────────────────────────────────

function FabricCard({
  fabric,
  onAddToCart,
}: {
  fabric: ShopFabric;
  onAddToCart: (f: ShopFabric) => void;
}) {
  const price = fabric.pricePerYard ? `$${Number(fabric.pricePerYard).toFixed(2)}` : '';
  const isAvailable = fabric.inStock && fabric.shopifyVariantId;

  return (
    <div>
      {/* Image */}
      <div
        className="aspect-square overflow-hidden mb-3 bg-[var(--color-bg)]"
        style={{ borderRadius: RADIUS.lg }}
      >
        {fabric.imageUrl.startsWith('/') ? (
          <img
            src={fabric.imageUrl}
            alt={fabric.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : fabric.hex ? (
          <div className="w-full h-full" style={{ backgroundColor: fabric.hex }} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.primary}10` }}
          >
            <Sparkles size={20} style={{ color: COLORS.primary, opacity: 0.3 }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        {fabric.collection && (
          <p
            className="text-[11px] uppercase tracking-wide mb-1"
            style={{ color: COLORS.primary, fontFamily: 'var(--font-display)' }}
          >
            {fabric.collection}
          </p>
        )}
        <h3
          className="text-[14px] font-medium leading-snug"
          style={{ color: COLORS.text, fontFamily: 'var(--font-display)' }}
        >
          {fabric.name}
        </h3>
        {fabric.manufacturer && (
          <p className="text-[12px] mt-0.5" style={{ color: COLORS.textDim }}>
            {fabric.manufacturer}
          </p>
        )}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[14px] font-semibold" style={{ color: COLORS.text }}>
            {price}
            <span className="text-[11px] font-normal" style={{ color: COLORS.textDim }}>
              /yd
            </span>
          </span>
          <button
            type="button"
            onClick={() => onAddToCart(fabric)}
            disabled={!isAvailable}
            className="px-3.5 py-1.5 text-[11px] font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isAvailable ? COLORS.primary : `${COLORS.primary}22`,
              color: isAvailable ? COLORS.text : COLORS.textDim,
              borderRadius: RADIUS.full,
              transition: `background-color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
            }}
            onMouseEnter={(e) => {
              if (isAvailable) e.currentTarget.style.backgroundColor = COLORS_HOVER.primary;
            }}
            onMouseLeave={(e) => {
              if (isAvailable) e.currentTarget.style.backgroundColor = COLORS.primary;
            }}
          >
            {!fabric.shopifyVariantId
              ? 'Coming Soon'
              : !fabric.inStock
                ? 'Out of Stock'
                : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    collection: true,
    manufacturer: false,
    color: false,
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
  }, [
    search,
    selectedManufacturers,
    selectedCollections,
    selectedColors,
    selectedValue,
    inStockOnly,
    sort,
    page,
  ]);

  useEffect(() => {
    if (shopEnabled) fetchFabrics();
  }, [shopEnabled, fetchFabrics]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
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

  // ─── Loading ────────────────────────────────────────────────────

  if (shopEnabled === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <div
          className="w-8 h-8 rounded-full animate-pulse"
          style={{ backgroundColor: `${COLORS.primary}33` }}
        />
      </div>
    );
  }

  if (!shopEnabled) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${COLORS.primary}10` }}
          >
            <ShoppingBag size={24} style={{ color: COLORS.primary }} />
          </div>
          <h1
            className="text-[28px] font-semibold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            Shop Coming Soon
          </h1>
          <p style={{ color: COLORS.textDim }}>
            We are curating our fabric collection. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 py-10">
          <p
            className="text-[11px] uppercase tracking-wide mb-2 font-medium"
            style={{ color: COLORS.primary, fontFamily: 'var(--font-display)' }}
          >
            Fabric Shop
          </p>
          <h1
            className="text-[36px] sm:text-[44px] font-semibold leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            Beautiful Fabrics
            <br />
            <span style={{ color: COLORS.primary }}>for Your Next Quilt</span>
          </h1>
          <p className="text-[16px] mt-3 max-w-lg" style={{ color: COLORS.textDim }}>
            Premium cotton fabrics from top designers. Hand-picked for quilters who care about every
            stitch.
          </p>
        </div>
      </div>

      {/* ── Main: sidebar + grid ─────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="flex gap-10">
          {/* Sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-24">
              <h2
                className="text-[13px] font-semibold mb-3 pb-2 border-b border-[var(--color-border)]"
                style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
              >
                Filters
              </h2>
              <FilterPanel
                openSections={openSections}
                toggleSection={toggleSection}
                selectedManufacturers={selectedManufacturers}
                setSelectedManufacturers={setSelectedManufacturers}
                selectedCollections={selectedCollections}
                setSelectedCollections={setSelectedCollections}
                selectedColors={selectedColors}
                setSelectedColors={setSelectedColors}
                selectedThemes={selectedThemes}
                setSelectedThemes={setSelectedThemes}
                selectedValue={selectedValue}
                setSelectedValue={setSelectedValue}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                onClearAll={clearAllFilters}
                activeFilterCount={activeFilterCount}
              />
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Search + sort */}
            <div className="flex items-center gap-3 mb-6">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: COLORS.textDim }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search fabrics"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
                  style={{
                    borderRadius: RADIUS.full,
                    color: COLORS.text,
                  }}
                />
              </form>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortOption);
                  setPage(1);
                }}
                className="px-4 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)]"
                style={{
                  borderRadius: RADIUS.full,
                  color: COLORS.textDim,
                }}
              >
                <option value="name">Name A to Z</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Count */}
            <p className="text-[13px] mb-6" style={{ color: COLORS.textDim }}>
              <span className="font-semibold" style={{ color: COLORS.text }}>
                {total}
              </span>{' '}
              fabric{total !== 1 ? 's' : ''}
            </p>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-8">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div
                      className="aspect-square mb-3"
                      style={{ backgroundColor: `${COLORS.primary}10`, borderRadius: RADIUS.lg }}
                    />
                    <div
                      className="h-3 w-2/3 mb-1.5 rounded"
                      style={{ backgroundColor: `${COLORS.primary}15` }}
                    />
                    <div
                      className="h-3 w-1/3 rounded"
                      style={{ backgroundColor: `${COLORS.primary}0d` }}
                    />
                  </div>
                ))}
              </div>
            ) : fabrics.length === 0 ? (
              <div className="py-20 text-center">
                <ShoppingBag size={32} style={{ color: COLORS.textDim, margin: '0 auto' }} />
                <p className="text-[16px] font-medium mt-4 mb-1" style={{ color: COLORS.text }}>
                  No fabrics found
                </p>
                <p className="text-[13px]" style={{ color: COLORS.textDim }}>
                  {activeFilterCount > 0
                    ? 'Try adjusting your filters.'
                    : 'More fabrics are being added soon.'}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[13px] font-medium mt-4 px-4 py-2 rounded-full"
                    style={{ color: COLORS.primary, backgroundColor: `${COLORS.primary}10` }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-8">
                {fabrics.map((fabric) => (
                  <FabricCard key={fabric.id} fabric={fabric} onAddToCart={handleAddToCart} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-12 pb-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3.5 py-1.5 text-[13px] font-medium disabled:opacity-40 rounded-full"
                  style={{ color: COLORS.textDim }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = `${COLORS.primary}10`)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 text-[13px] font-medium rounded-full"
                      style={{
                        backgroundColor: p === page ? COLORS.primary : 'transparent',
                        color: p === page ? COLORS.text : COLORS.textDim,
                        transition: `background-color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3.5 py-1.5 text-[13px] font-medium disabled:opacity-40 rounded-full"
                  style={{ color: COLORS.textDim }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = `${COLORS.primary}10`)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
