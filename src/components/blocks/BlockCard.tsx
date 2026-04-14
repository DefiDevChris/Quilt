'use client';

import React from 'react';
import Image from 'next/image';
import type { BlockListItem } from '@/types/block';
import { COLORS } from '@/lib/design-system';

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
      role="button"
      tabIndex={0}
      aria-label={`Block: ${block.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onSelect && !block.isLocked) {
            onSelect(block.id);
          } else {
            onPreview(block);
          }
        }
      }}
      className={`group relative flex flex-col items-center rounded-lg border p-2 transition-colors duration-150 ${
        block.isLocked
          ? 'opacity-70 border-[var(--color-border)] bg-[var(--color-bg)]'
          : isSelected
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-2 ring-[var(--color-primary)]/30 cursor-pointer'
            : isDragging
              ? 'opacity-50 border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-[var(--color-border)] bg-[var(--color-bg)] cursor-grab active:cursor-grabbing hover:border-[var(--color-primary)]/50'
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
          <div className="flex h-full w-full items-center justify-center text-2xl text-[var(--color-text-dim)]">
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

      <span className="mt-1 text-center text-[14px] leading-[20px] text-[var(--color-text-dim)] line-clamp-2">
        {block.name}
      </span>
    </div>
  );
}
