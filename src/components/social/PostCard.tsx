'use client';

import { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ThumbsUp, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Post, User } from '@/types/social';
import { Comments } from './Comments';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  viewMode: 'full' | 'grid';
  onImageClick?: (post: Post) => void;
  onAddComment?: (postId: string, content: string) => void;
  onSavePost?: (postId: string, saved: boolean) => void;
  savedPosts?: Set<string>;
  isOwner?: boolean;
  onUserClick?: (user: User) => void;
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

export function PostCard({
  post,
  viewMode,
  onImageClick,
  onAddComment,
  onSavePost,
  savedPosts,
  isOwner = false,
  onUserClick,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [showHeart, setShowHeart] = useState(false);
  const lastClickTime = useRef(0);
  const saved = savedPosts?.has(post.id) || false;

  const handleLike = () => { setLiked(!liked); setLikes((p) => (liked ? p - 1 : p + 1)); };

  const handleDoubleTapLike = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 300 && !liked) {
      setLiked(true); setLikes((p) => p + 1);
      setShowHeart(true); setTimeout(() => setShowHeart(false), 800);
    }
    lastClickTime.current = now;
  };

  const handleSave = (e: React.MouseEvent) => { e.stopPropagation(); onSavePost?.(post.id, !saved); };
  const handleShare = (e: React.MouseEvent) => { e.stopPropagation(); };

  /* ── Grid View ── */
  if (viewMode === 'grid') {
    return (
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] shadow-[0_1px_2px_rgba(26,26,26,0.08)] hover:bg-[var(--color-bg)] transition-colors duration-150 duration-150">
        <div className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-t-lg"
          onClick={() => { handleDoubleTapLike(); onImageClick?.(post); }}>
          <img src={post.image} alt="" className="w-full h-full object-cover" />
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="h-24 w-24 text-white fill-white" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <button onClick={(e) => { e.stopPropagation(); handleLike(); }}
              className={cn('p-2 rounded-full', liked ? 'bg-[#ff8d49] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-dim)]')}>
              <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            </button>
          </div>
        </div>
        <div className="p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Avatar className="h-7 w-7 cursor-pointer" onClick={() => onUserClick?.(post.user)}>
              <AvatarImage src={post.user.avatar} /><AvatarFallback>{post.user.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-[var(--color-text)]">{post.user.name}</span>
            <span className="text-xs text-[var(--color-text-dim)] ml-auto">{formatTimeAgo(post.createdAt)}</span>
          </div>
          <p className="text-sm text-[var(--color-text-dim)] line-clamp-2">{post.content}</p>
          <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-[var(--color-border)]/30 text-[var(--color-text-dim)] text-xs">
            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {likes}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post.comments.length}</span>
            <button onClick={handleSave} className={cn('ml-auto flex items-center gap-1', saved ? 'text-[#ff8d49]' : 'text-[var(--color-text-dim)]')}>
              <Bookmark className={cn('h-3.5 w-3.5', saved && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Full View ── */
  return (
    <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 pb-3">
        <Avatar className="h-11 w-11 cursor-pointer shrink-0" onClick={() => onUserClick?.(post.user)}>
          <AvatarImage src={post.user.avatar} /><AvatarFallback>{post.user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--color-text)] truncate cursor-pointer" onClick={() => onUserClick?.(post.user)}>
            {post.user.name}
          </h4>
          <p className="text-xs text-[var(--color-text-dim)]">@{post.user.username} · {formatTimeAgo(post.createdAt)}</p>
        </div>
        {post.isFeatured && (
          <span className="shrink-0 flex items-center gap-1 px-3 py-1 text-xs font-medium bg-[#ff8d49] text-white rounded-full">
            <Star className="h-3 w-3 fill-current" /> Featured
          </span>
        )}
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-full hover:bg-[var(--color-bg)]"><MoreHorizontal className="h-5 w-5 text-[var(--color-text-dim)]" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-[var(--color-text)] leading-relaxed px-5 pb-4">{post.content}</p>

      {/* Image + Comments */}
      <div className="flex gap-5 px-5 pb-4">
        <div className="w-2/3 cursor-pointer rounded-lg overflow-hidden relative"
          onClick={() => { handleDoubleTapLike(); onImageClick?.(post); }}>
          <img src={post.image} alt="" className="w-full h-auto object-cover" />
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
              <Heart className="h-28 w-28 text-white fill-white" />
            </div>
          )}
        </div>
        <div className="w-1/3 min-h-[280px]">
          <Comments comments={post.comments} onAddComment={(content) => onAddComment?.(post.id, content)} className="h-full" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)]/30">
        <div className="flex items-center gap-5 text-[var(--color-text-dim)] text-sm">
          <button onClick={handleLike} className="flex items-center gap-1.5">
            <ThumbsUp className={cn('h-4 w-4', liked && 'fill-current text-[#ff8d49]')} />
            {likes}
          </button>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />{post.comments.length} Comments
          </span>
          <button onClick={handleShare} className="flex items-center gap-1.5">
            <Share2 className="h-4 w-4" />Share
          </button>
        </div>
        <button onClick={handleSave} className={cn('flex items-center gap-1', saved ? 'text-[#ff8d49]' : 'text-[var(--color-text-dim)]')}>
          <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          {saved && <span className="text-xs">Saved</span>}
        </button>
      </div>
    </div>
  );
}
