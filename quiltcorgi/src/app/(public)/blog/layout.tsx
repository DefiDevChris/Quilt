import type { Metadata } from 'next';
import { SocialLayout } from '@/components/social/SocialLayout';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'News, tips, and behind-the-scenes updates from the QuiltCorgi team. Learn about quilt design, new features, and the quilting community.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocialLayout activeSection="blog" contentClassName="pb-10 max-w-4xl mx-auto">
      {children}
    </SocialLayout>
  );
}
