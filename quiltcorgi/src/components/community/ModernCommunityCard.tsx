'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { LikeButton } from '@/components/community/LikeButton';
import { SaveButton } from '@/components/community/SaveButton';
import { formatRelativeTime } from '@/lib/format-time';
import type { CommunityPost } from '@/stores/communityStore';

interface ModernCommunityCardProps {
  post: CommunityPost;
}

export function ModernCommunityCard({ post }: ModernCommunityCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <article
      className="group bg-background rounded-2xl overflow-hidden border border-outline-variant hover:border-outline hover:shadow-elevation-2 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link href={`/socialthreads/${post.id}`} className="block relative">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center">
              <svg className="w-16 h-16 text-primary/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z" />
              </svg>
            </div>
          )}

          {/* Hover Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/socialthreads/${post.id}`}>
          <h3 className="font-semibold text-on-surface text-base line-clamp-2 mb-3 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>

        {/* Author Row */}
        <div className="flex items-center gap-3 mb-4">
          {post.creatorAvatarUrl ? (
            <Image
              src={post.creatorAvatarUrl}
              alt={post.creatorName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-outline-variant"
              unoptimized
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center ring-2 ring-outline-variant">
              <span className="text-xs font-semibold text-primary">
                {post.creatorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {post.creatorUsername ? (
              <Link
                href={`/members/${post.creatorUsername}`}
                className="text-sm font-medium text-on-surface hover:text-primary truncate block"
              >
                {post.creatorName}
              </Link>
            ) : (
              <p className="text-sm font-medium text-on-surface truncate">{post.creatorName}</p>
            )}
            <p className="text-xs text-secondary">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
          <div className="flex items-center gap-1">
            <LikeButton
              postId={post.id}
              likeCount={post.likeCount}
              isLikedByUser={post.isLikedByUser}
              size="sm"
            />

            <Link
              href={`/socialthreads/${post.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                />
              </svg>
              <span>{post.commentCount}</span>
            </Link>
          </div>

          <SaveButton postId={post.id} isSaved={post.isSavedByUser} onToggle={() => {}} />
        </div>
      </div>
    </article>
  );
}
