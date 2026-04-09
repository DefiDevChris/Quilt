import { ResponsiveShell } from '@/components/layout/ResponsiveShell';

export default function SocialThreadsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')", opacity: 0.2 }}
      />
      <ResponsiveShell>{children}</ResponsiveShell>
    </>
  );
}
