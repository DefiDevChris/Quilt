import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'QuiltCorgi privacy policy — how we handle your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <PublicNav />
      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24 text-center">
        <h1
          className="text-3xl md:text-4xl font-bold text-warm-text mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Privacy Policy
        </h1>
        <p className="text-lg text-warm-text-secondary leading-relaxed">
          Your privacy matters to us. This page will contain our full privacy policy detailing how
          QuiltCorgi collects, uses, and protects your information. Full policy coming soon.
        </p>
      </main>
      <Footer />
    </>
  );
}
