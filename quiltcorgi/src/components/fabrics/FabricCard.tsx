'use client';

import type { FabricListItem } from '@/types/fabric';

interface FabricCardProps {
  fabric: FabricListItem;
  onDragStart: (e: React.DragEvent, fabric: FabricListItem) => void;
}

export function FabricCard({ fabric, onDragStart }: FabricCardProps) {
  const imgSrc = fabric.thumbnailUrl ?? fabric.imageUrl;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, fabric)}
      className="group relative cursor-grab rounded-lg border border-outline-variant bg-background overflow-hidden hover:border-primary transition-colors"
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
          <div className="h-full w-full flex items-center justify-center bg-outline-variant">
            <span className="text-2xl text-secondary">🧵</span>
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-white truncate">{fabric.name}</p>
        {fabric.manufacturer && (
          <p className="text-[9px] text-white/70 truncate">{fabric.manufacturer}</p>
        )}
      </div>
    </div>
  );
}
