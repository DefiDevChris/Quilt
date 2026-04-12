import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Quilt Studio — the modern, browser-based quilt design studio.',
};

export default function AboutPage() {
  return (
    <>
      <PublicNav />
      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <PageHeader
          title="About Quilt Studio"
          description="The modern, browser-based quilt design studio for quilters of all skill levels."
        />
        <div className="text-[18px] leading-[28px] text-dim space-y-8 max-w-2xl">
          <p>
            Quilt Studio was born from a simple idea: quilting design software should be as joyful and
            creative as quilting itself. We&apos;ve built a modern, browser-based studio that empowers
            quilters of all skill levels to bring their visions to life.
          </p>
          <div className="h-px w-full bg-[var(--color-border)]/30" />
          <p>
            Whether you&apos;re drafting a custom block, calculating complex yardage, or exploring new
            colorways, Quilt Studio provides the intuitive tools you need without the steep learning
            curve. Join our community of passionate makers and start designing your next masterpiece
            today.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
