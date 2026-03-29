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
          We are committed to protecting your personal information and your right to privacy.
        </p>

        <div className="mt-12 text-left text-warm-text-secondary space-y-8 max-w-2xl mx-auto">
          <section>
            <h2 className="text-xl font-semibold text-warm-text mb-3">1. Information We Collect</h2>
            <p>We collect personal information that you provide to us, such as name, email address, and payment information (processed securely via Stripe). We also collect usage data to improve our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-warm-text mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to securely manage your account, process transactions, provide customer support, and improve the QuiltCorgi studio experience.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-warm-text mb-3">3. Data Security & Storage</h2>
            <p>Your data is stored securely using industry-standard infrastructure (AWS). We use strict access controls and encryption to protect your project files and personal information from unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-warm-text mb-3">4. Cookies and Tracking</h2>
            <p>QuiltCorgi uses essential cookies for authentication (session management) and security. We do not use third-party tracking cookies for targeted advertising.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
