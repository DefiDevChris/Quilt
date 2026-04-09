import type { Metadata } from 'next';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';

export const metadata: Metadata = {
  title: 'Dashboard | QuiltCorgi',
  description:
    'Manage your quilt projects, browse patterns, and access your design tools all in one place.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Background at 20% opacity */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')", opacity: 0.2 }}
      />
      <ResponsiveShell>{children}</ResponsiveShell>
    </>
  );
}
