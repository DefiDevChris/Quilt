'use client';

import { useState, useCallback } from 'react';

interface FollowButtonProps {
  readonly username: string;
  readonly initialFollowing: boolean;
  readonly onToggle?: (isFollowing: boolean) => void;
}

export function FollowButton({ username, initialFollowing, onToggle }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  const handleToggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const method = isFollowing ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/members/${encodeURIComponent(username)}/follow`, { method });
      if (res.ok) {
        const newState = !isFollowing;
        setIsFollowing(newState);
        onToggle?.(newState);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [isFollowing, loading, username, onToggle]);

  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        disabled={loading}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
          hover
            ? 'border-error/50 text-error bg-error/5'
            : 'border-outline-variant text-on-surface bg-surface-container'
        }`}
      >
        {loading ? '...' : hover ? 'Unfollow' : 'Following'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-primary-on)',
      }}
    >
      {loading ? '...' : 'Follow'}
    </button>
  );
}
