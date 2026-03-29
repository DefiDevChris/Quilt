'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import type { PatternTemplateListItem } from '@/types/pattern-template';

interface PatternCardProps {
  pattern: PatternTemplateListItem;
  onPreview: (id: string) => void;
}

const FRACTION_MAP: ReadonlyArray<readonly [number, string]> = [
  [0.125, '\u215B'],
  [0.25, '\u00BC'],
  [0.333, '\u2153'],
  [0.375, '\u215C'],
  [0.5, '\u00BD'],
  [0.625, '\u215D'],
  [0.667, '\u2154'],
  [0.75, '\u00BE'],
  [0.875, '\u215E'],
] as const;

function formatDimensionDisplay(inches: number): string {
  const whole = Math.floor(inches);
  const fractional = inches - whole;

  if (fractional < 0.0625) {
    return `${whole}`;
  }

  const match = FRACTION_MAP.find(
    ([value]) => Math.abs(fractional - value) < 0.0625
  );

  if (!match) {
    return `${inches}`;
  }

  const [, glyph] = match;
  return whole > 0 ? `${whole}${glyph}` : glyph;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

const PASTEL_PALETTE = [
  '#F8E8D4', '#E8D4C4', '#D4C4B4', '#F4E4D0',
  '#E0D0C0', '#F0E0D0', '#D8C8B8', '#ECE0D4',
  '#F4DCC8', '#E4D0C0', '#D0C0B0', '#E8DCD0',
  '#F0D8C4', '#DCC8B8', '#C8B8A8', '#E4D4C4',
] as const;

function PlaceholderGrid({ name }: { name: string }) {
  const hash = hashString(name);
  const colors = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const index = (hash + i * 7 + i * i) % PASTEL_PALETTE.length;
      return PASTEL_PALETTE[index];
    });
  }, [hash]);

  return (
    <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-0.5 p-2">
      {colors.map((color, i) => (
        <div
          key={i}
          className="rounded-sm"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

const SKILL_LEVEL_STYLES: Record<
  PatternTemplateListItem['skillLevel'],
  { label: string; bg: string; text: string }
> = {
  beginner: {
    label: 'Beginner',
    bg: 'rgba(74, 124, 89, 0.12)',
    text: '#4a7c59',
  },
  'confident-beginner': {
    label: 'Confident Beginner',
    bg: 'rgba(59, 105, 149, 0.12)',
    text: '#3b6995',
  },
  intermediate: {
    label: 'Intermediate',
    bg: 'rgba(198, 148, 46, 0.12)',
    text: '#a07824',
  },
  advanced: {
    label: 'Advanced',
    bg: 'rgba(212, 114, 106, 0.12)',
    text: '#b85a53',
  },
};

export function PatternCard({ pattern, onPreview }: PatternCardProps) {
  const skill = SKILL_LEVEL_STYLES[pattern.skillLevel];
  const dimensions = `${formatDimensionDisplay(pattern.finishedWidth)}\u2033 \u00D7 ${formatDimensionDisplay(pattern.finishedHeight)}\u2033`;

  return (
    <article
      className="group flex flex-col rounded-[var(--radius-lg)] overflow-hidden transition-shadow duration-300"
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        boxShadow: 'var(--shadow-elevation-1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-elevation-2)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-elevation-1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-[3/2] overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-container)' }}
      >
        {pattern.thumbnailUrl ? (
          <Image
            src={pattern.thumbnailUrl}
            alt={pattern.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <PlaceholderGrid name={pattern.name} />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-2">
        {/* Name */}
        <h3
          className="font-semibold text-sm leading-tight truncate"
          style={{ color: 'var(--color-on-surface)' }}
          title={pattern.name}
        >
          {pattern.name}
        </h3>

        {/* Skill level badge */}
        <span
          className="inline-flex self-start items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: skill.bg,
            color: skill.text,
          }}
        >
          {skill.label}
        </span>

        {/* Dimensions */}
        <p
          className="text-xs font-medium"
          style={{ color: 'var(--color-on-surface)' }}
        >
          {dimensions}
        </p>

        {/* Stats */}
        <p
          className="text-xs"
          style={{ color: 'var(--color-secondary)' }}
        >
          {pattern.blockCount} block{pattern.blockCount !== 1 ? 's' : ''} &middot; {pattern.fabricCount} fabric{pattern.fabricCount !== 1 ? 's' : ''}
        </p>

        {/* Import count */}
        {pattern.importCount > 0 && (
          <span
            className="inline-flex self-start items-center gap-1 text-xs"
            style={{ color: 'var(--color-secondary)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
              style={{ color: 'var(--color-primary-dark)' }}
            >
              <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.723.723 0 01-.692 0h-.002z" />
            </svg>
            {pattern.importCount}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Preview button */}
        <button
          type="button"
          onClick={() => onPreview(pattern.id)}
          className="self-start text-xs font-semibold rounded-md px-3 py-1.5 transition-colors duration-200 cursor-pointer"
          style={{
            color: 'var(--color-secondary)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-primary-dark)';
            e.currentTarget.style.backgroundColor = 'var(--color-primary-container)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Preview
        </button>
      </div>
    </article>
  );
}

export { formatDimensionDisplay };
