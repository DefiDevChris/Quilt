import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the QuiltCorgi team.',
};

export default function ContactPage() {
  return (
    <>
      <PublicNav />
      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <PageHeader
          title="Contact Us"
          description="Have a question, idea, or just want to say hello? We'd love to hear from you."
        />

        <div className="mt-12 flex flex-col md:flex-row gap-6 justify-center max-w-2xl mx-auto">
          <a
            href="mailto:support@quiltcorgi.com"
            className="flex-1 p-8 rounded-xl glass-card hover:shadow-elevation-2 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-on-surface mb-2">Email Support</h3>
            <p className="text-secondary text-sm">
              Reach out to our team directly at support@quiltcorgi.com
            </p>
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
