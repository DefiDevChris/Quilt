import type { Metadata } from 'next';
import { Providers } from '@/components/auth/Providers';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { SkipLink } from '@/components/ui/SkipLink';
import './globals.css';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Quilt Studio';
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://quiltcorgi.com' : 'http://localhost:3000');

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Design Quilts in Your Browser`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    'A modern, browser-based quilt design studio with a growing block library, fabric visualization, and 1:1 PDF pattern export. Free to start.',
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Noto+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
        />
      </head>
      <body className="font-sans antialiased bg-[var(--color-bg)] text-[var(--color-text)]">
        <SkipLink />
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
