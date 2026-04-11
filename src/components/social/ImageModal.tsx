'use client';

import { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Post } from '@/types/social';
import { Comments } from './Comments';
import { cn } from '@/lib/utils';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-[90vw] max-w-[1200px] h-[85vh] bg-white rounded-lg overflow-hidden flex">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1.5 bg-black/30 rounded-full text-white">
          <X className="h-4 w-4" />
        </button>

        {/* Author Info */}
        <div className="w-1/4 border-r border-[#e8e1da] p-6 flex flex-col">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-16 w-16 mb-3">
              <AvatarImage src={post.user.avatar} />
              <AvatarFallback>{post.user.name[0]}</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-[#2d2a26]">{post.user.name}</h3>
            <p className="text-xs text-[#6b655e]">@{post.user.username}</p>
            {post.user.bio && <p className="text-xs text-[#6b655e] mt-2 px-2">{post.user.bio}</p>}
            <div className="flex gap-6 mt-3">
              <div><p className="font-semibold text-sm text-[#2d2a26]">{post.user.followers.toLocaleString()}</p><p className="text-[10px] text-[#6b655e]">Followers</p></div>
              <div><p className="font-semibold text-sm text-[#2d2a26]">{post.user.following.toLocaleString()}</p><p className="text-[10px] text-[#6b655e]">Following</p></div>
            </div>
          </div>
          <div className="mt-auto pt-5 border-t border-[#e8e1da]">
            <div className="flex items-center justify-around mb-3">
              <button onClick={() => setLikedDelta((p) => (p === 0 ? 1 : 0))} className={cn('flex flex-col items-center gap-0.5', isLiked ? 'text-[#ff8d49]' : 'text-[#6b655e]')}>
                <Heart className={cn('h-5 w-5', isLiked && 'fill-current')} /><span className="text-xs font-medium">{displayLikes}</span>
              </button>
              <div className="flex flex-col items-center gap-0.5 text-[#6b655e]">
                <MessageCircle className="h-5 w-5" /><span className="text-xs font-medium">{post.comments.length}</span>
              </div>
              <button onClick={() => setSaved(!saved)} className={cn('flex flex-col items-center gap-0.5', saved ? 'text-[#ff8d49]' : 'text-[#6b655e]')}>
                <Bookmark className={cn('h-5 w-5', saved && 'fill-current')} />
              </button>
            </div>
            <p className="text-[10px] text-[#6b655e] text-center">Posted {formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Image */}
        <div className="w-1/2 p-6 flex flex-col items-center justify-center bg-[#fdfaf7]">
          <img src={post.image} alt="" className="max-h-[65vh] w-auto object-contain rounded-lg" />
          <p className="mt-4 text-center text-sm text-[#2d2a26] max-w-sm">{post.content}</p>
          {post.isFeatured && <span className="mt-2 px-2.5 py-1 text-[10px] font-medium bg-[#ff8d49] text-white rounded-full">Featured</span>}
        </div>

        {/* Comments */}
        <div className="w-1/4 border-l border-[#e8e1da] p-5 flex flex-col">
          <Comments comments={post.comments} onAddComment={(content) => onAddComment?.(post.id, content)} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
