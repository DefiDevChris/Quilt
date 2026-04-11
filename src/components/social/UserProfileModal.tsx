'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { User } from '@/types/social';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

export function UserProfileModal({ isOpen, onClose, user, postsCount = 0, followersCount = 0, followingCount = 0 }: UserProfileModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--color-text)]/50" onClick={onClose} />
      <div className="relative bg-[#ffffff] border border-[var(--color-border)] rounded-lg w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8d49]"
        >
          <X className="h-5 w-5 text-[var(--color-text-dim)]" />
        </button>
        <div className="p-6 text-center">
          <img src={user.avatar} alt={user.name} className="h-20 w-20 rounded-full mx-auto object-cover" />
          <h3 className="font-semibold text-lg text-[var(--color-text)] mt-3">{user.name}</h3>
          <p className="text-sm text-[var(--color-text-dim)]">@{user.username}</p>
          {user.bio && <p className="text-sm text-[var(--color-text-dim)] mt-2">{user.bio}</p>}
          <div className="flex justify-center gap-8 mt-4">
            <div><p className="font-semibold text-[var(--color-text)]">{postsCount}</p><p className="text-xs text-[var(--color-text-dim)]">Posts</p></div>
            <div><p className="font-semibold text-[var(--color-text)]">{followersCount.toLocaleString()}</p><p className="text-xs text-[var(--color-text-dim)]">Followers</p></div>
            <div><p className="font-semibold text-[var(--color-text)]">{followingCount.toLocaleString()}</p><p className="text-xs text-[var(--color-text-dim)]">Following</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
