'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { Search, SlidersHorizontal, ShoppingBag, X, Sparkles, Package } from 'lucide-react';
import { QuiltPieceRow } from '@/components/decorative/QuiltPiece';
import { COLORS, SHADOW, COLORS_HOVER } from '@/lib/design-system';
import {
  CharmPackIcon,
  JellyRollIcon,
  LayerCakeIcon,
  FabricByYardIcon,
  QuiltingNotionsIcon,
  BattingIcon,
  QuiltPatternIcon,
  ThreadIcon,
  ShoppingBagLargeIcon,
} from '@/components/shop/ShopIcons';

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

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  image?: string;
}

const CATEGORIES: Category[] = [
  { id: 'charm-packs', name: '5" Charm Packs', description: 'Pre-cut 5" squares', icon: CharmPackIcon, image: '/images/shop/charm-packs.jpg' },
  { id: 'jelly-rolls', name: '2.5" Jelly Rolls', description: 'Pre-cut strips', icon: JellyRollIcon, image: '/images/shop/jelly-rolls.jpg' },
  { id: 'layer-cakes', name: '10" Layer Cakes', description: 'Pre-cut 10" squares', icon: LayerCakeIcon, image: '/images/shop/layer-cakes.jpg' },
  { id: 'by-the-yard', name: 'Fabric by the Yard', description: 'Cut to your needs', icon: FabricByYardIcon, image: '/images/shop/fabric-by-yard.jpg' },
  { id: 'notions', name: 'Quilting Notions', description: 'Tools & supplies', icon: QuiltingNotionsIcon, image: '/images/shop/quilting-notions.jpg' },
  { id: 'batting', name: 'Batting & Backing', description: 'Foundation fabrics', icon: BattingIcon, image: '/images/shop/batting-backing.jpg' },
  { id: 'patterns', name: 'Quilt Patterns', description: 'Design inspiration', icon: QuiltPatternIcon, image: '/images/shop/quilt-patterns.jpg' },
  { id: 'thread', name: 'Quilting Thread', description: 'Premium threads', icon: ThreadIcon, image: '/images/shop/quilting-thread.jpg' },
];

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
  const [activeCategory, setActiveCategory] = useState<string>('all');

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
      if (activeCategory !== 'all') params.set('category', activeCategory);
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
  }, [search, manufacturer, colorFamily, valueFilter, inStockOnly, activeCategory, sort, page]);

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
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 rounded-full w-48 mx-auto" style={{ backgroundColor: `${COLORS.primary}33` }} />
          <div className="h-4 rounded-full w-32 mx-auto" style={{ backgroundColor: `${COLORS.primary}1a` }} />
        </div>
      </div>
    );
  }

  // Shop not enabled
  if (!shopEnabled) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center relative overflow-hidden">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-12 text-center max-w-md relative z-10" style={{ boxShadow: SHADOW.brand }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${COLORS.primary}1a` }}>
            <ShoppingBag size={28} style={{ color: COLORS.primary }} />
          </div>
          <h1
            className="text-[32px] leading-[40px] font-semibold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            Shop Coming Soon
          </h1>
          <p style={{ color: COLORS.textDim }}>
            Our fabric shop is being set up. Check back soon for a curated selection of quilting
            fabrics!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 50%, ${COLORS.accent} 100%)` }}>
        {/* Background image overlay */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/shop/hero-fabric-drapes.jpg"
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </div>
        
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute top-20 right-20 w-48 h-48 rounded-full border-4 border-white" />
          <div className="absolute bottom-12 left-1/4 w-24 h-24 rounded-full border-4 border-white" />
          <div className="absolute bottom-20 right-1/3 w-40 h-40 rounded-full border-4 border-white" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <QuiltPieceRow count={3} size={12} gap={5} />
            </div>
            <h1
              className="text-[48px] sm:text-[56px] leading-[1.1] font-semibold mb-4"
              style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}
            >
              Fabric Shop
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Discover our curated collection of premium quilting fabrics, pre-cuts, and notions
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => document.getElementById('browse-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3 rounded-full font-semibold transition-colors duration-150"
                style={{
                  backgroundColor: '#ffffff',
                  color: COLORS.primary,
                  boxShadow: SHADOW.brand,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${COLORS.bg}`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                Browse Fabrics
              </button>
              <button
                onClick={() => document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3 rounded-full font-semibold transition-colors duration-150 border-2"
                style={{
                  borderColor: '#ffffff',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Shop by Category
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="var(--color-bg)" />
          </svg>
        </div>
      </div>

      {/* Categories Section */}
      <div id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2
            className="text-[32px] leading-[40px] font-semibold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            Shop by Category
          </h2>
          <p style={{ color: COLORS.textDim }}>Find exactly what you need for your next project</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(isActive ? 'all' : category.id);
                  setPage(1);
                }}
                className="group bg-[var(--color-surface)] border rounded-lg overflow-hidden text-left transition-colors duration-150 hover:bg-[var(--color-bg)]"
                style={{
                  borderColor: isActive ? COLORS.primary : COLORS.border,
                  boxShadow: SHADOW.brand,
                }}
              >
                {/* Category image */}
                {category.image && (
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-colors duration-150"
                      style={{
                        filter: isActive ? 'none' : 'grayscale(30%) brightness(0.9)',
                      }}
                      loading="lazy"
                    />
                    {/* Overlay gradient */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: isActive 
                          ? `linear-gradient(to top, ${COLORS.primary}40 0%, transparent 60%)`
                          : 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 60%)',
                      }}
                    />
                  </div>
                )}
                
                {/* Category info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IconComponent size={20} color={isActive ? COLORS.primary : COLORS.textDim} />
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: isActive ? COLORS.primary : COLORS.text }}
                    >
                      {category.name}
                    </h3>
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textDim }}>
                    {category.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Browse Section */}
      <div id="browse-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Search + Filter Bar */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 mb-6" style={{ boxShadow: SHADOW.brand }}>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textDim }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fabrics by name, manufacturer, or collection..."
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full text-sm placeholder:text-[var(--color-text-dim)]"
                style={{ color: COLORS.text, outlineColor: COLORS.primary }}
              />
            </form>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors duration-150 ${showFilters || hasActiveFilters
                ? ''
                : 'bg-[var(--color-bg)] hover:bg-[var(--color-border)]'
                }`}
              style={{
                ...(showFilters || hasActiveFilters
                  ? { backgroundColor: COLORS.primary, color: COLORS.text }
                  : { color: COLORS.textDim }),
              }}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-[var(--color-surface)]" />}
            </button>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption);
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-full text-sm bg-[var(--color-bg)] border focus:outline-2"
              style={{ color: COLORS.text, borderColor: COLORS.border, outlineColor: COLORS.primary }}
            >
              <option value="name">Name A-Z</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: COLORS.text }}>Refine Your Search</h3>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs transition-colors duration-150"
                    style={{ color: COLORS.primary }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: COLORS.textDim }}>Manufacturer</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => {
                      setManufacturer(e.target.value);
                      setPage(1);
                    }}
                    placeholder="All manufacturers"
                    className="w-full px-3 py-2 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-sm focus:outline-2"
                    style={{ color: COLORS.text, outlineColor: COLORS.primary }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: COLORS.textDim }}>Color Family</label>
                  <select
                    value={colorFamily}
                    onChange={(e) => {
                      setColorFamily(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-sm focus:outline-2"
                    style={{ color: COLORS.text, outlineColor: COLORS.primary }}
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
                  <label className="text-xs font-medium" style={{ color: COLORS.textDim }}>Value</label>
                  <select
                    value={valueFilter}
                    onChange={(e) => {
                      setValueFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-sm focus:outline-2"
                    style={{ color: COLORS.text, outlineColor: COLORS.primary }}
                  >
                    <option value="">All values</option>
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Dark">Dark</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: COLORS.textDim }}>Availability</label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => {
                        setInStockOnly(e.target.checked);
                        setPage(1);
                      }}
                      className="rounded-full border text-[var(--color-text)] focus:outline-2"
                      style={{ borderColor: COLORS.border, outlineColor: COLORS.primary }}
                    />
                    <span className="text-sm" style={{ color: COLORS.text }}>In stock only</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package size={18} style={{ color: COLORS.primary }} />
            <p className="text-sm font-medium" style={{ color: COLORS.text }}>
              {total} fabric{total !== 1 ? 's' : ''} found
            </p>
            {activeCategory !== 'all' && (
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{ backgroundColor: `${COLORS.primary}20`, color: COLORS.primary }}
              >
                {CATEGORIES.find(c => c.id === activeCategory)?.name}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs transition-colors duration-150"
              style={{ color: COLORS.primary }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
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
              <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden animate-pulse" style={{ boxShadow: SHADOW.brand }}>
                <div className="aspect-square" style={{ backgroundColor: `${COLORS.primary}1a` }} />
                <div className="p-3 space-y-2">
                  <div className="h-4 rounded-full w-3/4" style={{ backgroundColor: `${COLORS.primary}33` }} />
                  <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: `${COLORS.primary}1a` }} />
                  <div className="h-8 rounded-full mt-2" style={{ backgroundColor: `${COLORS.primary}1a` }} />
                </div>
              </div>
            ))}
          </div>
        ) : fabrics.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-12 text-center" style={{ boxShadow: SHADOW.brand }}>
            <div className="flex justify-center mb-4">
              <ShoppingBagLargeIcon size={64} color={COLORS.primary} />
            </div>
            <p className="text-lg font-medium mb-2" style={{ color: COLORS.text }}>No fabrics found</p>
            <p className="text-sm" style={{ color: COLORS.textDim }}>
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
              className="px-5 py-2 rounded-full bg-[var(--color-surface)] border text-sm hover:bg-[var(--color-bg)] disabled:opacity-50 transition-colors duration-150"
              style={{ borderColor: COLORS.border, color: COLORS.textDim, boxShadow: SHADOW.brand }}
            >
              Previous
            </button>
            <span className="text-sm" style={{ color: COLORS.textDim }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-5 py-2 rounded-full bg-[var(--color-surface)] border text-sm hover:bg-[var(--color-bg)] disabled:opacity-50 transition-colors duration-150"
              style={{ borderColor: COLORS.border, color: COLORS.textDim, boxShadow: SHADOW.brand }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Newsletter / Community Section */}
      <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles size={24} style={{ color: COLORS.primary }} />
            </div>
            <h2
              className="text-[32px] leading-[40px] font-semibold mb-3"
              style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
            >
              Join the QuiltCorgi Community
            </h2>
            <p className="mb-6" style={{ color: COLORS.textDim }}>
              Get notified about new fabrics, exclusive collections, and quilting inspiration delivered to your inbox.
            </p>
            <div className="flex items-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-2"
                style={{ color: COLORS.text, outlineColor: COLORS.primary }}
              />
              <button
                className="px-6 py-3 rounded-full font-semibold transition-colors duration-150 whitespace-nowrap"
                style={{
                  backgroundColor: COLORS.primary,
                  color: COLORS.text,
                  boxShadow: SHADOW.brand,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS_HOVER.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
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
    <div className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden transition-colors duration-150" style={{ boxShadow: SHADOW.brand }}>
      {/* Swatch */}
      <div className="aspect-square relative overflow-hidden bg-[var(--color-bg)]">
        {fabric.hex ? (
          <div className="w-full h-full" style={{ backgroundColor: fabric.hex }} />
        ) : (
          <img
            src={fabric.thumbnailUrl ?? fabric.imageUrl}
            alt={fabric.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        
        {/* Stock badge */}
        {!fabric.inStock && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${COLORS.error}20`, color: COLORS.error }}>
            Out of Stock
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-medium truncate" style={{ color: COLORS.text }} title={fabric.name}>
          {fabric.name}
        </h3>
        {fabric.manufacturer && (
          <p className="text-xs truncate" style={{ color: COLORS.textDim }}>{fabric.manufacturer}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{price}</span>
          {fabric.colorFamily && (
            <span 
              className="text-[10px] capitalize px-2 py-0.5 rounded-full" 
              style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
            >
              {fabric.colorFamily}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAddToCart(fabric)}
          disabled={!fabric.inStock || !fabric.shopifyVariantId}
          className="mt-2 w-full py-2 rounded-full text-xs font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: COLORS.primary,
            color: COLORS.text,
            boxShadow: SHADOW.brand,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS_HOVER.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
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
