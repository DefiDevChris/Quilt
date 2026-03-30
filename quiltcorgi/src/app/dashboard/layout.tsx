import type { Metadata } from 'next';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';

export const metadata: Metadata = {
  title: 'Dashboard | QuiltCorgi',
  description:
    'Manage your quilt projects, browse patterns, and access your design tools all in one place.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveShell>{children}</ResponsiveShell>;
}
