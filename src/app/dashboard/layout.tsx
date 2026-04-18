import type { Metadata } from 'next';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';

export const metadata: Metadata = {
  title: 'Dashboard | Quilt Studio',
  description:
    'Manage your quilt projects, browse patterns, and access your design tools all in one place.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <ResponsiveShell>{children}</ResponsiveShell>
    </div>
  );
}
