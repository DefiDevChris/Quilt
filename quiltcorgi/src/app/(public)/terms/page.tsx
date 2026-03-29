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
          By accessing or using QuiltCorgi, you agree to comply with our full terms of service.
        </p>

        <div className="mt-12 text-left text-warm-text-secondary space-y-8 max-w-2xl mx-auto">
          <section>
            <h2 className="text-xl font-semibold text-warm-text mb-3">1. Account Responsibilities</h2>
            <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-warm-text mb-3">2. User Content & Intellectual Property</h2>
            <p>You retain all rights to the designs, patterns, and content you create and upload to QuiltCorgi. By posting on our community features, you grant us a non-exclusive license to display your content within the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-warm-text mb-3">3. Subscriptions & Payments</h2>
            <p>Certain features require a paid Pro subscription. Subscription fees are billed in advance on a recurring basis. You may cancel your subscription at any time, but refunds are not provided for partial billing periods.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-warm-text mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the platform to harass others, upload malicious code, or distribute spam. We reserve the right to suspend or terminate accounts that violate these guidelines.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
