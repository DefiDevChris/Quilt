'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface CommentInputProps {
  replyToId?: string;
  replyToUsername?: string;
  onCancel?: () => void;
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

const MAX_CHARS = 2000;
const CHAR_WARNING_THRESHOLD = 1800;

export function CommentInput({
  replyToId,
  replyToUsername,
  onCancel,
  onSubmit,
  isSubmitting,
  disabled = false,
  disabledMessage,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isReply = Boolean(replyToId);
  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const showCharCounter = charCount > CHAR_WARNING_THRESHOLD;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting && !disabled;

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [content, autoResize]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(content.trim());
    setContent('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (canSubmit) {
        onSubmit(content.trim());
        setContent('');
      }
    }
  }

  if (disabled && disabledMessage) {
    return (
      <div className="rounded-lg bg-surface-container-high p-4 text-center">
        <p className="text-sm text-secondary">{disabledMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {isReply && replyToUsername && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-secondary">
            Replying to <span className="font-medium text-primary">@{replyToUsername}</span>
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-secondary hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isReply ? 'Write a reply...' : 'Add a comment...'}
          rows={isReply ? 2 : 3}
          disabled={disabled || isSubmitting}
          className="w-full rounded-lg border border-outline-variant bg-surface p-3 text-sm text-on-surface placeholder:text-secondary/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-50"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-secondary">
          {showCharCounter && (
            <span className={isOverLimit ? 'text-error font-medium' : ''}>
              {charCount}/{MAX_CHARS}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isReply && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-1.5 text-sm text-secondary hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
