import type { ReactNode } from 'react';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/20">
      <PublicNav />
      <main className="grow w-full flex flex-col overflow-hidden">{children}</main>
      <Footer />
    </div>
  );
}
