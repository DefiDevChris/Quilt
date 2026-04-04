'use client';

import { useState } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface ShareToThreadsModalProps {
  templateId: string | null;
  onClose: () => void;
  onNeedPublish: () => void;
}

export function ShareToThreadsModal({ templateId, onClose, onNeedPublish }: ShareToThreadsModalProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const handleShare = async () => {
    if (!templateId) {
      onNeedPublish();
      return;
    }

    if (!user) {
      setError('You must be signed in to share');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/templates/rethread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          comment: comment.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to share');
      }

      onClose();
      window.location.href = '/socialthreads';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share to threads');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-elevation-4 p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-on-surface">Share to Social Threads</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Add a comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this design..."
              rows={4}
              className="w-full px-3 py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {!templateId && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-on-surface">
              You need to publish this template first before sharing to threads.
            </div>
          )}

          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface font-medium hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={isSubmitting || !templateId}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <MessageSquare size={16} />
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
