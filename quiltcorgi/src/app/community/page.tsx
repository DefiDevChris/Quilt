import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CommunityBoard } from '@/components/community/CommunityBoard';

export const metadata: Metadata = {
  title: 'Community Quilts | QuiltCorgi',
  description: 'Browse quilt designs shared by the QuiltCorgi community.',
};

function CommunityBoardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-64 bg-surface-container-high rounded-md" />
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="mb-4 break-inside-avoid">
            <div className="h-48 bg-surface-container-high rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunityBoardSkeleton />}>
      <CommunityBoard />
    </Suspense>
  );
}
