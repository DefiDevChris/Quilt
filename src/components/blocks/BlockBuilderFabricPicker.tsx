'use client';

import { useEffect, useState } from 'react';
import { useFabricStore } from '@/stores/fabricStore';
import type { FabricListItem } from '@/types/fabric';

interface BlockBuilderFabricPickerProps {
  onFabricDragStart: (e: React.DragEvent, fabricId: string) => void;
}

export function BlockBuilderFabricPicker({ onFabricDragStart }: BlockBuilderFabricPickerProps) {
  const fabricItems = useFabricStore((s) => s.fabrics);
  const isLoading = useFabricStore((s) => s.isLoading);
  const fetchFabrics = useFabricStore((s) => s.fetchFabrics);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (fabricItems.length === 0 && !isLoading) {
      fetchFabrics();
    }
  }, [fabricItems.length, isLoading, fetchFabrics]);

  const filtered = fabricItems.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.manufacturer?.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-full bg-primary/10/40 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2 border-b border-neutral-200/15">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fabrics..."
          className="w-full rounded-full border border-neutral-200 bg-neutral px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
        />
      </div>

      {/* Fabric grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {filtered.slice(0, 60).map((fabric) => (
            <FabricSwatch
              key={fabric.id}
              fabric={fabric}
              onDragStart={onFabricDragStart}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-xs text-neutral-500 py-8">No fabrics found</div>
        )}
        {filtered.length > 60 && (
          <div className="text-center text-xs text-neutral-500 py-4">
            Showing 60 of {filtered.length}
          </div>
        )}
      </div>
    </div>
  );
}

function FabricSwatch({
  fabric,
  onDragStart,
}: {
  fabric: FabricListItem;
  onDragStart: (e: React.DragEvent, fabricId: string) => void;
}) {
  const imgSrc = fabric.thumbnailUrl || fabric.imageUrl;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, fabric.id)}
      className="group relative cursor-grab rounded-full border border-neutral-200 overflow-hidden hover:border-primary transition-colors"
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
          <div
            className="h-full w-full"
            style={{ backgroundColor: fabric.hex || '#ccc' }}
          />
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-neutral px-1 pb-0.5 pt-2">
        <p className="text-[9px] text-neutral-800 truncate">{fabric.name}</p>
      </div>
    </div>
  );
}
