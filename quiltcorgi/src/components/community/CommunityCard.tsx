'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LikeButton } from '@/components/community/LikeButton';
import type { CommunityPost } from '@/stores/communityStore';

interface CommunityCardProps {
  post: CommunityPost;
}

export function CommunityCard({ post }: CommunityCardProps) {
  return (
    <Link
      href={`/community/${post.id}`}
      className="block rounded-lg bg-surface-container shadow-elevation-1 hover:shadow-elevation-2 transition-shadow cursor-pointer overflow-hidden"
    >
      {post.thumbnailUrl ? (
        <div className="relative w-full">
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            width={400}
            height={300}
            className="w-full h-auto object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] bg-primary-container flex items-center justify-center">
          <span className="text-3xl text-primary/40">&#9632;</span>
        </div>
      )}

      <div className="p-3">
        <h3 className="font-medium text-on-surface text-body-md line-clamp-2 mb-1">{post.title}</h3>
        <p className="text-body-sm text-secondary mb-2">by {post.creatorName}</p>
        <div className="flex items-center justify-end">
          <LikeButton
            postId={post.id}
            likeCount={post.likeCount}
            isLikedByUser={post.isLikedByUser}
            size="sm"
          />
        </div>
      </div>
    </Link>
  );
}
