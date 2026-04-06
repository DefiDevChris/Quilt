import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'QuiltCorgi';

export const metadata: Metadata = {
  title: `${APP_NAME} — Your Next Quilt Starts Here`,
  description:
    'Design quilts in your browser with a growing block library, drag-and-drop fabrics, photo-to-design tools, and 1:1 PDF export. Free to start.',
  openGraph: {
    title: `${APP_NAME} — Your Next Quilt Starts Here`,
    description:
      'A modern, browser-based quilt design studio. Free to start, low-cost Pro subscription.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: APP_NAME }],
  },
};
import HeroSection from '@/components/landing/HeroSection';
import FeatureHighlights from '@/components/landing/FeatureHighlights';
import WorkspacePreview from '@/components/landing/WorkspacePreview';
import CoreCapabilities from '@/components/landing/CoreCapabilities';
import SocialThreadsSection from '@/components/landing/SocialThreadsSection';
import CommunityPreview from '@/components/landing/CommunityPreview';
import CtaSection from '@/components/landing/CtaSection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <PublicNav />
      <main className="flex-1 relative z-10">
        <HeroSection />
        <FeatureHighlights />
        <WorkspacePreview />
        <CoreCapabilities />
        <SocialThreadsSection />
        <CommunityPreview />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
