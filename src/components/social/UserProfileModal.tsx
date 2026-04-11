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
      <div className="absolute inset-0 bg-[#2d2a26]/50" onClick={onClose} />
      <div className="relative bg-[#ffffff] border border-[#e8e1da] rounded-lg w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8d49]"
        >
          <X className="h-5 w-5 text-[#6b655e]" />
        </button>
        <div className="p-6 text-center">
          <img src={user.avatar} alt={user.name} className="h-20 w-20 rounded-full mx-auto object-cover" />
          <h3 className="font-semibold text-lg text-[#2d2a26] mt-3">{user.name}</h3>
          <p className="text-sm text-[#6b655e]">@{user.username}</p>
          {user.bio && <p className="text-sm text-[#6b655e] mt-2">{user.bio}</p>}
          <div className="flex justify-center gap-8 mt-4">
            <div><p className="font-semibold text-[#2d2a26]">{postsCount}</p><p className="text-xs text-[#6b655e]">Posts</p></div>
            <div><p className="font-semibold text-[#2d2a26]">{followersCount.toLocaleString()}</p><p className="text-xs text-[#6b655e]">Followers</p></div>
            <div><p className="font-semibold text-[#2d2a26]">{followingCount.toLocaleString()}</p><p className="text-xs text-[#6b655e]">Following</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
