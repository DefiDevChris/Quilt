import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication | QuiltCorgi',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12 overflow-hidden">
      {/* Full-page background image */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')" }}
      />
      <div className="relative z-10">{children}</div>
    </main>
  );
}
