import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Quilt Studio team.',
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

        <div className="mt-16 max-w-2xl mx-auto">
          <a
            href="mailto:support@quiltcorgi.com"
            className="block p-12 bg-[var(--color-surface)] border border-[#d4d4d4] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] hover:bg-[#ff8d49]/10 transition-colors duration-150"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-[#ff8d49]/10 text-[#ff8d49] flex items-center justify-center rounded-lg">
                <Mail className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[14px] leading-[20px] font-normal text-[#4a4a4a] mb-1">Channel</p>
                <p className="text-[24px] leading-[32px] font-normal text-[#1a1a1a]">Email Support</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[18px] leading-[28px] text-[#4a4a4a]">
                Have a question about your subscription, a feature request, or need help with a project?
                Our team is standing by to assist you.
              </p>
              <div className="flex items-center gap-2 text-[18px] leading-[28px] text-[#1a1a1a] mt-8">
                support@quiltcorgi.com
                <span className="text-lg">→</span>
              </div>
            </div>
          </a>

          <div className="mt-20 pt-10 border-t border-[#d4d4d4]/30 text-center">
            <p className="text-[14px] leading-[20px] font-normal text-[#4a4a4a]">
              Response time: Typically under 24 hours
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
