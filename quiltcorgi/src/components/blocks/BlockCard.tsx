'use client';

import Image from 'next/image';
import type { BlockListItem } from '@/types/block';

interface BlockCardProps {
  block: BlockListItem;
  onPreview: (block: BlockListItem) => void;
  onDragStart: (e: React.DragEvent, block: BlockListItem) => void;
}

export function BlockCard({ block, onPreview, onDragStart }: BlockCardProps) {
  return (
    <div
      className={`group relative flex flex-col items-center rounded-lg border border-outline-variant bg-surface p-2 transition-shadow hover:shadow-elevation-1 ${
        block.isLocked ? 'opacity-70' : 'cursor-grab active:cursor-grabbing'
      }`}
      draggable={!block.isLocked}
      onDragStart={(e) => {
        if (block.isLocked) {
          e.preventDefault();
          return;
        }
        onDragStart(e, block);
      }}
      onClick={() => onPreview(block)}
    >
      {/* SVG Thumbnail - we use the block ID to fetch SVG on demand */}
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded bg-background">
        {block.thumbnailUrl ? (
          <Image
            src={block.thumbnailUrl}
            alt={block.name}
            width={64}
            height={64}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-secondary">
            ◇
          </div>
        )}

        {block.isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <span className="text-lg" title="Pro required">
              🔒
            </span>
          </div>
        )}
      </div>

      <span className="mt-1 text-center text-[10px] leading-tight text-secondary line-clamp-2">
        {block.name}
      </span>

      {block.isLocked && (
        <span className="mt-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-medium text-primary">
          Pro
        </span>
      )}
    </div>
  );
}
