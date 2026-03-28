import PublicNav from '@/components/landing/PublicNav';
import HeroSection from '@/components/landing/HeroSection';
import FeatureHighlights from '@/components/landing/FeatureHighlights';
import WorkspacePreview from '@/components/landing/WorkspacePreview';
import CoreCapabilities from '@/components/landing/CoreCapabilities';
import CommunityPreview from '@/components/landing/CommunityPreview';
import CtaSection from '@/components/landing/CtaSection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-bg relative overflow-hidden">
      <PublicNav />
      <main className="flex-1 relative z-10">
        <HeroSection />
        <FeatureHighlights />
        <WorkspacePreview />
        <CoreCapabilities />
        <CommunityPreview />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
