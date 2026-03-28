import type { Metadata } from 'next';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';

export const metadata: Metadata = {
  title: 'My Projects',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveShell>{children}</ResponsiveShell>;
}
