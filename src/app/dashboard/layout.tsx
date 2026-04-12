import type { Metadata } from 'next';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';
import { OPACITY } from '@/lib/design-system';

export const metadata: Metadata = {
  title: 'Dashboard | Quilt Studio',
  description:
    'Manage your quilt projects, browse patterns, and access your design tools all in one place.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Background at 5% opacity */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')", opacity: OPACITY['background-image'] }}
      />
      <ResponsiveShell>{children}</ResponsiveShell>
    </>
  );
}
