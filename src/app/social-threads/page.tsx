import type { Metadata } from 'next';
import { SocialThreadsPage } from '@/components/social/SocialThreadsPage';

export const metadata: Metadata = {
  title: 'Social Threads | QuiltCorgi',
  description: 'Browse and share quilt designs with the QuiltCorgi community.',
};

export default function SocialThreads() {
  return <SocialThreadsPage />;
}
