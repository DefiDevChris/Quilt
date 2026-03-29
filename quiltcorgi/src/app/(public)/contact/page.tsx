import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the QuiltCorgi team.',
};

export default function ContactPage() {
  return (
    <>
      <PublicNav />
      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24 text-center">
        <h1
          className="text-3xl md:text-4xl font-bold text-warm-text mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Contact Us
        </h1>
        <p className="text-lg text-warm-text-secondary leading-relaxed">
          Have a question, idea, or just want to say hello? We&apos;d love to hear from you. Drop us
          a line and we&apos;ll get back to you as soon as we can. Contact form coming soon.
        </p>
      </main>
      <Footer />
    </>
  );
}
