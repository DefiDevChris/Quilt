'use client';

import { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ThumbsUp } from 'lucide-react';
import { Avatar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui';
import { Post, User } from '@/types/social';
import { Comments } from './Comments';

interface PostCardProps {
  post: Post;
  viewMode: 'full' | 'grid';
  onImageClick?: (post: Post) => void;
  onAddComment?: (postId: string, content: string) => void;
  onSavePost?: (postId: string, saved: boolean) => void;
  savedPosts?: Set<string>;
  isOwner?: boolean;
  onUserClick?: (user: User) => void;
  onLike?: (postId: string, liked: boolean) => void;
  onShare?: (postId: string) => void;
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
  onLike,
  onShare,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [showHeart, setShowHeart] = useState(false);
  const lastClickTime = useRef(0);
  const saved = savedPosts?.has(post.id) || false;

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((p) => (newLiked ? p + 1 : p - 1));
    onLike?.(post.id, newLiked);
  };

  const handleDoubleTapLike = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 300 && !liked) {
      setLiked(true);
      setLikes((p) => p + 1);
      setShowHeart(true);
      onLike?.(post.id, true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastClickTime.current = now;
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSavePost?.(post.id, !saved);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(post.id);
  };

  /* ── Grid View ── */
  if (viewMode === 'grid') {
    return (
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] shadow-sm overflow-hidden">
        <div className="relative aspect-[4/3] cursor-pointer overflow-hidden"
          onClick={() => { handleDoubleTapLike(); onImageClick?.(post); }}>
          <img src={post.image} alt="" className="w-full h-full object-cover" />
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
              <Heart className="h-24 w-24 text-white fill-white" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <button onClick={(e) => { e.stopPropagation(); handleLike(); }}
              className={`p-2.5 rounded-full transition-colors duration-150 ${liked ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-dim)]'}`}>
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            </button>
          </div>
          {post.isFeatured && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 bg-[var(--color-primary)] text-white text-xs font-medium rounded-full">Featured</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Avatar
              className="h-8 w-8 cursor-pointer border-2 border-[var(--color-border)]"
              src={post.user.avatar}
              fallback={post.user.name[0]}
              onClick={() => onUserClick?.(post.user)}
            />
            <span className="text-sm font-medium text-[var(--color-text)]">{post.user.name}</span>
            <span className="text-xs text-[var(--color-text-dim)] ml-auto">{formatTimeAgo(post.createdAt)}</span>
          </div>
          <p className="text-sm text-[var(--color-text-dim)] line-clamp-2 leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--color-border)]/30 text-[var(--color-text-dim)] text-xs">
            <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" /> {likes}</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> {post.comments.length}</span>
            <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-[var(--color-text)]">
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleSave} className={`ml-auto flex items-center gap-1.5 transition-colors duration-150 ${saved ? 'text-[var(--color-primary)]' : 'hover:text-[var(--color-text)]'}`}>
              <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Full View ── */
  return (
    <article className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <Avatar
          className="h-12 w-12 cursor-pointer shrink-0 border-2 border-[var(--color-primary)]"
          src={post.user.avatar}
          fallback={post.user.name[0]}
          onClick={() => onUserClick?.(post.user)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-[var(--color-text)] truncate cursor-pointer" onClick={() => onUserClick?.(post.user)}>
              {post.user.name}
            </h4>
            {post.isFeatured && (
              <span className="px-2.5 py-0.5 bg-[var(--color-primary)] text-white text-xs font-medium rounded-full">Featured</span>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-dim)]">@{post.user.username} &middot; {formatTimeAgo(post.createdAt)}</p>
        </div>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-[var(--color-bg)]" aria-label="More options"><MoreHorizontal className="h-5 w-5 text-[var(--color-text-dim)]" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-lg p-2">
              <DropdownMenuItem className="text-red-500 rounded-full mx-1 py-2">Delete Post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <p className="text-base text-[var(--color-text)] leading-relaxed px-6 pb-4">{post.content}</p>

      {/* Image + Comments */}
      <div className="flex gap-5 px-6 pb-5">
        <div className="w-2/3 cursor-pointer rounded-lg overflow-hidden relative"
          onClick={() => { handleDoubleTapLike(); onImageClick?.(post); }}>
          <img src={post.image} alt="" className="w-full h-80 object-cover" />
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
              <Heart className="h-32 w-32 text-white fill-white" />
            </div>
          )}
        </div>
        <div className="w-1/3 min-h-[320px]">
          <Comments comments={post.comments} onAddComment={(content) => onAddComment?.(post.id, content)} className="h-full" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)]/30">
        <div className="flex items-center gap-6 text-[var(--color-text-dim)] text-sm">
          <button onClick={handleLike} className={`flex items-center gap-2 transition-colors duration-150 ${liked ? 'text-[var(--color-primary)]' : ''}`}>
            <ThumbsUp className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            <span className="font-medium">{likes}</span>
          </button>
          <span className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">{post.comments.length}</span> Comments
          </span>
          <button onClick={handleShare} className="flex items-center gap-2 hover:text-[var(--color-text)]">
            <Share2 className="h-5 w-5" />Share
          </button>
        </div>
        <button onClick={handleSave} className={`flex items-center gap-2 transition-colors duration-150 ${saved ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'}`}>
          <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
          {saved && <span className="font-medium">Saved</span>}
        </button>
      </div>
    </article>
  );
}
