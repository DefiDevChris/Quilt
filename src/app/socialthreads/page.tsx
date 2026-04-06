import type { Metadata } from 'next';
import { SocialFeedPage } from '@/components/social/SocialFeedPage';

export const metadata: Metadata = {
  title: 'Social Threads | QuiltCorgi',
  description: 'Browse blog posts and share quilt designs with the QuiltCorgi community.',
};

export default function SocialThreadsPage() {
  return <SocialFeedPage />;
}
