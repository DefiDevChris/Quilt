import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BlogModerationPanel } from '@/components/admin/BlogModerationPanel';

export const metadata: Metadata = {
  title: 'Blog Moderation | QuiltCorgi Admin',
  description: 'Review and moderate blog posts.',
};

function ModerationSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-4">
      <div className="h-8 w-48 bg-surface-container-high rounded" />
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-surface-container-high rounded-md" />
        <div className="h-8 w-20 bg-surface-container-high rounded-md" />
        <div className="h-8 w-20 bg-surface-container-high rounded-md" />
        <div className="h-8 w-20 bg-surface-container-high rounded-md" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 bg-surface-container-high rounded-lg" />
      ))}
    </div>
  );
}

export default function AdminBlogPage() {
  return (
    <Suspense fallback={<ModerationSkeleton />}>
      <BlogModerationPanel />
    </Suspense>
  );
}
