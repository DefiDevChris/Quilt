import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | QuiltCorgi',
  description:
    'News, tips, and behind-the-scenes updates from the QuiltCorgi team. Learn about quilt design, new features, and the quilting community.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  // Blog uses SocialLayout which has its own header/sidebar
  // No need for ResponsivePublicShell wrapper
  return <>{children}</>;
}
