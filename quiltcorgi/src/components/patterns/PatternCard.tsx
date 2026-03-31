'use client';

import Image from 'next/image';
import { Package } from 'lucide-react';
import type { PatternTemplateListItem } from '@/types/pattern-template';
import { SKILL_LEVEL_LABELS } from '@/lib/constants';

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

  const match = FRACTION_MAP.find(([value]) => Math.abs(fractional - value) < 0.0625);

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
  '#F8E8D4',
  '#E8D4C4',
  '#D4C4B4',
  '#F4E4D0',
  '#E0D0C0',
  '#F0E0D0',
  '#D8C8B8',
  '#ECE0D4',
  '#F4DCC8',
  '#E4D0C0',
  '#D0C0B0',
  '#E8DCD0',
  '#F0D8C4',
  '#DCC8B8',
  '#C8B8A8',
  '#E4D4C4',
] as const;

function PlaceholderFallback({ name }: { name: string }) {
  const hash = hashString(name);
  const color = PASTEL_PALETTE[hash % PASTEL_PALETTE.length];

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: color }}
    >
      <Package className="w-10 h-10 opacity-20 text-on-surface" />
    </div>
  );
}

export function PatternCard({ pattern, onPreview }: PatternCardProps) {
  const w = formatDimensionDisplay(pattern.finishedWidth);
  const h = formatDimensionDisplay(pattern.finishedHeight);
  const label = SKILL_LEVEL_LABELS[pattern.skillLevel] ?? pattern.skillLevel;

  return (
    <button
      type="button"
      onClick={() => onPreview(pattern.id)}
      className="text-left rounded-[var(--radius-lg)] overflow-hidden transition-all duration-200 hover:shadow-elevation-3 hover:-translate-y-0.5 cursor-pointer w-full"
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        boxShadow: 'var(--shadow-elevation-1)',
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-[3/2] relative overflow-hidden bg-surface-container">
        {pattern.thumbnailUrl ? (
          <Image
            src={pattern.thumbnailUrl}
            alt={pattern.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <PlaceholderFallback name={pattern.name} />
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-3 pb-4">
        <p
          className="text-sm font-semibold leading-snug truncate"
          style={{ color: 'var(--color-on-surface)' }}
        >
          {pattern.name}
        </p>

        <span
          className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full"
          style={{
            backgroundColor: 'var(--color-primary-container)',
            color: 'var(--color-primary-on-container)',
          }}
        >
          {label}
        </span>

        <p className="mt-2 text-xs" style={{ color: 'var(--color-secondary)' }}>
          {w}&Prime; × {h}&Prime; finished
        </p>
        <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
          {pattern.blockCount} {pattern.blockCount === 1 ? 'block' : 'blocks'} &middot;{' '}
          {pattern.fabricCount} {pattern.fabricCount === 1 ? 'fabric' : 'fabrics'}
        </p>
      </div>
    </button>
  );
}

export { formatDimensionDisplay };
