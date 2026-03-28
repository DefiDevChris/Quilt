import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { Providers } from '@/components/auth/Providers';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { SkipLink } from '@/components/ui/SkipLink';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: {
    default: 'QuiltCorgi — Design Quilts in Your Browser',
    template: '%s | QuiltCorgi',
  },
  description:
    'A modern, browser-based quilt design studio with a 6,000+ block library, fabric visualization, and 1:1 PDF pattern export. Free to start.',
  metadataBase: new URL('https://quiltcorgi.com'),
  openGraph: {
    title: 'QuiltCorgi — Design Quilts in Your Browser',
    description:
      'A modern, browser-based quilt design studio. Free to start, low-cost Pro subscription.',
    type: 'website',
    siteName: 'QuiltCorgi',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'QuiltCorgi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuiltCorgi — Design Quilts in Your Browser',
    description: 'A modern, browser-based quilt design studio. Free to start.',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-sans antialiased bg-background text-on-surface">
        <SkipLink />
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
