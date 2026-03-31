'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';

interface SaveButtonProps {
  postId: string;
  isSaved: boolean;
  onToggle: (saved: boolean) => void;
}

export function SaveButton({ postId, isSaved, onToggle }: SaveButtonProps) {
  const [saved, setSaved] = useState(isSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const next = !saved;
    setSaved(next);
    try {
      await fetch(`/api/community/${postId}/save`, {
        method: next ? 'POST' : 'DELETE',
      });
      onToggle(next);
    } catch {
      setSaved(!next);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        saved
          ? 'text-primary bg-primary-container/50'
          : 'text-secondary hover:text-on-surface hover:bg-surface-container'
      }`}
    >
      <Bookmark
        size={16}
        className={saved ? 'fill-current' : ''}
      />
    </button>
  );
}
