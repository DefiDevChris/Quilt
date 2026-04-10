'use client';

import React from 'react';
import Image from 'next/image';
import type { BlockListItem } from '@/types/block';

interface BlockCardProps {
  block: BlockListItem;
  onPreview: (block: BlockListItem) => void;
  onDragStart: (e: React.DragEvent, block: BlockListItem) => void;
  isSelected?: boolean;
  onSelect?: (blockId: string) => void;
}

export function BlockCard({ block, onPreview, onDragStart, isSelected, onSelect }: BlockCardProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  return (
    <div
      className={`group relative flex flex-col items-center rounded-full border p-2 transition-all ${block.isLocked
          ? 'opacity-70 border-neutral-200 bg-neutral'
          : isSelected
            ? 'border-primary bg-primary/10 ring-2 ring-primary/30 cursor-pointer'
            : isDragging
              ? 'opacity-50 scale-95 border-primary bg-primary/5'
              : 'border-neutral-200 bg-neutral cursor-grab active:cursor-grabbing hover:shadow'
        }`}
      draggable={!block.isLocked}
      onDragStart={(e) => {
        if (block.isLocked) {
          e.preventDefault();
          return;
        }
        setIsDragging(true);
        onDragStart(e, block);
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={(e) => {
        if (onSelect && !block.isLocked) {
          e.stopPropagation();
          onSelect(block.id);
        } else {
          onPreview(block);
        }
      }}
    >
      {/* Block thumbnail */}
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded bg-neutral">
        {block.svgData ? (
          // SVG blocks (system + custom) — always render actual SVG data
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(block.svgData)}`}
            alt={block.name}
            width={64}
            height={64}
            className="h-full w-full object-contain"
          />
        ) : block.photoUrl ? (
          <Image
            src={block.photoUrl}
            alt={block.name}
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        ) : block.thumbnailUrl ? (
          <Image
            src={block.thumbnailUrl}
            alt={block.name}
            width={64}
            height={64}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-neutral-500">
            ◇
          </div>
        )}

        {block.isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral/80">
            <span className="text-lg" title="Pro required">
              🔒
            </span>
          </div>
        )}
      </div>

      <span className="mt-1 text-center text-caption leading-tight text-neutral-500 line-clamp-2">
        {block.name}
      </span>
    </div>
  );
}
