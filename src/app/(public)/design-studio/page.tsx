import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import HeroSection from '@/components/landing/HeroSection';
import FeatureHighlights from '@/components/landing/FeatureHighlights';
import WorkspacePreview from '@/components/landing/WorkspacePreview';
import CoreCapabilities from '@/components/landing/CoreCapabilities';
import CtaSection from '@/components/landing/CtaSection';
import Footer from '@/components/landing/Footer';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'QuiltCorgi';

export const metadata: Metadata = {
  title: `${APP_NAME} Design Studio — Design Your Next Quilt in the Browser`,
  description:
    'Design quilts in your browser with a growing block library, drag-and-drop fabrics, and 1:1 PDF export. Free to start, low-cost Pro subscription.',
  openGraph: {
    title: `${APP_NAME} Design Studio`,
    description:
      'A modern, browser-based quilt design studio. Free to start, low-cost Pro subscription.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${APP_NAME} Design Studio` }],
  },
};

export default function DesignStudioLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] relative overflow-hidden">
      <PublicNav />
      <main className="flex-1 relative z-10">
        <HeroSection />
        <FeatureHighlights />
        <WorkspacePreview />
        <CoreCapabilities />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
