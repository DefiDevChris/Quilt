'use client';

import type { FabricListItem } from '@/types/fabric';

interface FabricThumbnailProps {
  fabric: FabricListItem;
  className?: string;
  imgClassName?: string;
}

/**
 * Shared fabric thumbnail that renders a hex swatch fallback or the
 * fabric image. Used by FabricCard and FabricBrowseCard.
 */
export function FabricThumbnail({
  fabric,
  className = '',
  imgClassName = '',
}: FabricThumbnailProps) {
  if (fabric.hex) {
    return (
      <div
        className={`w-full h-full ${className}`}
        style={{ backgroundColor: fabric.hex }}
      />
    );
  }

  return (
    <img
      src={fabric.thumbnailUrl ?? fabric.imageUrl}
      alt={fabric.name}
      className={`w-full h-full object-cover ${imgClassName}`}
      loading="lazy"
    />
  );
}
