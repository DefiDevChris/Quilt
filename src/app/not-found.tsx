import Link from 'next/link';
import { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Page Not Found',
};

export default function NotFound() {
  return (
    <>
      <PublicNav />
      <main className="min-h-[60vh] flex items-center justify-center px-6 bg-[#fdfaf7]">
        <div className="text-center max-w-md">
          <h1 className="text-[40px] leading-[52px] font-normal text-[#ff8d49] mb-4" style={{ fontFamily: 'var(--font-display)' }}>404</h1>
          <h2 className="text-[24px] leading-[32px] font-normal text-[#2d2a26] mb-4">Page Not Found</h2>
          <p className="text-[18px] leading-[28px] text-[#6b655e] mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved,
            deleted, or never existed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-2 bg-[#ff8d49] text-[#2d2a26] rounded-lg font-normal hover:bg-[#e67d3f] transition-colors duration-150"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2 border-2 border-[#ff8d49] text-[#ff8d49] rounded-lg font-normal hover:bg-[#ff8d49]/10 transition-colors duration-150"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
