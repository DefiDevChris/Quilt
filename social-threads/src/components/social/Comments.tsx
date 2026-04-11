'use client';

import { useState } from 'react';
import { Heart, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Comment } from '@/types/social';
import { cn } from '@/lib/utils';

interface CommentsProps {
  comments: Comment[];
  onAddComment?: (content: string) => void;
  className?: string;
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
  return `${days}d ago`;
}

export function Comments({ comments, onAddComment, className }: CommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = (commentId: string) => {
    setLikedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (newComment.trim()) {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      onAddComment?.(newComment);
      setNewComment('');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Comments
        </h3>
        <span className="text-sm text-gray-500 bg-[#fdfaf7] px-2 py-0.5 rounded-full">{comments.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id}>
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 border border-[#e5d5c5]">
                  <AvatarImage src={comment.user.avatar} />
                  <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{comment.user.name}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        likedComments.has(comment.id)
                          ? "text-primary font-medium"
                          : "text-gray-400"
                      )}
                    >
                      <Heart className={cn(
                        "h-3.5 w-3.5",
                        likedComments.has(comment.id) && "fill-current"
                      )} />
                      {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}
                    </button>
                    <button className="text-xs text-gray-400">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-[#e5d5c5]">
        <div className="flex gap-2">
          <Avatar className="h-8 w-8 border border-[#e5d5c5] flex-shrink-0">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" />
            <AvatarFallback>SM</AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="pr-10 border-[#e5d5c5] rounded-full"
            />
            <Button
              onClick={handleSubmit}
              size="icon"
              disabled={!newComment.trim() || isSubmitting}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-primary rounded-full"
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
