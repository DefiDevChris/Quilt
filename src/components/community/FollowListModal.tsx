'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface FollowUser {
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface FollowListModalProps {
  readonly username: string;
  readonly tab: 'followers' | 'following';
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function FollowListModal({ username, tab: initialTab, isOpen, onClose }: FollowListModalProps) {
  const [tab, setTab] = useState(initialTab);
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(username)}/${tab}?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setUsers(tab === 'followers' ? data.data.followers : data.data.following);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [username, tab]);

  useEffect(() => {
    if (isOpen) fetchList();
  }, [isOpen, fetchList]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-on-surface/30 z-50"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={tab === 'followers' ? 'Followers' : 'Following'}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm max-h-[70vh] flex flex-col rounded-xl bg-surface shadow-elevation-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/[0.08]">
              <div className="flex gap-1 p-0.5 bg-surface-container rounded-lg">
                {(['followers', 'following'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      tab === t
                        ? 'bg-surface shadow-sm text-on-surface'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    {t === 'followers' ? 'Followers' : 'Following'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M4 4L14 14M14 4L4 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : users.length === 0 ? (
                <div className="p-6 text-center text-sm text-secondary">
                  {tab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                </div>
              ) : (
                <div className="py-1">
                  {users.map((user) => (
                    <Link
                      key={user.username}
                      href={`/members/${user.username}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors"
                    >
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-secondary">
                          {(user.displayName ?? user.username ?? '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">
                          {user.displayName ?? user.username}
                        </p>
                        {user.username && (
                          <p className="text-xs text-secondary truncate">@{user.username}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
