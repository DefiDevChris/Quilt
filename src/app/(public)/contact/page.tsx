import type { Metadata } from 'next';
import { Mail, MessageSquare } from 'lucide-react';
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
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-6 font-display">
          Contact Us
        </h1>
        <p className="text-lg text-secondary leading-relaxed">
          Have a question, idea, or just want to say hello? We&apos;d love to hear from you.
        </p>

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

          <div className="flex-1 p-8 rounded-xl glass-card opacity-60 cursor-default relative">
            <span className="absolute top-3 right-3 text-xs font-medium bg-on-surface/10 text-secondary px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
            <div className="w-12 h-12 rounded-full bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-on-surface mb-2">Community Discord</h3>
            <p className="text-secondary text-sm">
              Join our community to chat with other quilters and get help.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
