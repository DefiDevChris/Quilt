'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        label="Community"
        title="Project Gallery"
        description="Browse quilts shared by the QuiltCorgi community."
      />

      <div className="card p-12 lg:p-16 text-center">
        <div className="mb-6">
          <img
            src="/icons/quilt-profile.png"
            alt="Gallery"
            width={96}
            height={96}
            className="mx-auto opacity-20"
          />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
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
        <Link href="/studio" className="btn-primary px-6 py-3">
          Start Designing
        </Link>
      </div>
    </>
  );
}
