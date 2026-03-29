import type { Metadata } from 'next';
import { SocialLayout } from '@/components/social/SocialLayout';

export const metadata: Metadata = {
  title: 'Profile',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <SocialLayout activeSection="profile">{children}</SocialLayout>;
}
