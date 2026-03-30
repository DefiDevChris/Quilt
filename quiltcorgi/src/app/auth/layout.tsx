import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication | QuiltCorgi',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-surface">
      {children}
    </main>
  );
}
