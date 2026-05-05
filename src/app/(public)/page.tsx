import type { Metadata } from 'next';
import HeroSection from '@/components/landing/HeroSection';
import DesignStudioMoment from '@/components/landing/DesignStudioMoment';
import PhotoToQuiltMoment from '@/components/landing/PhotoToQuiltMoment';
import PictureMyBlocksMoment from '@/components/landing/PictureMyBlocksMoment';
import FabricFinderMoment from '@/components/landing/FabricFinderMoment';
import FooterCTA from '@/components/landing/FooterCTA';

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
    <div className="relative bg-[var(--color-bg)] text-[var(--color-text)]">
      <HeroSection />
      <DesignStudioMoment />
      <PhotoToQuiltMoment />
      <PictureMyBlocksMoment />
      <FabricFinderMoment />
      <FooterCTA />
    </div>
  );
}
