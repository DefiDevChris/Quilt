import { Suspense } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/landing/PublicNav';
import HeroSection from '@/components/landing/HeroSection';
import FeatureHighlights from '@/components/landing/FeatureHighlights';
import WorkspacePreview from '@/components/landing/WorkspacePreview';
import CommunityPreview from '@/components/landing/CommunityPreview';
import Footer from '@/components/landing/Footer';

function CommunitySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-[var(--radius-lg)] bg-surface-container h-48"
        />
      ))}
    </div>
  );
}

import CoreCapabilities from '@/components/landing/CoreCapabilities';

export default function LandingPage() {
  return (
    <>
      <PublicNav />
      <main>
        <HeroSection />
        <FeatureHighlights />
        <WorkspacePreview />
        <CoreCapabilities />
        <section id="community" className="py-[6rem] bg-surface-container-low px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[2rem] font-bold leading-[1.3] tracking-[-0.01em] text-on-surface text-center mb-12">
              See what the community is creating
            </h2>
            <Suspense fallback={<CommunitySkeleton />}>
              <CommunityPreview />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
