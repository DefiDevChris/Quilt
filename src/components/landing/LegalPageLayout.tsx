import type { ReactNode } from 'react';
import Footer from './Footer';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1
            className="text-4xl font-bold mb-4 text-default"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {title}
          </h1>
          <p className="text-dim mb-12">Last updated: {lastUpdated}</p>
          <div className="prose prose-neutral max-w-none space-y-8 text-default">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
