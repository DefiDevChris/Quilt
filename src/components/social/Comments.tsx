'use client';

import { useState } from 'react';
import { Heart, Send } from 'lucide-react';
import { Avatar, Button, Input } from './ui';
import { Comment } from '@/types/social';

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
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        <h3 className="font-semibold text-sm text-default">Comments</h3>
        <span className="text-xs text-dim bg-default px-2 py-0.5 rounded-full ml-auto">{comments.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {comments.length === 0 ? (
          <p className="text-sm text-dim text-center py-8">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <Avatar
                className="h-8 w-8 shrink-0 mt-0.5 border border-default"
                src={comment.user.avatar}
                fallback={comment.user.name[0]}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm text-default">{comment.user.name}</span>
                  <span className="text-xs text-dim">&middot;</span>
                  <span className="text-xs text-dim">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-dim mt-1 leading-relaxed">{comment.content}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  <button onClick={() => handleLike(comment.id)}
                    className={`flex items-center gap-1 text-xs transition-colors duration-150 ${likedComments.has(comment.id) ? 'text-primary' : 'text-dim hover:text-default'}`}>
                    <Heart className={`h-3 w-3 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                    {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}
                  </button>
                  <button className="text-xs text-dim hover:text-default">Reply</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="pt-4 mt-3 border-t border-default">
        <div className="flex gap-2.5">
          <Avatar
            className="h-8 w-8 shrink-0"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
            fallback="SM"
          />
          <div className="flex-1 relative">
            <Input placeholder="Add a comment..." value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="pr-10 text-sm h-9" />
            <Button onClick={handleSubmit} size="icon" disabled={!newComment.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 bg-primary hover:bg-primary-dark">
              <Send className="h-3.5 w-3.5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
