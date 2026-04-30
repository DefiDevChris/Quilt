'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { QuiltPieceRow } from '@/components/decorative/QuiltPiece';
import { COLORS, SHADOW, MOTION } from '@/lib/design-system';

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        label="Community"
        title="Project Gallery"
        description="Browse quilts shared by the QuiltCorgi community."
      />

      <div
        className="rounded-lg border p-12 lg:p-16 text-center"
        style={{
          borderColor: `${COLORS.border}4d`,
          backgroundColor: COLORS.surface,
        }}
      >
        <div className="mb-6">
          <QuiltPieceRow count={5} size={10} gap={4} className="mb-8" />
        </div>
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
          style={{
            backgroundColor: `${COLORS.primary}1a`,
            color: COLORS.primary,
          }}
        >
          <Sparkles size={14} />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Coming Soon</span>
        </div>
        <h3 className="text-headline-sm font-semibold text-[var(--color-text)] mb-3">
          A curated showcase of community quilts
        </h3>
        <p className="text-body-md text-[var(--color-text-dim)] max-w-md mx-auto mb-8">
          Soon you&apos;ll be able to publish projects, browse other makers&apos; designs, and remix
          patterns into your own studio.
        </p>
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-colors"
          style={{
            backgroundColor: COLORS.primary,
            color: COLORS.text,
            boxShadow: SHADOW.brand,
            transitionDuration: `${MOTION.transitionDuration}ms`,
          }}
        >
          Start Designing
        </Link>
      </div>
    </>
  );
}
