import { Suspense } from 'react';
import type { Metadata } from 'next';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts, users } from '@/db/schema';
import { PostDetail } from '@/components/community/PostDetail';

interface PageProps {
  params: Promise<{ postId: string }>;
}

async function getPostMeta(postId: string) {
  try {
    const [row] = await db
      .select({
        title: communityPosts.title,
        description: communityPosts.description,
        thumbnailUrl: communityPosts.thumbnailUrl,
        creatorName: users.name,
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(and(eq(communityPosts.id, postId), eq(communityPosts.status, 'approved')))
      .limit(1);

    return row ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postId } = await params;
  const meta = await getPostMeta(postId);

  if (!meta) {
    return {
      title: 'Design — QuiltCorgi Community',
      description: 'View a quilt design shared on the QuiltCorgi community.',
    };
  }

  return {
    title: `${meta.title} — QuiltCorgi Community`,
    description: meta.description ?? `A quilt design shared by ${meta.creatorName ?? 'a community member'}.`,
    openGraph: {
      title: meta.title,
      description: meta.description ?? undefined,
      images: meta.thumbnailUrl ? [{ url: meta.thumbnailUrl }] : undefined,
      type: 'article',
    },
  };
}

function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-4 w-32 bg-surface-container-high rounded mb-6" />
      <div className="aspect-[2/1] bg-surface-container-high rounded-lg mb-6" />
      <div className="h-7 w-72 bg-surface-container-high rounded mb-2" />
      <div className="h-4 w-24 bg-surface-container-high rounded mb-6" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-surface-container-high" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-surface-container-high rounded" />
          <div className="h-3 w-20 bg-surface-container-high rounded" />
        </div>
      </div>
      <div className="h-20 bg-surface-container-high rounded" />
    </div>
  );
}

export default async function PostDetailPage({ params }: PageProps) {
  const { postId } = await params;

  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetail postId={postId} />
    </Suspense>
  );
}
