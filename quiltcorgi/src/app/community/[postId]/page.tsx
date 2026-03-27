import { Suspense } from 'react';
import { PostDetail } from '@/components/community/PostDetail';

export default async function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto animate-pulse">
          <div className="h-4 w-32 bg-surface-container-high rounded mb-6" />
          <div className="aspect-[4/3] bg-surface-container-high rounded-lg mb-4" />
          <div className="h-6 w-64 bg-surface-container-high rounded mb-2" />
          <div className="h-4 w-40 bg-surface-container-high rounded" />
        </div>
      }
    >
      <PostDetail postId={postId} />
    </Suspense>
  );
}
