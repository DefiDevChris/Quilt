import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about QuiltCorgi — the modern, browser-based quilt design studio.',
};

export default function AboutPage() {
  return (
    <>
      <PublicNav />
      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24 text-center">
        <h1
          className="text-3xl md:text-4xl font-bold text-warm-text mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          About QuiltCorgi
        </h1>
        <p className="text-lg text-warm-text-secondary leading-relaxed">
          QuiltCorgi is a modern, browser-based quilt design studio built for quilters of every skill
          level. Design your quilts, pick your fabrics, calculate your yardage, and export true-scale
          patterns — all in one place. More details coming soon.
        </p>
      </main>
      <Footer />
    </>
  );
}
