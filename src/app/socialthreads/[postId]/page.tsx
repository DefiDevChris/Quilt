import { Suspense } from 'react';
import type { Metadata } from 'next';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialPosts, users } from '@/db/schema';
import { PostDetail } from '@/components/social/PostDetail';

function PostDetailSkeleton() {
  return (
    <div className="bg-[#fdfaf7] border border-[#e8e1da] rounded-lg p-6 animate-pulse space-y-4">
      <div className="h-8 w-3/4 bg-[#ff8d49]/20 rounded-lg" />
      <div className="h-4 w-1/2 bg-[#ff8d49]/10 rounded-lg" />
      <div className="aspect-video bg-[#ff8d49]/10 rounded-lg" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-[#ff8d49]/20 rounded-lg" />
        <div className="h-4 w-5/6 bg-[#ff8d49]/10 rounded-lg" />
        <div className="h-4 w-4/6 bg-[#ff8d49]/10 rounded-lg" />
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
        title: socialPosts.title,
        description: socialPosts.description,
        thumbnailUrl: socialPosts.thumbnailUrl,
        creatorName: users.name,
      })
      .from(socialPosts)
      .leftJoin(users, eq(socialPosts.userId, users.id))
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
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
    description:
      meta.description ?? `A quilt design shared by ${meta.creatorName ?? 'a community member'}.`,
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
    <div className="max-w-2xl mx-auto py-4">
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetail postId={postId} />
      </Suspense>
    </div>
  );
}
