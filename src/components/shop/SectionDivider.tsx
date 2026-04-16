'use client';

import { COLORS } from '@/lib/design-system';

interface SectionDividerProps {
  icon?: 'scissors' | 'spool' | 'needle' | 'thimble' | 'ruler' | 'pincushion';
  background?: string;
}

const iconMap = {
  scissors: '/icons/quilt-04-scissors-Photoroom.png',
  spool: '/icons/quilt-01-spool-Photoroom.png',
  needle: '/icons/quilt-02-needle-Photoroom.png',
  thimble: '/icons/quilt-07-thimble-Photoroom.png',
  ruler: '/icons/quilt-12-ruler-Photoroom.png',
  pincushion: '/icons/quilt-10-pincushion-Photoroom.png',
};

export default function SectionDivider({
  icon = 'scissors',
  background,
}: SectionDividerProps) {
  return (
    <div
      className="relative w-full"
      style={{ backgroundColor: background ?? COLORS.bg }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative flex items-center">
          {/* Dashed line */}
          <div
            className="flex-1 border-t-2 border-dashed"
            style={{ borderColor: `${COLORS.primary}80` }}
          />
          {/* Icon badge */}
          <div
            className="mx-6 flex-shrink-0 w-12 h-12 flex items-center justify-center"
          >
            <img
              src={iconMap[icon]}
              alt=""
              className="w-full h-full object-contain"
              aria-hidden="true"
            />
          </div>
          {/* Dashed line */}
          <div
            className="flex-1 border-t-2 border-dashed"
            style={{ borderColor: `${COLORS.primary}80` }}
          />
        </div>
      </div>
    </div>
  );
}
