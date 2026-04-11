'use client';

import { useEffect, useState } from 'react';
import { X, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Post } from '@/types/social';
import { Comments } from './Comments';
import { ShareModal } from './ShareModal';
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
  // Use delta state to track user interactions without syncing with props
  const [likedDelta, setLikedDelta] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen || !post) return null;

  const handleLike = () => {
    setLikedDelta(prev => prev === 0 ? 1 : 0);
  };

  const isLiked = likedDelta === 1;
  const displayLikes = post.likes + likedDelta;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative w-[95vw] max-w-[1400px] h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-slideIn flex">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2.5 bg-black/20 rounded-full text-white hover:bg-black/40 transition-all duration-300 hover:scale-110"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Author Info - Left (25%) */}
          <div className="w-1/4 border-r border-[#e5d5c5] p-8 flex flex-col bg-gradient-to-b from-[#fdfaf7] to-white">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 border-4 border-[#f9a06b] ring-4 ring-[#ffc8a6]/30 mb-4 transition-transform duration-300 hover:scale-105">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold text-gray-900 hover:text-[#f9a06b] transition-colors cursor-pointer">{post.user.name}</h3>
              <p className="text-sm text-gray-500">@{post.user.username}</p>
              
              {post.user.bio && (
                <p className="text-sm text-gray-600 mt-3 px-4">{post.user.bio}</p>
              )}

              <div className="flex gap-8 mt-4 text-center">
                <div className="group cursor-pointer">
                  <p className="font-semibold text-gray-900 group-hover:text-[#f9a06b] transition-colors">{post.user.followers.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Followers</p>
                </div>
                <div className="group cursor-pointer">
                  <p className="font-semibold text-gray-900 group-hover:text-[#f9a06b] transition-colors">{post.user.following.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Following</p>
                </div>
              </div>

              <Button className="mt-6 w-full bg-gradient-to-r from-[#f9a06b] to-[#ffc8a6] hover:from-[#f9a06b]/90 hover:to-[#ffc8a6]/90 text-white font-medium rounded-xl shadow-lg shadow-[#f9a06b]/20 hover:shadow-xl transition-all duration-300">
                Follow
              </Button>
            </div>

            {/* Post Actions */}
            <div className="mt-auto pt-6 border-t border-[#e5d5c5]">
              <div className="flex items-center justify-around mb-4">
                <button 
                  onClick={handleLike}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110",
                    isLiked ? "text-[#f9a06b]" : "text-gray-500 hover:text-[#f9a06b]"
                  )}
                >
                  <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
                  <span className="text-sm font-medium">{displayLikes}</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#f9a06b] transition-all duration-300 hover:scale-110">
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-sm font-medium">{post.comments.length}</span>
                </button>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#f9a06b] transition-all duration-300 hover:scale-110"
                >
                  <Share2 className="h-6 w-6" />
                </button>
                <button 
                  onClick={() => setSaved(!saved)}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110",
                    saved ? "text-[#f9a06b]" : "text-gray-500 hover:text-[#f9a06b]"
                  )}
                >
                  <Bookmark className={cn("h-6 w-6", saved && "fill-current")} />
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Posted {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Image - Center (50%) */}
          <div className="w-1/2 p-8 flex flex-col items-center justify-center bg-[#fdfaf7]">
            <div className="relative group">
              <img
                src={post.image}
                alt={post.content.slice(0, 50)}
                className="max-h-[60vh] w-auto object-contain rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
            </div>
            
            {/* Post Text */}
            <div className="mt-6 text-center max-w-md">
              <p className="text-gray-700 leading-relaxed text-base">{post.content}</p>
              {post.isFeatured && (
                <span className="inline-block mt-3 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-[#f9a06b] to-[#ffc8a6] text-white rounded-full shadow-md">
                  ⭐ Featured Post
                </span>
              )}
            </div>
          </div>

          {/* Comments - Right (25%) */}
          <div className="w-1/4 border-l border-[#e5d5c5] p-6 flex flex-col bg-white">
            <Comments
              comments={post.comments}
              onAddComment={(content) => onAddComment?.(post.id, content)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />
    </>
  );
}
