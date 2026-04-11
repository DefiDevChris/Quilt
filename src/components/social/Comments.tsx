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

  const handleLike = (commentId: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  };

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment?.(newComment);
      setNewComment('');
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff8d49]" />
        <h3 className="font-semibold text-sm text-[var(--color-text)]">Comments</h3>
        <span className="text-xs text-[var(--color-text-dim)] ml-auto">{comments.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
        {comments.length === 0 ? (
          <p className="text-sm text-[var(--color-text-dim)] text-center py-6">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                <AvatarImage src={comment.user.avatar} />
                <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-xs text-[var(--color-text)]">{comment.user.name}</span>
                  <span className="text-[10px] text-[var(--color-text-dim)]">·</span>
                  <span className="text-[10px] text-[var(--color-text-dim)]">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-xs text-[var(--color-text-dim)] mt-0.5 leading-relaxed">{comment.content}</p>
                <div className="flex items-center gap-3 mt-1">
                  <button onClick={() => handleLike(comment.id)}
                    className={cn('flex items-center gap-0.5 text-[10px]', likedComments.has(comment.id) ? 'text-[#ff8d49]' : 'text-[var(--color-text-dim)]')}>
                    <Heart className={cn('h-2.5 w-2.5', likedComments.has(comment.id) && 'fill-current')} />
                    {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}
                  </button>
                  <button className="text-[10px] text-[var(--color-text-dim)]">Reply</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="pt-3 mt-2 border-t border-[var(--color-border)]/30">
        <div className="flex gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" />
            <AvatarFallback>SM</AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Input placeholder="Add a comment..." value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="pr-9 border-[var(--color-border)] rounded-full text-xs h-8" />
            <Button onClick={handleSubmit} size="icon" disabled={!newComment.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 bg-[#ff8d49] rounded-full">
              <Send className="h-3 w-3 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
