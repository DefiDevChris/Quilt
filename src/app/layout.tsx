import type { Metadata } from 'next';
import { Providers } from '@/components/auth/Providers';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { SkipLink } from '@/components/ui/SkipLink';
import { getBaseUrl } from '@/lib/url';
import './globals.css';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Quilt Studio';
const APP_URL = getBaseUrl();
const APP_DESCRIPTION =
  'A modern, browser-based quilt design studio with a growing block library, fabric visualization, and 1:1 PDF pattern export. Free to use — create an account to save and export.';
const APP_OG_DESCRIPTION =
  'A modern, browser-based quilt design studio. Free to use — create an account to save and export.';

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Design Quilts in Your Browser`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: `${APP_NAME} — Design Quilts in Your Browser`,
    description: APP_OG_DESCRIPTION,
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
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <SkipLink />
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
