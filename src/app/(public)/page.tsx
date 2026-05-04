import type { Metadata } from 'next';
import HeroSection from '@/components/landing/HeroSection';
import DesignStudioMoment from '@/components/landing/DesignStudioMoment';
import PhotoToQuiltMoment from '@/components/landing/PhotoToQuiltMoment';
import PictureMyBlocksMoment from '@/components/landing/PictureMyBlocksMoment';
import FabricFinderMoment from '@/components/landing/FabricFinderMoment';
import FooterCTA from '@/components/landing/FooterCTA';
import ThreadLine from '@/components/landing/ThreadLine';
import CorgiMotif from '@/components/landing/CorgiMotif';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'QuiltCorgi';

export const metadata: Metadata = {
  title: `${APP_NAME} — Design quilts, preserve stories`,
  description:
    'A browser‑based quilt workspace. Turn photos into patterns, audition block layouts, and find real fabric prices. Free to start.',
  openGraph: {
    title: `${APP_NAME} — Design quilts, preserve stories`,
    description:
      'A modern quilt design studio. Free to start. Studio, Photo‑to‑Quilt, Picture My Blocks, and a curated fabric library with real retailer prices.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: APP_NAME }],
  },
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Subtle fabric texture overlay – linen‑like repeat */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] bg-texture-linen" />

      <HeroSection />

      {/* Decorative thread connecting sections (desktop only) */}
      <div className="relative z-10 hidden md:block" aria-hidden="true">
        <ThreadLine className="absolute left-[12%] top-0 h-full w-px opacity-30" variation="vertical" />
      </div>

      <DesignStudioMoment />

      <div className="relative z-10 hidden md:block" aria-hidden="true">
        <ThreadLine className="absolute right-[14%] top-0 h-24 w-px opacity-25" variation="curved" />
      </div>

      <PhotoToQuiltMoment />

      <div className="relative z-10 flex justify-center my-16 md:my-24">
        <CorgiMotif className="w-16 h-16 opacity-20" />
      </div>

      <PictureMyBlocksMoment />

      <FabricFinderMoment />

      <FooterCTA />

      <footer className="relative z-10 py-8 text-center text-xs uppercase tracking-widest font-bold text-[var(--color-text-dim)]">
        {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
