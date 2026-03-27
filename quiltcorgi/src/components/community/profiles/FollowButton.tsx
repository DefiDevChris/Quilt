'use client';

import { useState } from 'react';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  isOwnProfile: boolean;
  onToggle: () => void;
}

export function FollowButton({ userId: _userId, isFollowing, isOwnProfile, onToggle }: FollowButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isOwnProfile) {
    return null;
  }

  const showUnfollow = isFollowing && isHovered;

  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        px-5 py-2 rounded-lg text-body-md font-medium transition-colors cursor-pointer
        ${showUnfollow
          ? 'bg-error/10 text-error border border-error/30 hover:bg-error/20'
          : isFollowing
            ? 'bg-surface-container text-on-surface border border-outline-variant'
            : 'bg-primary text-primary-on hover:bg-primary-dark'
        }
      `}
    >
      {showUnfollow ? 'Unfollow' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
