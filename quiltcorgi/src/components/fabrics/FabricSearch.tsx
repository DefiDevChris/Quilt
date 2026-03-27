'use client';

import { useState, useEffect, useRef } from 'react';
import { useFabricStore } from '@/stores/fabricStore';
import { COLOR_FAMILIES } from '@/lib/constants';

export function FabricSearch() {
  const search = useFabricStore((s) => s.search);
  const colorFamily = useFabricStore((s) => s.colorFamily);
  const setSearch = useFabricStore((s) => s.setSearch);
  const setColorFamily = useFabricStore((s) => s.setColorFamily);

  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch, search, setSearch]);

  return (
    <div className="px-3 py-2 space-y-2 border-b border-outline-variant">
      <input
        type="text"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder="Search fabrics..."
        className="w-full rounded-sm border border-outline-variant bg-surface px-2 py-1 text-xs text-on-surface placeholder:text-secondary focus:border-primary focus:outline-none"
      />
      <select
        value={colorFamily}
        onChange={(e) => setColorFamily(e.target.value)}
        className="w-full rounded-sm border border-outline-variant bg-surface px-2 py-1 text-xs text-on-surface focus:border-primary focus:outline-none"
      >
        <option value="">All Colors</option>
        {COLOR_FAMILIES.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>
    </div>
  );
}
