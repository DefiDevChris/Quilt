'use client';

import { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Post } from '@/types/social';
import { Comments } from './Comments';
import { ShareModal } from './ShareModal';
import { EditPostModal } from './EditPostModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { EmojiReactions } from './EmojiReactions';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PostCardProps {
  post: Post;
  viewMode: 'full' | 'grid';
  onImageClick?: (post: Post) => void;
  onAddComment?: (postId: string, content: string) => void;
  onSavePost?: (postId: string, saved: boolean) => void;
  onEditPost?: (postId: string, content: string, image?: string) => void;
  onDeletePost?: (postId: string) => void;
  savedPosts?: Set<string>;
  isOwner?: boolean;
  onUserClick?: (user: { id: string; name: string; username: string; avatar: string }) => void;
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
  onEditPost,
  onDeletePost,
  savedPosts,
  isOwner = false,
  onUserClick
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [showHeart, setShowHeart] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const lastClickTime = useRef(0);
  
  const saved = savedPosts?.has(post.id) || false;

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
    toast({
      title: liked ? 'Post unliked' : 'Post liked!',
      description: liked ? 'You removed your like from this post.' : 'You liked this post.',
    });
  };

  const handleDoubleTapLike = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      if (!liked) {
        setLiked(true);
        setLikes(prev => prev + 1);
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
        toast({
          title: 'Post liked! ❤️',
          description: 'Double-tap to like!',
        });
      }
    }
    lastClickTime.current = now;
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSavePost?.(post.id, !saved);
    toast({
      title: !saved ? 'Post saved!' : 'Post unsaved',
      description: !saved ? 'Added to your saved posts.' : 'Removed from your saved posts.',
    });
  };

  const handleShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowShareModal(true);
  };

  const handleReaction = (reaction: string) => {
    toast({
      title: 'Reaction added!',
      description: `You reacted with ${reaction}`,
    });
  };

  const handleEdit = (postId: string, content: string, image?: string) => {
    onEditPost?.(postId, content, image);
    toast({
      title: 'Post updated!',
      description: 'Your post has been updated successfully.',
    });
  };

  const handleDelete = () => {
    onDeletePost?.(post.id);
    setShowDeleteModal(false);
    toast({
      title: 'Post deleted',
      description: 'Your post has been deleted successfully.',
    });
  };

  // Grid View
  if (viewMode === 'grid') {
    return (
      <>
        <div className="bg-white rounded-2xl border border-[#e5d5c5] overflow-hidden shadow-sm">
          <div
            className="relative aspect-[4/3] cursor-pointer overflow-hidden"
            onClick={() => {
              handleDoubleTapLike();
              onImageClick?.(post);
            }}
          >
            <img
              src={post.image}
              alt={post.content.slice(0, 50)}
              className="w-full h-full object-cover"
            />
            {showHeart && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart className="h-24 w-24 text-white fill-white" />
              </div>
            )}

            <div className="absolute top-3 right-3 flex gap-2">
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-full bg-white/90 text-gray-600"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 rounded-2xl">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditModal(true);
                      }}
                      className="cursor-pointer rounded-full mx-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteModal(true);
                      }}
                      className="cursor-pointer text-red-500 rounded-full mx-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
                className={cn(
                  "p-2.5 rounded-full",
                  liked
                    ? "bg-primary text-white"
                    : "bg-white/90 text-gray-600"
                )}
              >
                <Heart className={cn("h-5 w-5", liked && "fill-current")} />
              </button>
            </div>

            {post.isFeatured && (
              <div className="absolute top-3 left-3 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-full">
                ⭐ Featured
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Avatar 
                className="h-8 w-8 border-2 border-secondary cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onUserClick?.(post.user);
                }}
              >
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span 
                className="text-sm font-medium text-gray-900 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onUserClick?.(post.user);
                }}
              >{post.user.name}</span>
              <span className="text-xs text-gray-400 ml-auto">{formatTimeAgo(post.createdAt)}</span>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {post.content}
            </p>

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#e5d5c5]">
              <EmojiReactions
                initialReactions={{ heart: Math.floor(likes / 2), thumbsUp: Math.floor(likes / 3), laugh: Math.floor(likes / 4) }}
                onReact={handleReaction}
              />
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" /> {post.comments.length}
              </span>
              <button
                onClick={(e) => handleShare(e)}
                aria-label="Share post"
                className="text-xs text-gray-500 flex items-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleSave}
                aria-label={saved ? "Unsave post" : "Save post"}
                className={cn(
                  "text-xs flex items-center gap-1.5 ml-auto",
                  saved ? "text-primary" : "text-gray-500"
                )}
              >
                <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
                {saved && <span className="text-[10px]">Saved</span>}
              </button>
            </div>
          </div>
        </div>

        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          post={post}
        />
        
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          post={post}
          onSave={handleEdit}
        />
        
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          postTitle={post.content}
        />
      </>
    );
  }

  // Full View
  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e5d5c5] overflow-hidden shadow-sm">
        {/* Post Header */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <Avatar 
            className="h-12 w-12 border-2 border-primary cursor-pointer"
            onClick={() => onUserClick?.(post.user)}
          >
            <AvatarImage src={post.user.avatar} />
            <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 
              className="font-semibold text-gray-900 cursor-pointer"
              onClick={() => onUserClick?.(post.user)}
            >{post.user.name}</h4>
            <p className="text-sm text-gray-500">@{post.user.username} · {formatTimeAgo(post.createdAt)}</p>
          </div>
          
          {post.isFeatured && (
            <span className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-full">
              ⭐ Featured
            </span>
          )}
          
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full">
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-2xl">
                <DropdownMenuItem 
                  onClick={() => setShowEditModal(true)}
                  className="cursor-pointer rounded-full mx-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteModal(true)}
                  className="cursor-pointer text-red-500 rounded-full mx-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-700 leading-relaxed text-base mb-6">
            {post.content}
          </p>

          <div className="flex gap-6">
            {/* Image - 2/3 */}
            <div
              className="w-2/3 cursor-pointer rounded-xl overflow-hidden relative"
              onClick={() => {
                handleDoubleTapLike();
                onImageClick?.(post);
              }}
            >
              <img
                src={post.image}
                alt={post.content.slice(0, 50)}
                className="w-full h-80 object-cover"
              />
              {showHeart && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                  <Heart className="h-32 w-32 text-white fill-white" />
                </div>
              )}
            </div>

            {/* Comments - 1/3 */}
            <div className="w-1/3 min-h-[320px]">
              <Comments
                comments={post.comments}
                onAddComment={(content) => onAddComment?.(post.id, content)}
                className="h-full"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#e5d5c5]">
            <div className="flex items-center gap-4">
              <EmojiReactions
                initialReactions={{ heart: Math.floor(likes / 2), thumbsUp: Math.floor(likes / 3), laugh: Math.floor(likes / 4) }}
                onReact={handleReaction}
              />
              <button className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <MessageCircle className="h-5 w-5" />
                {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
              </button>
              <button
                onClick={() => handleShare()}
                aria-label="Share post"
                className="flex items-center gap-2 text-sm font-medium text-gray-500"
              >
                <Share2 className="h-5 w-5" />
                Share
              </button>
            </div>
            <button
              onClick={handleSave}
              aria-label={saved ? "Unsave post" : "Save post"}
              className={cn(
                "flex items-center gap-1",
                saved ? "text-primary" : "text-gray-400"
              )}
            >
              <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
              {saved && <span className="text-xs font-medium">Saved</span>}
            </button>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />
      
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onSave={handleEdit}
      />
      
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        postTitle={post.content}
      />
    </>
  );
}
