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
      <main className="min-h-[60vh] flex items-center justify-center px-6 bg-[#fafafa]">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-on-surface mb-4">Page Not Found</h2>
          <p className="text-secondary mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved,
            deleted, or never existed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-on-surface rounded-full font-semibold hover:bg-primary-dark transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-outline-variant text-on-surface rounded-full font-semibold hover:bg-white transition-colors"
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
