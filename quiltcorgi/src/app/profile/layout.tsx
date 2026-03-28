import type { Metadata } from 'next';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';

export const metadata: Metadata = {
  title: 'Profile',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveShell>{children}</ResponsiveShell>;
}
