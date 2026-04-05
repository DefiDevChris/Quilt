'use client';

import { useState, useOptimistic, startTransition, useCallback } from 'react';

interface FollowButtonProps {
  readonly username: string;
  readonly initialFollowing: boolean;
  readonly onToggle?: (isFollowing: boolean) => void;
}

export function FollowButton({ username, initialFollowing, onToggle }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);

  const [optimisticFollowing, addOptimisticFollowing] = useOptimistic(
    isFollowing,
    (_, nextFollowing: boolean) => nextFollowing
  );

  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  const handleToggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const nextState = !optimisticFollowing;
    const method = optimisticFollowing ? 'DELETE' : 'POST';

    startTransition(() => {
      addOptimisticFollowing(nextState);
    });

    try {
      const res = await fetch(`/api/members/${encodeURIComponent(username)}/follow`, { method });
      if (res.ok) {
        setIsFollowing(nextState);
        onToggle?.(nextState);
      }
    } catch {
      // Reverts automatically because setIsFollowing wasn't called
    } finally {
      setLoading(false);
    }
  }, [optimisticFollowing, loading, username, onToggle, addOptimisticFollowing]);

  if (optimisticFollowing) {
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
