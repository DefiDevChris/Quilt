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
            className="group block p-12 bg-on-surface text-surface hover:bg-on-surface/90 transition-all duration-300"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-surface text-on-surface flex items-center justify-center">
                <Mail className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Channel</h3>
                <p className="text-xl font-black uppercase tracking-tight">Email Support</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-lg opacity-80 leading-relaxed font-medium">
                Have a question about your subscription, a feature request, or need help with a project? 
                Our team is standing by to assist you.
              </p>
              <div className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest mt-8 group-hover:gap-4 transition-all">
                support@quiltcorgi.com
                <span className="text-lg">→</span>
              </div>
            </div>
          </a>
          
          <div className="mt-20 pt-10 border-t border-outline-variant/30 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">
              Response time: Typically under 24 hours
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
