import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Profile',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
