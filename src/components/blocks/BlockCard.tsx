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
      className={`group relative flex flex-col items-center rounded-lg border p-2 transition-colors duration-150 ${block.isLocked
          ? 'opacity-70 border-[#d4d4d4] bg-[var(--color-bg)]'
          : isSelected
            ? 'border-[#ff8d49] bg-[#ff8d49]/10 ring-2 ring-[#ff8d49]/30 cursor-pointer'
            : isDragging
              ? 'opacity-50 border-[#ff8d49] bg-[#ff8d49]/5'
              : 'border-[#d4d4d4] bg-[var(--color-bg)] cursor-grab active:cursor-grabbing hover:border-[#ff8d49]/50'
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
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-bg)]">
        {block.svgData ? (
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
          <div className="flex h-full w-full items-center justify-center text-2xl text-[#4a4a4a]">
            ◇
          </div>
        )}

        {block.isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/80">
            <span className="text-lg" title="Pro required">
              🔒
            </span>
          </div>
        )}
      </div>

      <span className="mt-1 text-center text-[14px] leading-[20px] text-[#4a4a4a] line-clamp-2">
        {block.name}
      </span>
    </div>
  );
}
