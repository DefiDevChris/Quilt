'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LikeButton } from '@/components/community/LikeButton';
import { SaveButton } from '@/components/community/SaveButton';
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
      <div className="relative w-full">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            width={400}
            height={300}
            className="w-full h-auto object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-primary-container flex items-center justify-center">
            <span className="text-3xl text-primary/40">&#9632;</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-on-surface text-body-md line-clamp-2 mb-1">{post.title}</h3>

        <div className="flex items-center gap-2 mb-2">
          {post.creatorAvatarUrl ? (
            <Image
              src={post.creatorAvatarUrl}
              alt={post.creatorName}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-[10px] font-medium text-primary">
                {post.creatorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {post.creatorUsername ? (
            <a
              href={`/members/${post.creatorUsername}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="text-body-sm text-secondary hover:text-primary hover:underline cursor-pointer"
            >
              {post.creatorName}
            </a>
          ) : (
            <span className="text-body-sm text-secondary">{post.creatorName}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LikeButton
              postId={post.id}
              likeCount={post.likeCount}
              isLikedByUser={post.isLikedByUser}
              size="sm"
            />
            <span className="inline-flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 text-secondary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                />
              </svg>
              <span className="text-xs text-secondary">{post.commentCount}</span>
            </span>
          </div>
          <SaveButton postId={post.id} isSaved={post.isSavedByUser} onToggle={() => {}} />
        </div>
      </div>
    </Link>
  );
}
