'use client';

import { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { Avatar } from './ui';
import { Post } from '@/types/social';
import { Comments } from './Comments';

interface ImageModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onAddComment?: (postId: string, content: string) => void;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function ImageModal({ post, isOpen, onClose, onAddComment }: ImageModalProps) {
  const [likedDelta, setLikedDelta] = useState(0);
  const [saved, setSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen || !post) return null;

  const isLiked = likedDelta === 1;
  const displayLikes = post.likes + likedDelta;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-[95vw] max-w-[1400px] h-[90vh] bg-surface border border-default rounded-lg overflow-hidden flex">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/30 rounded-full text-white hover:bg-black/50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Left: Author Info */}
        <div className="w-1/4 border-r border-default p-6 flex flex-col">
          <div className="flex flex-col items-center text-center">
            <Avatar
              className="h-24 w-24 mb-4 border-4 border-primary"
              src={post.user.avatar}
              fallback={post.user.name[0]}
            />
            <h3 className="font-semibold text-lg text-default">{post.user.name}</h3>
            <p className="text-sm text-dim">@{post.user.username}</p>
            {post.user.bio && <p className="text-sm text-dim mt-3 px-4 leading-relaxed">{post.user.bio}</p>}
            <div className="flex gap-8 mt-4">
              <div><p className="font-semibold text-lg text-default">{post.user.followers.toLocaleString()}</p><p className="text-xs text-dim">Followers</p></div>
              <div><p className="font-semibold text-lg text-default">{post.user.following.toLocaleString()}</p><p className="text-xs text-dim">Following</p></div>
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`mt-4 w-full rounded-full font-medium transition-colors duration-150 ${
                isFollowing
                  ? 'bg-default text-default border border-default'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
          <div className="mt-auto pt-5 border-t border-default">
            <div className="flex items-center justify-around mb-4">
              <button onClick={() => setLikedDelta((p) => (p === 0 ? 1 : 0))} className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors duration-150 ${isLiked ? 'text-primary' : 'text-dim'}`}>
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} /><span className="text-sm font-medium">{displayLikes}</span>
              </button>
              <div className="flex flex-col items-center gap-1 p-2 text-dim">
                <MessageCircle className="h-5 w-5" /><span className="text-sm font-medium">{post.comments.length}</span>
              </div>
              <button onClick={handleShare} className="flex flex-col items-center gap-1 p-2 text-dim">
                <Share2 className="h-5 w-5" />
              </button>
              <button onClick={() => setSaved(!saved)} className={`flex flex-col items-center gap-1 p-2 transition-colors duration-150 ${saved ? 'text-primary' : 'text-dim'}`}>
                <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-dim text-center">Posted {formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Center: Image */}
        <div className="w-1/2 p-6 flex flex-col items-center justify-center bg-default">
          <img src={post.image} alt="" className="max-h-[60vh] w-auto object-contain rounded-lg" />
          <p className="mt-4 text-center text-base text-default max-w-md leading-relaxed">{post.content}</p>
        </div>

        {/* Right: Comments */}
        <div className="w-1/4 border-l border-default p-5 flex flex-col">
          <Comments comments={post.comments} onAddComment={(content) => onAddComment?.(post.id, content)} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
