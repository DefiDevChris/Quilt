'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, Heart, Bookmark, Share2, ExternalLink, Clock } from 'lucide-react';
import { useSocialQuickView, type QuickViewItem } from '@/stores/socialQuickViewStore';
import { useAuthStore } from '@/stores/authStore';
import { RedditStyleComments } from '@/components/community/comments/RedditStyleComments';

function PostContent({ item }: { item: Extract<QuickViewItem, { type: 'post' }> }) {
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(item.isLikedByUser ?? false);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [saved, setSaved] = useState(item.isSavedByUser ?? false);
  const [copied, setCopied] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    const next = !liked;
    setLiked(next);
    setLikeCount(next ? likeCount + 1 : likeCount - 1);
    try {
      await fetch(`/api/community/${item.id}/like`, { method: 'POST' });
    } catch {
      setLiked(!next);
      setLikeCount(next ? likeCount - 1 : likeCount + 1);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch(`/api/community/${item.id}/save`, {
        method: next ? 'POST' : 'DELETE',
      });
      if (!res.ok) setSaved(!next);
    } catch {
      setSaved(!next);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/socialthreads/${item.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <>
      {/* Left: Image */}
      <div className="flex-1 min-w-0 bg-black/10 flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-medium">No image</span>
          </div>
        )}
      </div>

      {/* Right: Info + Actions + Comments */}
      <div className="w-full md:w-[360px] shrink-0 flex flex-col border-l border-white/30 overflow-y-auto">
        {/* Author + title */}
        <div className="p-5 border-b border-white/30 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            {item.creatorAvatarUrl ? (
              <img
                src={item.creatorAvatarUrl}
                alt={item.creatorName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-100 ring-2 ring-white shadow-sm flex items-center justify-center">
                <span className="text-sm font-bold text-orange-500">
                  {item.creatorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-bold text-slate-800 text-sm">{item.creatorName}</p>
              {item.creatorUsername && (
                <p className="text-xs text-slate-500">@{item.creatorUsername}</p>
              )}
            </div>
          </div>
          <h2 className="font-extrabold text-slate-800 text-lg leading-snug mb-1">{item.title}</h2>
          {item.description && (
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
              {item.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-3 flex items-center gap-2 border-b border-white/30 shrink-0">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
              liked ? 'text-rose-500 bg-rose-50' : 'text-slate-600 bg-white/50 hover:bg-white/80'
            }`}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
            {likeCount}
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
              saved
                ? 'text-orange-500 bg-orange-50'
                : 'text-slate-600 bg-white/50 hover:bg-white/80'
            }`}
          >
            <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-slate-600 bg-white/50 hover:bg-white/80 transition-all"
          >
            <Share2 size={15} />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        {/* View full post */}
        <div className="px-5 py-3 border-b border-white/30 shrink-0">
          <Link
            href={`/socialthreads/${item.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
          >
            <ExternalLink size={13} />
            View on profile &amp; full thread
          </Link>
        </div>

        {/* Comments */}
        <div className="flex-1 p-5 min-h-0 overflow-y-auto">
          <RedditStyleComments
            postId={item.id}
            currentUserId={user?.id}
            isAdmin={user?.role === 'admin'}
          />
        </div>
      </div>
    </>
  );
}

function BlogContentPane({ item }: { item: Extract<QuickViewItem, { type: 'blog' }> }) {
  return (
    <>
      {/* Left: image */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 via-rose-50 to-orange-50" />
        )}
      </div>

      {/* Right: info */}
      <div className="w-full md:w-[380px] shrink-0 flex flex-col p-8 border-l border-white/30 overflow-y-auto">
        <span className="inline-flex self-start bg-gradient-to-r from-orange-400 to-rose-400 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-5 shadow-sm">
          {item.category}
        </span>
        <h2 className="text-2xl font-extrabold text-slate-800 leading-tight mb-4">{item.title}</h2>
        {item.excerpt && (
          <p className="text-slate-600 leading-relaxed mb-6 text-sm">{item.excerpt}</p>
        )}

        {/* Author row */}
        <div className="flex items-center gap-3 mb-8">
          {item.authorAvatarUrl ? (
            <img
              src={item.authorAvatarUrl}
              alt={item.authorName}
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center">
              <span className="text-xs font-bold text-orange-500">
                {item.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-800">{item.authorName}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={11} />
              {item.readTimeMinutes} min read
            </div>
          </div>
        </div>

        <Link
          href={`/blog/${item.slug}`}
          className="flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white font-bold text-sm shadow-sm hover:from-orange-500 hover:to-rose-500 transition-all mt-auto"
        >
          Read full article
          <ExternalLink size={14} />
        </Link>
      </div>
    </>
  );
}

function FabricContentPane({ item }: { item: Extract<QuickViewItem, { type: 'fabric' }> }) {
  return (
    <>
      <div className="flex-1 min-w-0 overflow-hidden">
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="w-full md:w-[340px] shrink-0 flex flex-col p-8 border-l border-white/30">
        <span className="inline-flex self-start bg-white/60 border border-white/60 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-5">
          Fabric
        </span>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-3">{item.name}</h2>
        {item.manufacturer && (
          <p className="text-sm text-slate-500 font-medium mb-1">By {item.manufacturer}</p>
        )}
        {item.colorFamily && (
          <p className="text-sm text-slate-500 font-medium mb-8">Color: {item.colorFamily}</p>
        )}
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white font-bold text-sm shadow-sm hover:from-orange-500 hover:to-rose-500 transition-all mt-auto"
        >
          View in Fabric Library
          <ExternalLink size={14} />
        </Link>
      </div>
    </>
  );
}

function PatternContentPane({ item }: { item: Extract<QuickViewItem, { type: 'pattern' }> }) {
  return (
    <>
      <div className="flex-1 min-w-0 bg-orange-50/50 flex items-center justify-center p-10 overflow-hidden">
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt={item.name}
            className="w-full h-full object-contain max-h-[70vh]"
          />
        ) : (
          <svg
            className="w-32 h-32 text-orange-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>
        )}
      </div>
      <div className="w-full md:w-[340px] shrink-0 flex flex-col p-8 border-l border-white/30">
        <span className="inline-flex self-start bg-white/60 border border-white/60 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-5">
          Pattern
        </span>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-3">{item.name}</h2>
        {item.skillLevel && (
          <p className="text-sm text-slate-500 font-medium mb-1">Level: {item.skillLevel}</p>
        )}
        {item.category && (
          <p className="text-sm text-slate-500 font-medium mb-8">Category: {item.category}</p>
        )}
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white font-bold text-sm shadow-sm hover:from-orange-500 hover:to-rose-500 transition-all mt-auto"
        >
          Open in Studio
          <ExternalLink size={14} />
        </Link>
      </div>
    </>
  );
}

export function SocialQuickViewModal() {
  const { item, isOpen, close } = useSocialQuickView();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  if (!mounted || !isOpen || !item) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className="relative w-full sm:max-w-5xl glass-panel-social rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
        style={{ height: '92vh', maxHeight: '900px' }}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-sm transition-all"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Inner layout */}
        <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
          {item.type === 'post' && <PostContent item={item} />}
          {item.type === 'blog' && <BlogContentPane item={item} />}
          {item.type === 'fabric' && <FabricContentPane item={item} />}
          {item.type === 'pattern' && <PatternContentPane item={item} />}
        </div>
      </div>
    </div>,
    document.body
  );
}
