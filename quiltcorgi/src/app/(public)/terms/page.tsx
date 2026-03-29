import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'QuiltCorgi terms of service.',
};

export default function TermsPage() {
  return (
    <>
      <PublicNav />
      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24 text-center">
        <h1
          className="text-3xl md:text-4xl font-bold text-warm-text mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Terms of Service
        </h1>
        <p className="text-lg text-warm-text-secondary leading-relaxed">
          By using QuiltCorgi, you agree to our terms of service. This page will contain the full
          terms governing your use of the platform. Full terms coming soon.
        </p>
      </main>
      <Footer />
    </>
  );
}
