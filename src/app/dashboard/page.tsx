import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr_0.75fr] lg:grid-rows-2 gap-8 min-h-0 relative pb-8">

        {/* 1. DESIGN - Left Column, Row 1 */}
        <Link
          href="/studio"
          className="bg-[var(--color-primary)] text-white border border-[var(--color-primary)] shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between overflow-hidden transition-quilt hover:opacity-95 h-[280px]"
        >
          <div className="absolute bottom-4 right-4 w-24 h-24 text-white/20 pointer-events-none">
            <Image src="/icons/quilt-quilt.png" alt="Quilt" fill className="object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-px bg-[var(--color-text-on-primary)]/30"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-white/50">Creator</span>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none">Design a Quilt</h3>
            <p className="font-sans text-white/70 text-sm max-w-[240px] leading-relaxed">Start with a blank canvas and draft your heirloom pattern.</p>
          </div>

          <div>
            <div className="inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white transition-quilt">
              <span>Start Designing</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* 2. BLOG - Middle Column, Row 1 */}
        <Link
          href="/blog"
          className="bg-[var(--color-surface)] border border-[var(--color-text)]/[0.03] shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between overflow-hidden transition-quilt hover:bg-[var(--color-primary)]/5 h-[280px]"
        >
          <div className="absolute bottom-4 right-4 w-24 h-24 text-[var(--color-primary)]/20 pointer-events-none">
            <Image src="/icons/quilt-book.png" alt="Blog" fill className="object-contain" />
          </div>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-px bg-[var(--color-primary)]/30"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-[var(--color-primary)]">Editorial</span>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none text-[var(--color-text)]">Blog</h3>
            <p className="font-sans text-[var(--color-text)]/50 text-sm mb-auto max-w-[240px]">Read tutorials, expert tips, and daily inspiration from our community.</p>
            <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-primary)] transition-quilt">
              <span>Get Inspired</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

      {/* 3. BROWSE FABRICS - Right Column, Rows 1-2 */}
      <Link
        href="/fabrics"
        className="bg-[var(--color-secondary)] border border-[var(--color-primary)]/20 shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between overflow-hidden transition-quilt hover:bg-[var(--color-primary)]/10 lg:row-span-2"
      >
        <div className="absolute bottom-4 right-4 w-24 h-24 text-[var(--color-primary)]/20 pointer-events-none">
          <Image src="/icons/quilt-01-spool-Photoroom.png" alt="Fabrics" fill className="object-contain" />
        </div>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-px bg-[var(--color-primary)]/30"></div>
            <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-[var(--color-primary)]">Library</span>
          </div>
          <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none text-[var(--color-text)]">Browse Fabrics</h3>
          <p className="font-sans text-[var(--color-text-dim)] text-sm mb-auto max-w-[240px]">Browse curated quilting fabrics with shop links. Find the perfect print for your next project.</p>
          <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-primary)] transition-quilt">
            <span>Browse Fabrics</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </Link>

      {/* 4. PICTURE BLOCKS - Left Column, Row 2 */}
        <Link
          href="/picture-my-blocks"
          className="bg-[var(--color-surface)] border border-[var(--color-text)]/[0.03] shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between overflow-hidden transition-quilt hover:bg-[var(--color-primary)]/5 h-[280px]"
        >
          <div className="absolute bottom-4 right-4 w-24 h-24 text-[var(--color-primary)]/20 pointer-events-none">
            <Image src="/icons/quilt-13-dashed-squares-Photoroom.png" alt="Blocks" fill className="object-contain" />
          </div>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-px bg-[var(--color-primary)]/30"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-[var(--color-primary)]">Visualizer</span>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none text-[var(--color-text)]">Picture My Blocks</h3>
            <p className="font-sans text-[var(--color-text)]/50 text-sm mb-auto max-w-[240px]">Design a quilt with your uploaded blocks. Drag blocks onto a customizable grid and preview with fabrics.</p>
            <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-primary)] transition-quilt">
              <span>Start Designing</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* 5. PHOTO TO QUILT - Middle Column, Row 2 */}
      <Link
        href="/photo-to-quilt"
        className="bg-[var(--color-surface)] border border-[var(--color-text)]/[0.03] shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between overflow-hidden transition-quilt hover:bg-[var(--color-primary)]/5 h-[280px]"
      >
        <div className="absolute bottom-4 right-4 w-24 h-24 text-[var(--color-primary)]/20 pointer-events-none">
            <Image src="/icons/template.png" alt="Photo to Quilt" fill className="object-contain" />
        </div>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-px bg-[var(--color-primary)]/30"></div>
            <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-[var(--color-primary)]">Converter</span>
          </div>
          <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none text-[var(--color-text)]">Photo to Quilt</h3>
          <p className="font-sans text-[var(--color-text)]/50 text-sm mb-auto max-w-[240px]">Turn any photo into a quilt pattern. Background removed automatically, ready-to-sew blocks generated.</p>
          <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-primary)] transition-quilt">
            <span>Convert Now</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </Link>

      {/* 6. UPLOAD BLOCKS/FABRICS - Middle Column, Row 2 (pushed to new row area) */}
        <Link
          href="/my-fabrics"
          className="bg-[var(--color-accent)] text-[var(--color-text)] border border-black/[0.03] shadow-[var(--shadow-quilt)] rounded-lg p-8 lg:p-10 flex flex-col justify-between overflow-hidden transition-quilt hover:opacity-95 h-[280px]"
        >
          <div className="absolute bottom-4 right-4 w-24 h-24 text-[var(--color-text)]/10 pointer-events-none">
            <Image src="/icons/quilt-10-pincushion-Photoroom.png" alt="Upload" fill className="object-contain" />
          </div>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-px bg-[var(--color-text)]/20"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-[var(--color-text)]/50">Upload</span>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none">Upload Blocks &amp; Fabrics</h3>
            <p className="font-sans text-[var(--color-text)]/60 text-sm mb-auto max-w-[240px]">Add your own fabric swatches and quilt blocks to use in your designs.</p>
            <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-text)] transition-quilt">
              <span>Upload Now</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

    </div>
  );
}
