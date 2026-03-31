import type { Metadata } from 'next';
import { SocialLayout } from '@/components/social/SocialLayout';

export const metadata: Metadata = {
  title: 'Social Threads | QuiltCorgi',
  description: 'Browse blog posts and share quilt designs with the QuiltCorgi community.',
};

export default function SocialThreadsPage() {
  return <SocialLayout activeSection="feed" splitMode />;
}
