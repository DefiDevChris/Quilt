'use client';

import type { CommunityCategory } from '@/types/community';

interface CategoryBadgeProps {
  category: CommunityCategory;
}

const CATEGORY_STYLES: Record<CommunityCategory, { bg: string; text: string; label: string }> = {
  'show-and-tell': { bg: 'bg-[#8d4f00]/15', text: 'text-[#8d4f00]', label: 'Show & Tell' },
  wip: { bg: 'bg-[#1a73e8]/15', text: 'text-[#1a73e8]', label: 'WIP' },
  help: { bg: 'bg-[#d93025]/15', text: 'text-[#d93025]', label: 'Help' },
  inspiration: { bg: 'bg-[#7b1fa2]/15', text: 'text-[#7b1fa2]', label: 'Inspiration' },
  general: { bg: 'bg-[#5f6368]/15', text: 'text-[#5f6368]', label: 'General' },
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const style = CATEGORY_STYLES[category];

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
