import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import DualIntentHero from '@/components/landing/DualIntentHero';
import CtaSection from '@/components/landing/CtaSection';
import Footer from '@/components/landing/Footer';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'QuiltCorgi';

export const metadata: Metadata = {
  title: `${APP_NAME} — Shop fabric. Design quilts. All in one place.`,
  description:
    'Shop curated fabric and kits or design your next quilt in the browser — with a growing block library, drag-and-drop fabrics, and true-scale PDF export.',
  openGraph: {
    title: `${APP_NAME} — Shop fabric. Design quilts.`,
    description:
      'A curated fabric shop paired with a browser-based quilt design studio. Free to start.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: APP_NAME }],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] relative overflow-hidden">
      <PublicNav />
      <main className="flex-1 relative z-10">
        <DualIntentHero />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
