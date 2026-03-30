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

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'QuiltCorgi';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Design Quilts in Your Browser`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    'A modern, browser-based quilt design studio with a 659+ block library, fabric visualization, and 1:1 PDF pattern export. Free to start.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: `${APP_NAME} — Design Quilts in Your Browser`,
    description:
      'A modern, browser-based quilt design studio. Free to start, low-cost Pro subscription.',
    type: 'website',
    siteName: APP_NAME,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: APP_NAME }],
  },
  icons: {
    icon: '/favicon.png',
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
