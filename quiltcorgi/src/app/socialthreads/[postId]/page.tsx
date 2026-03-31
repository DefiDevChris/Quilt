import { Suspense } from 'react';
import type { Metadata } from 'next';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts, users } from '@/db/schema';
import { PostDetail } from '@/components/social/PostDetail';
import { SocialLayout } from '@/components/social/SocialLayout';

function PostDetailSkeleton() {
  return (
    <div className="glass-panel-social rounded-[2rem] p-6 animate-pulse space-y-4">
      <div className="h-8 w-3/4 bg-surface-container-high rounded" />
      <div className="h-4 w-1/2 bg-surface-container-high rounded" />
      <div className="aspect-video bg-surface-container-high rounded-xl" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-surface-container-high rounded" />
        <div className="h-4 w-5/6 bg-surface-container-high rounded" />
        <div className="h-4 w-4/6 bg-surface-container-high rounded" />
      </div>
    </div>
  );
}

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

export default async function PostDetailPage({ params }: PageProps) {
  const { postId } = await params;

  return (
    <SocialLayout activeSection="feed" contentClassName="pb-10">
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetail postId={postId} />
      </Suspense>
    </SocialLayout>
  );
}
