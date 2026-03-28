import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminReportsPanel } from '@/components/admin/AdminReportsPanel';

export const metadata: Metadata = {
  title: 'Reports | QuiltCorgi Admin',
  description: 'Review and manage content reports.',
};

function ReportsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-4">
      <div className="h-8 w-32 bg-surface-container-high rounded" />
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-surface-container-high rounded-md" />
        <div className="h-8 w-24 bg-surface-container-high rounded-md" />
        <div className="h-8 w-24 bg-surface-container-high rounded-md" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-surface-container-high rounded-lg" />
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <>
      <nav className="max-w-4xl mx-auto mb-6 flex gap-3 text-sm">
        <Link
          href="/admin/community"
          className="text-secondary hover:text-on-surface transition-colors"
        >
          Moderation
        </Link>
        <span className="font-semibold text-primary">Reports</span>
      </nav>
      <Suspense fallback={<ReportsSkeleton />}>
        <AdminReportsPanel />
      </Suspense>
    </>
  );
}
