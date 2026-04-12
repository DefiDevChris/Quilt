'use client';

import { useEffect, useState, useRef } from 'react';
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

type ProfileTab = 'posts' | 'about';

export function UserProfileModal({ isOpen, onClose, user, postsCount = 0, followersCount = 0, followingCount = 0 }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      dialogRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-title"
        tabIndex={-1}
        className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto outline-none"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-white"
        >
          <X className="h-5 w-5 text-[var(--color-text-dim)]" />
        </button>

        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-t-2xl relative">
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg" />
          </div>
        </div>

        {/* Info */}
        <div className="pt-16 px-8 pb-6 text-center">
          <h3 id="user-profile-title" className="font-semibold text-xl text-[var(--color-text)]">{user.name}</h3>
          <p className="text-sm text-[var(--color-text-dim)]">@{user.username}</p>
          {user.bio && <p className="text-sm text-[var(--color-text-dim)] mt-3 max-w-sm mx-auto leading-relaxed">{user.bio}</p>}

          <div className="flex justify-center gap-10 mt-5">
            <div><p className="font-bold text-xl text-[var(--color-text)]">{postsCount}</p><p className="text-xs text-[var(--color-text-dim)]">Posts</p></div>
            <div><p className="font-bold text-xl text-[var(--color-text)]">{followersCount.toLocaleString()}</p><p className="text-xs text-[var(--color-text-dim)]">Followers</p></div>
            <div><p className="font-bold text-xl text-[var(--color-text)]">{followingCount.toLocaleString()}</p><p className="text-xs text-[var(--color-text-dim)]">Following</p></div>
          </div>

          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`mt-5 rounded-full font-medium px-8 transition-colors duration-150 ${
              isFollowing
                ? 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]'
                : 'bg-[var(--color-primary)] text-white hover:bg-[#e67d3f]'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-t border-[var(--color-border)]">
          <div className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
                activeTab === 'posts' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-dim)]'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
                activeTab === 'about' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-dim)]'
              }`}
            >
              About
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'posts' && (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-[var(--color-bg)] rounded-xl overflow-hidden">
                  <div className="w-full h-full bg-[var(--color-border)]/30 animate-pulse" />
                </div>
              ))}
            </div>
          )}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">{user.bio || 'No bio yet.'}</p>
              <div className="flex justify-center gap-8 pt-2">
                <div className="text-center"><p className="text-lg font-semibold text-[var(--color-text)]">{followersCount.toLocaleString()}</p><p className="text-xs text-[var(--color-text-dim)]">Followers</p></div>
                <div className="text-center"><p className="text-lg font-semibold text-[var(--color-text)]">{followingCount.toLocaleString()}</p><p className="text-xs text-[var(--color-text-dim)]">Following</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
