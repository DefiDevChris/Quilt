'use client';

import { useState, useEffect, useRef } from 'react';
import { useBlockStore } from '@/stores/blockStore';

const CATEGORIES = [
  '',
  'Traditional',
  'Log Cabin',
  'Stars',
  'Pinwheel',
  'Flying Geese',
  'Triangles',
  'Squares',
  'Diamonds',
  'Modern',
  'Curves',
  'Hexagons',
  'Dresden',
  'Appliqué',
  'Foundation Paper Piecing',
  "Mariner's Compass",
];

export function BlockSearch() {
  const search = useBlockStore((s) => s.search);
  const category = useBlockStore((s) => s.category);
  const setSearch = useBlockStore((s) => s.setSearch);
  const setCategory = useBlockStore((s) => s.setCategory);
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(localSearch);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch, setSearch]);

  return (
    <div className="px-3 py-2 space-y-2 border-b border-[var(--color-border)]">
      <label htmlFor="block-search" className="sr-only">Search blocks</label>
      <input
        id="block-search"
        type="text"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder="Search blocks..."
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-primary focus:outline-none"
      />
      <label htmlFor="block-category-filter" className="sr-only">Filter by category</label>
      <select
        id="block-category-filter"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-primary focus:outline-none"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat || 'All Categories'}
          </option>
        ))}
      </select>
    </div>
  );
}
