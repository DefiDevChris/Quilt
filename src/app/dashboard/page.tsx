'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useShopEnabled } from '@/hooks/useShopEnabled';
import { ChevronRight } from 'lucide-react';

const MobileUploadsPanel = dynamic(
  () => import('@/components/uploads/MobileUploadsPanel').then((m) => m.MobileUploadsPanel),
  { ssr: false }
);

function DashboardPageContent() {
  const [showMobileUploads, setShowMobileUploads] = useState(false);
  const shopEnabled = useShopEnabled();

  return (
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr_0.7fr] lg:grid-rows-3 gap-8 min-h-0 relative pb-8">

        {/* 1. DESIGN - Quarter */}
        <Link
          href="/studio"
          className="bg-[var(--color-primary)] text-white border border-[var(--color-primary)] shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between group relative overflow-hidden transition-quilt hover:opacity-95 cursor-pointer h-[280px]"
        >
          <div className="absolute bottom-4 right-4 w-24 h-24 text-white/20 pointer-events-none">
            <Image src="/icons/quilt-quilt.png" alt="Quilt" fill className="object-contain" />
          </div>

          <div className="relative z-10 text-left">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-px bg-white/30"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-white/50">Creator</span>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none">Design a Quilt</h3>
            <p className="font-sans text-white/70 text-sm max-w-[240px] leading-relaxed">Start with a blank canvas and draft your heirloom pattern.</p>
          </div>

          <div className="relative z-10 text-left">
            <div className="inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white cursor-pointer transition-quilt">
              <span>Start Designing</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* 3. SHOP - Right Column, Double Height */}
        <Link
          href="/shop"
          className="lg:row-span-2 bg-white border border-black/[0.03] shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between group relative overflow-hidden transition-quilt hover:opacity-95"
        >
          <div className="absolute inset-0 z-0">
            <Image src="/images/shop/STOREIMG3.png" alt="Shop" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </div>

          <div className="relative z-10 text-left">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-px bg-white/30"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-white/70">Marketplace</span>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none text-white">Shop</h3>
            <p className="font-sans text-white/80 text-sm max-w-[240px]">Curated fabrics, exclusive patterns, and premium studio supplies from artisans around the world.</p>
          </div>

          <div className="relative z-10 text-left mt-auto pt-12">
            <div className="inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white cursor-pointer transition-quilt group-hover:gap-4">
              <span>Shop Fabrics</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* 4. BLOG - Quarter */}
        <Link
          href="/blog"
          className="bg-white border border-black/[0.03] shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between group relative overflow-hidden transition-quilt hover:bg-[var(--color-primary)]/5 h-[280px]"
        >
          <div className="absolute bottom-4 right-4 w-24 h-24 text-[var(--color-primary)]/20 pointer-events-none">
            <Image src="/icons/quilt-book.png" alt="Blog" fill className="object-contain" />
          </div>
          <div className="relative z-10 flex flex-col h-full text-left">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-px bg-[var(--color-primary)]/30"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-[var(--color-primary)]">Editorial</span>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none text-black">Blog</h3>
            <p className="font-sans text-black/50 text-sm mb-auto max-w-[240px]">Read tutorials, expert tips, and daily inspiration from our community.</p>
            <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-primary)] cursor-pointer transition-quilt">
              <span>Get Inspired</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* 5. PICTURE BLOCKS - Quarter */}
        <Link
          href="/picture-my-blocks"
          className="bg-white border border-black/[0.03] shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between group relative overflow-hidden transition-quilt hover:bg-[var(--color-primary)]/5 h-[280px]"
        >
          <div className="absolute bottom-4 right-4 w-24 h-24 text-[var(--color-primary)]/20 pointer-events-none">
            <Image src="/icons/quilt-mobile-uploads.png" alt="Uploads" fill className="object-contain" />
          </div>
          <div className="relative z-10 flex flex-col h-full text-left">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-px bg-[var(--color-primary)]/30"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-[var(--color-primary)]">Visualizer</span>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none text-black">Picture My Blocks</h3>
            <p className="font-sans text-black/50 text-sm mb-auto max-w-[240px]">Upload photos for automatic color matching and block visualization.</p>
            <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-primary)] cursor-pointer transition-quilt">
              <span>Match Fabrics</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* 6. UPLOAD BLOCKS/FABRICS - Quarter */}
        <Link
          href="/uploads"
          className="bg-[var(--color-accent)] text-[var(--color-text)] border border-black/[0.03] shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between group relative overflow-hidden transition-quilt hover:opacity-95 h-[280px]"
        >
          <div className="absolute bottom-4 right-4 w-24 h-24 text-[var(--color-text)]/10 pointer-events-none">
            <Image src="/icons/quilt-mobile-uploads.png" alt="Upload" fill className="object-contain" />
          </div>
          <div className="relative z-10 flex flex-col h-full text-left">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-px bg-[var(--color-text)]/20"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-[var(--color-text)]/50">Upload</span>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none">Upload Blocks &amp; Fabrics</h3>
            <p className="font-sans text-[var(--color-text)]/60 text-sm mb-auto max-w-[240px]">Add your own fabric swatches and quilt blocks to use in your designs.</p>
            <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-text)] cursor-pointer transition-quilt">
              <span>Upload Now</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

      {/* Mobile uploads section */}
      {showMobileUploads && (
        <div className="col-span-full mt-12">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-black/[0.06]">
            <h3 className="text-base font-sans font-bold text-black">
              Mobile uploads
            </h3>
            <button
              onClick={() => setShowMobileUploads(false)}
              className="ml-auto text-sm text-black/40 hover:text-black transition-quilt"
            >
              Hide
            </button>
          </div>
          <MobileUploadsPanel />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}
