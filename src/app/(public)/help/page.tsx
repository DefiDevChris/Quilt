import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';
import { HelpCenterContent } from '@/components/help/HelpCenterContent';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Find answers, tutorials, and support for QuiltCorgi.',
};

export default function HelpPage() {
  return (
    <>
      <PublicNav />
      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        <PageHeader
          title="Help Center"
          description="Find answers, tutorials, and support for QuiltCorgi."
        />
        <HelpCenterContent />
      </main>
      <Footer />
    </>
  );
}
