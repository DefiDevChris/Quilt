'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Heart } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { BlogContent } from '@/components/social/BlogContent';
import { FeedContent } from '@/components/social/FeedContent';

export type SplitPanelId = 'blog' | 'saved' | 'feed' | 'profile';

const MOCK_SAVED = [
  {
    title: 'Just finished my churn dash quilt!',
    image: '/images/quilts/quilt_01_closeup_churndash.png',
    author: 'Sarah Stitches',
    likes: 156,
  },
  {
    title: 'Scrappy quilt corner — all my scraps!',
    image: '/images/quilts/quilt_03_closeup_scrappy.png',
    author: 'Jenny Blocks',
    likes: 234,
  },
  {
    title: "Grandmother's bear paw pattern",
    image: '/images/quilts/quilt_04_closeup_bearpaw.png',
    author: 'Rita Patterns',
    likes: 312,
  },
];

// ── Blog Strip: Pattern book with stitching lines ────────────────────────────

function BlogStripVertical() {
  return (
    <div className="absolute inset-0 overflow-hidden transition-all duration-500 group-hover:bg-white/90 group-hover:shadow-xl">
      {/* Base glass */}
      <div className="absolute inset-0 glass-panel" />

      {/* Quilt block pattern - log cabin style */}
      <div className="absolute inset-0 opacity-[0.06]">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="blog-block"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="40" height="40" fill="#FFF9F2" />
              <rect x="0" y="0" width="40" height="12" fill="#FFB085" opacity="0.7" />
              <rect x="0" y="0" width="12" height="28" fill="#F4A261" opacity="0.6" />
              <rect x="0" y="0" width="20" height="20" fill="#E76F51" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blog-block)" />
        </svg>
      </div>

      {/* Stitching lines */}
      <div
        className="absolute left-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #FFB085 0px, #FFB085 4px, transparent 4px, transparent 8px)',
        }}
      />
      <div
        className="absolute right-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #FFB085 0px, #FFB085 4px, transparent 4px, transparent 8px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full items-center justify-between py-4 pt-6 pb-6">
        {/* Title at top */}
        <span className="text-slate-800 font-extrabold text-xl tracking-tight text-center drop-shadow-sm">
          Blog
        </span>

        {/* Big simple graphic - centered */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative">
            {/* Warm glow */}
            <div className="absolute inset-0 bg-orange-300/30 rounded-full blur-2xl scale-[1.8]" />
            {/* Icon - NO ring */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <img
                src="/icons/quilt-13-dashed-squares-Photoroom.png"
                alt="Blog"
                className="w-24 h-24 object-contain drop-shadow-lg relative z-10"
              />
            </div>
          </div>
        </div>

        {/* Mascot at bottom */}
        <div className="relative mt-3">
          <img
            src="/mascots&avatars/corgi29.png"
            alt=""
            className="w-20 h-20 object-contain drop-shadow-md"
          />
        </div>
      </div>
    </div>
  );
}

function BlogStripHorizontal() {
  return (
    <div className="absolute inset-0 flex items-center gap-3 px-4 transition-all duration-300 overflow-hidden bg-[#FFF9F2]/80 backdrop-blur-md shadow-sm group-hover:bg-white/90">
      {/* Stitching top & bottom */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, #FFB085 0px, #FFB085 4px, transparent 4px, transparent 8px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, #FFB085 0px, #FFB085 4px, transparent 4px, transparent 8px)',
        }}
      />
      {/* Pattern book icon */}
      <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center relative shrink-0">
        <img
          src="/icons/quilt-13-dashed-squares-Photoroom.png"
          alt="Blog"
          className="w-8 h-8 object-contain drop-shadow"
        />
      </div>

      {/* Title */}
      <span className="text-base font-extrabold text-slate-800 tracking-wide">Blog</span>

      {/* Mascot */}
      <img
        src="/mascots&avatars/corgi29.png"
        alt=""
        className="ml-auto w-14 h-14 object-contain drop-shadow"
      />
    </div>
  );
}

// ── Saved Strip: Fabric swatch collection with hearts ────────────────────────

function SavedStripVertical() {
  return (
    <div className="absolute inset-0 overflow-hidden transition-all duration-500 group-hover:bg-white/90 group-hover:shadow-xl">
      {/* Base glass */}
      <div className="absolute inset-0 glass-panel" />

      {/* Fabric swatch pattern - scattered hearts */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="saved-hearts"
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="32" height="32" fill="#FFF9F2" />
              <path
                d="M16 28 C16 28 4 20 4 12 C4 6 10 4 16 10 C22 4 28 6 28 12 C28 20 16 28 16 28Z"
                fill="#F43F5E"
                opacity="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#saved-hearts)" />
        </svg>
      </div>

      {/* Stitching lines */}
      <div
        className="absolute left-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #FB7185 0px, #FB7185 3px, transparent 3px, transparent 7px)',
        }}
      />
      <div
        className="absolute right-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #FB7185 0px, #FB7185 3px, transparent 3px, transparent 7px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full items-center justify-between py-4 pt-6 pb-6">
        {/* Title at top */}
        <span className="text-slate-800 font-extrabold text-xl tracking-tight text-center drop-shadow-sm">
          Saved
        </span>

        {/* Big simple graphic - centered */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative">
            {/* Warm rose glow */}
            <div className="absolute inset-0 bg-rose-300/30 rounded-full blur-2xl scale-[1.8]" />
            {/* Icon - NO ring */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <img
                src="/icons/quilt-10-pincushion-Photoroom.png"
                alt="Saved"
                className="w-24 h-24 object-contain drop-shadow-lg relative z-10"
              />
            </div>
          </div>
        </div>

        {/* Mascot at bottom */}
        <div className="relative mt-3">
          <img
            src="/mascots&avatars/corgi20.png"
            alt=""
            className="w-20 h-20 object-contain drop-shadow-md"
          />
        </div>
      </div>
    </div>
  );
}

function SavedStripHorizontal() {
  return (
    <div className="absolute inset-0 flex items-center gap-3 px-4 transition-all duration-300 overflow-hidden bg-[#FFF9F2]/80 backdrop-blur-md shadow-sm group-hover:bg-white/90">
      {/* Stitching top & bottom */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, #FB7185 0px, #FB7185 3px, transparent 3px, transparent 7px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, #FB7185 0px, #FB7185 3px, transparent 3px, transparent 7px)',
        }}
      />
      {/* Pincushion icon - NO ring */}
      <div className="w-10 h-10 rounded-xl bg-transparent shadow-md flex items-center justify-center relative shrink-0">
        <img
          src="/icons/quilt-10-pincushion-Photoroom.png"
          alt="Saved"
          className="w-8 h-8 object-contain drop-shadow"
        />
      </div>

      {/* Title */}
      <span className="text-base font-extrabold text-slate-800 tracking-wide">Saved</span>

      {/* Mascot */}
      <img
        src="/mascots&avatars/corgi20.png"
        alt=""
        className="ml-auto w-14 h-14 object-contain drop-shadow"
      />
    </div>
  );
}

// ── Feed Strip: Community quilt with flying geese ────────────────────────────

function FeedStripVertical() {
  return (
    <div className="absolute inset-0 overflow-hidden transition-all duration-500 group-hover:bg-white/90 group-hover:shadow-xl">
      {/* Base glass */}
      <div className="absolute inset-0 glass-panel" />

      {/* Flying geese pattern - community quilt */}
      <div className="absolute inset-0 opacity-[0.08]">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="feed-geese"
              x="0"
              y="0"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="48" height="48" fill="#FFF9F2" />
              <path d="M0 48 L24 24 L48 48 Z" fill="#FBBF24" opacity="0.6" />
              <path d="M0 36 L12 24 L24 36 Z" fill="#FB923C" opacity="0.5" />
              <path d="M24 36 L36 24 L48 36 Z" fill="#F59E0B" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#feed-geese)" />
        </svg>
      </div>

      {/* Stitching lines */}
      <div
        className="absolute left-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #F59E0B 0px, #F59E0B 2px, transparent 2px, transparent 6px)',
        }}
      />
      <div
        className="absolute right-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #F59E0B 0px, #F59E0B 2px, transparent 2px, transparent 6px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full items-center justify-between py-4 pt-6 pb-6">
        {/* Title at top */}
        <span className="text-slate-800 font-extrabold text-xl tracking-tight text-center drop-shadow-sm">
          Feed
        </span>

        {/* Big simple graphic - centered */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative">
            {/* Warm amber glow */}
            <div className="absolute inset-0 bg-amber-300/30 rounded-full blur-2xl scale-[1.8]" />
            {/* Icon - NO ring */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <img
                src="/icons/quilt-01-spool-Photoroom.png"
                alt="Feed"
                className="w-24 h-24 object-contain drop-shadow-lg relative z-10"
              />
            </div>
          </div>
        </div>

        {/* Mascot at bottom */}
        <div className="relative mt-3">
          <img
            src="/mascots&avatars/corgi12.png"
            alt=""
            className="w-20 h-20 object-contain drop-shadow-md"
          />
        </div>
      </div>
    </div>
  );
}

function FeedStripHorizontal() {
  return (
    <div className="absolute inset-0 flex items-center gap-3 px-4 transition-all duration-300 overflow-hidden bg-[#FFF9F2]/80 backdrop-blur-md shadow-sm group-hover:bg-white/90">
      {/* Stitching top & bottom */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, #F59E0B 0px, #F59E0B 2px, transparent 2px, transparent 6px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, #F59E0B 0px, #F59E0B 2px, transparent 2px, transparent 6px)',
        }}
      />
      {/* Thread spool icon */}
      <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center shrink-0">
        <img
          src="/icons/quilt-01-spool-Photoroom.png"
          alt="Feed"
          className="w-8 h-8 object-contain drop-shadow"
        />
      </div>

      {/* Title */}
      <span className="text-base font-extrabold text-slate-800 tracking-wide">Feed</span>

      {/* Mascot */}
      <img
        src="/mascots&avatars/corgi12.png"
        alt=""
        className="ml-auto w-14 h-14 object-contain drop-shadow"
      />
    </div>
  );
}

// ── Profile Strip: Personal sewing kit with measuring tape ───────────────────

function ProfileStripVertical() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'Q';

  return (
    <div className="absolute inset-0 overflow-hidden transition-all duration-500 group-hover:bg-white/90 group-hover:shadow-xl">
      {/* Base glass */}
      <div className="absolute inset-0 glass-panel" />

      {/* Measuring tape pattern - sewing notion */}
      <div className="absolute inset-0 opacity-[0.06]">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="profile-tape"
              x="0"
              y="0"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="48" height="48" fill="#FFF9F2" />
              <line x1="8" y1="0" x2="8" y2="12" stroke="#FB923C" strokeWidth="1" opacity="0.4" />
              <line
                x1="16"
                y1="0"
                x2="16"
                y2="8"
                stroke="#FB923C"
                strokeWidth="0.7"
                opacity="0.3"
              />
              <line x1="24" y1="0" x2="24" y2="12" stroke="#FB923C" strokeWidth="1" opacity="0.4" />
              <line
                x1="32"
                y1="0"
                x2="32"
                y2="8"
                stroke="#FB923C"
                strokeWidth="0.7"
                opacity="0.3"
              />
              <line x1="40" y1="0" x2="40" y2="12" stroke="#FB923C" strokeWidth="1" opacity="0.4" />
              <rect x="0" y="20" width="48" height="8" fill="#FB923C" opacity="0.15" rx="1" />
              <circle cx="24" cy="36" r="2" fill="#E76F51" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profile-tape)" />
        </svg>
      </div>

      {/* Stitching lines */}
      <div
        className="absolute left-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #FB923C 0px, #FB923C 4px, transparent 4px, transparent 10px)',
        }}
      />
      <div
        className="absolute right-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #FB923C 0px, #FB923C 4px, transparent 4px, transparent 10px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full items-center justify-between py-4 pt-6 pb-6">
        {/* Title at top */}
        <span className="text-slate-800 font-extrabold text-xl tracking-tight text-center drop-shadow-sm">
          Profile
        </span>

        {/* User avatar and name */}
        <div className="flex-1 flex flex-col items-center justify-center w-full gap-3">
          <div className="relative">
            {/* Warm glow */}
            <div className="absolute inset-0 bg-orange-300/30 rounded-full blur-2xl scale-[1.8]" />
            {/* Avatar */}
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="relative w-24 h-24 rounded-full object-cover shadow-xl"
              />
            ) : (
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-orange-200 to-rose-200 flex items-center justify-center shadow-xl">
                <span className="text-4xl font-bold text-orange-600">{initial}</span>
              </div>
            )}
          </div>
          {/* Name and username */}
          <div className="text-center">
            <p className="text-slate-800 font-extrabold text-base leading-tight">
              {user?.name ?? 'Your Name'}
            </p>
            <p className="text-orange-500 font-semibold text-xs leading-tight">
              @{user?.email?.split('@')[0] ?? 'username'}
            </p>
          </div>
        </div>

        {/* Mascot at bottom */}
        <div className="relative mt-3">
          <img
            src="/mascots&avatars/corgi28.png"
            alt=""
            className="w-20 h-20 object-contain drop-shadow-md"
          />
        </div>
      </div>
    </div>
  );
}

function ProfileStripHorizontal() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'Q';

  return (
    <div className="absolute inset-0 flex items-center gap-3 px-4 transition-all duration-300 overflow-hidden bg-[#FFF9F2]/80 backdrop-blur-md shadow-sm group-hover:bg-white/90">
      {/* Stitching top & bottom */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, #FB923C 0px, #FB923C 4px, transparent 4px, transparent 10px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, #FB923C 0px, #FB923C 4px, transparent 4px, transparent 10px)',
        }}
      />
      {/* Avatar */}
      <div className="relative shrink-0">
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover shadow-md relative"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-200 to-rose-200 flex items-center justify-center shadow-md relative">
            <span className="text-sm font-bold text-orange-600">{initial}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <span className="text-base font-extrabold text-slate-800 tracking-wide truncate">
        {user?.name ?? 'Profile'}
      </span>

      {/* Mascot */}
      <img
        src="/mascots&avatars/corgi28.png"
        alt=""
        className="ml-auto w-14 h-14 object-contain drop-shadow"
      />
    </div>
  );
}

// ── Content panels ──────────────────────────────────────────────────────────

function SavedContent() {
  return (
    <div className="p-6 lg:p-8 pb-16 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark size={20} className="text-orange-500" />
        <h2 className="font-extrabold text-xl text-slate-800">Saved</h2>
        <span className="text-xs text-slate-500 font-medium">{MOCK_SAVED.length} posts</span>
      </div>

      <div className="space-y-5">
        {MOCK_SAVED.map((post, i) => (
          <article
            key={i}
            className="glass-panel feed-post-hover rounded-[1.5rem] overflow-hidden cursor-pointer"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={post.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-800 text-base mb-2">{post.title}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center border border-white shadow-sm">
                    <span className="text-[10px] font-bold text-orange-500">
                      {post.author.charAt(0)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{post.author}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="flex items-center gap-1 text-xs">
                    <Heart size={14} /> {post.likes}
                  </span>
                  <Bookmark size={14} className="text-orange-500 fill-orange-500" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProfileContentPanel() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'Q';
  const [stats, setStats] = useState<{ projectCount: number; postCount: number } | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [projectsRes, postsRes] = await Promise.all([
          fetch('/api/projects?limit=1'),
          fetch('/api/community?limit=1'),
        ]);
        const projectsData = projectsRes.ok ? await projectsRes.json() : null;
        const postsData = postsRes.ok ? await postsRes.json() : null;
        setStats({
          projectCount: projectsData?.data?.projects?.length ?? 0,
          postCount: postsData?.data?.total ?? 0,
        });
      } catch {
        // silent
      }
    }
    if (user) loadStats();
  }, [user]);

  if (!user) {
    return (
      <div className="p-6 lg:p-8 pb-16 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-24 w-24 rounded-full bg-white/50 mx-auto" />
          <div className="h-6 bg-white/50 rounded-full w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  const avatarSrc = user.image;
  const displayName = user.name;

  return (
    <div className="p-6 lg:p-8 pb-16 max-w-2xl mx-auto">
      <h2 className="font-extrabold text-xl text-slate-800 mb-6">Profile</h2>

      {/* Profile Summary Card */}
      <div className="rounded-[1.5rem] glass-elevated p-6 mb-4">
        <div className="flex items-start gap-4">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-orange-500">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-800 truncate">{displayName}</h3>
            <p className="text-sm text-slate-600 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link
          href="/dashboard"
          className="rounded-[1.5rem] glass-elevated p-4 hover:shadow-lg transition-all"
        >
          <p className="text-2xl font-bold text-slate-800">
            {stats?.projectCount ?? '\u2014'}
          </p>
          <p className="text-sm text-slate-600">
            {(stats?.projectCount ?? 0) === 1 ? 'Project' : 'Projects'}
          </p>
        </Link>
        <Link
          href="/socialthreads"
          className="rounded-[1.5rem] glass-elevated p-4 hover:shadow-lg transition-all"
        >
          <p className="text-2xl font-bold text-slate-800">
            {stats?.postCount ?? '\u2014'}
          </p>
          <p className="text-sm text-slate-600">
            {(stats?.postCount ?? 0) === 1 ? 'Post' : 'Posts'}
          </p>
        </Link>
      </div>

      {/* Link to full profile & settings */}
      <div className="rounded-[1.5rem] glass-elevated divide-y divide-white/30">
        <Link
          href="/profile"
          className="flex items-center justify-between p-4 hover:bg-white/40 transition-colors first:rounded-t-[1.5rem] last:rounded-b-[1.5rem]"
        >
          <div>
            <p className="text-sm font-bold text-slate-800">All Settings</p>
            <p className="text-xs text-slate-600 mt-0.5">Edit profile, billing, and account</p>
          </div>
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ── Design Studio divider: Rotary cutter & ruler theme ───────────────────────

function StudioDivider() {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 shrink-0 w-full aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden group"
    >
      {/* Gradient background - warm orange to rose */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-rose-400" />

      {/* Ruler grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="studio-ruler"
              x="0"
              y="0"
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="white" strokeWidth="1" />
              <line x1="8" y1="0" x2="8" y2="4" stroke="white" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="16" y2="0" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#studio-ruler)" />
        </svg>
      </div>

      {/* Diagonal stitch lines */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 4px, white 4px, white 5px)',
        }}
      />

      {/* Hover lift effect */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />

      {/* Content - BIGGER */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {/* Icon container with glow - BIGGER */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/40 rounded-3xl blur-xl" />
          <div className="relative w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-sm border-3 border-white/50 flex items-center justify-center shadow-2xl">
            <img
              src="/icons/quilt-04-scissors-Photoroom.png"
              alt="Design Studio"
              className="w-12 h-12 object-contain drop-shadow-lg brightness-0 invert"
            />
          </div>
        </div>

        {/* Text label - BIGGER */}
        <div className="text-center">
          <span className="text-white text-lg font-extrabold tracking-wider uppercase drop-shadow-lg leading-none block">
            Design
          </span>
          <span className="text-white/90 text-base font-bold tracking-widest uppercase leading-none block mt-1">
            Studio
          </span>
        </div>
      </div>

      {/* Bottom sparkle accents */}
      <div className="absolute bottom-3 w-1.5 h-1.5 rounded-full bg-white/70" />
      <div className="absolute bottom-4 right-4 w-1 h-1 rounded-full bg-white/50" />
      <div className="absolute bottom-6 left-6 w-0.5 h-0.5 rounded-full bg-white/40" />
    </Link>
  );
}

// ── Panel slot ──────────────────────────────────────────────────────────────

interface PanelSlotProps {
  active: boolean;
  groupActive: boolean;
  position: 'top' | 'bottom';
  onClick: () => void;
  children: React.ReactNode;
  renderStrip: (orientation: 'vertical' | 'horizontal') => React.ReactNode;
}

function PanelSlot({
  active,
  groupActive,
  position,
  onClick,
  children,
  renderStrip,
}: PanelSlotProps) {
  const height = !groupActive ? '50%' : active ? 'calc(100% - 3vw)' : '3vw';
  const isHorizontal = groupActive && !active;

  return (
    <div
      onClick={!active ? onClick : undefined}
      className={[
        'relative w-full overflow-hidden transition-all duration-700 ease-in-out group',
        position === 'top' ? 'border-b border-white/40' : '',
        !active ? 'cursor-pointer' : 'cursor-default',
      ].join(' ')}
      style={{ height }}
    >
      <div
        className={[
          'absolute inset-0 overflow-y-auto overscroll-contain transition-opacity duration-700',
          active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
        ].join(' ')}
      >
        {children}
      </div>

      <div
        className={[
          'absolute inset-0 transition-opacity duration-700',
          active ? 'opacity-0 z-0 pointer-events-none' : 'opacity-100 z-10',
        ].join(' ')}
      >
        {renderStrip(isHorizontal ? 'horizontal' : 'vertical')}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

interface SocialSplitPaneProps {
  onPanelChange?: (panel: SplitPanelId) => void;
}

export function SocialSplitPane({ onPanelChange }: SocialSplitPaneProps) {
  const [activePanel, setActivePanel] = useState<SplitPanelId>('feed');

  const activate = (panel: SplitPanelId) => {
    setActivePanel(panel);
    onPanelChange?.(panel);
  };

  const isLeftActive = activePanel === 'blog' || activePanel === 'saved';
  const isRightActive = activePanel === 'feed' || activePanel === 'profile';

  return (
    <>
      <div className="hidden lg:flex h-full w-full overflow-hidden">
        <div
          className="h-full relative flex flex-col border-r border-white/40 flex-shrink-0 transition-all duration-700 ease-in-out"
          style={{ width: isLeftActive ? '90%' : '10%' }}
        >
          <PanelSlot
            active={activePanel === 'blog'}
            groupActive={isLeftActive}
            position="top"
            onClick={() => activate('blog')}
            renderStrip={(o) =>
              o === 'vertical' ? <BlogStripVertical /> : <BlogStripHorizontal />
            }
          >
            <div className="p-6 lg:p-8 pb-16">
              <BlogContent />
            </div>
          </PanelSlot>

          {!isLeftActive && <StudioDivider />}

          <PanelSlot
            active={activePanel === 'saved'}
            groupActive={isLeftActive}
            position="bottom"
            onClick={() => activate('saved')}
            renderStrip={(o) =>
              o === 'vertical' ? <SavedStripVertical /> : <SavedStripHorizontal />
            }
          >
            <SavedContent />
          </PanelSlot>
        </div>

        <div
          className="h-full relative flex flex-col flex-shrink-0 transition-all duration-700 ease-in-out"
          style={{ width: isRightActive ? '90%' : '10%' }}
        >
          <PanelSlot
            active={activePanel === 'feed'}
            groupActive={isRightActive}
            position="top"
            onClick={() => activate('feed')}
            renderStrip={(o) =>
              o === 'vertical' ? <FeedStripVertical /> : <FeedStripHorizontal />
            }
          >
            <div className="p-6 lg:p-8 pb-16">
              <FeedContent />
            </div>
          </PanelSlot>

          {!isRightActive && <StudioDivider />}

          <PanelSlot
            active={activePanel === 'profile'}
            groupActive={isRightActive}
            position="bottom"
            onClick={() => activate('profile')}
            renderStrip={(o) =>
              o === 'vertical' ? <ProfileStripVertical /> : <ProfileStripHorizontal />
            }
          >
            <ProfileContentPanel />
          </PanelSlot>
        </div>
      </div>

      <div className="lg:hidden flex flex-col h-full">
        <div className="flex shrink-0 border-b border-outline-variant bg-background/80 backdrop-blur-sm">
          {(['blog', 'saved', 'feed', 'profile'] as SplitPanelId[]).map((panel) => (
            <button
              key={panel}
              onClick={() => activate(panel)}
              className={[
                'relative flex-1 py-3 text-sm font-semibold transition-colors capitalize',
                activePanel === panel ? 'text-primary' : 'text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              {panel}
              {activePanel === panel && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {activePanel === 'blog' && (
            <div className="p-4 pb-12">
              <BlogContent />
            </div>
          )}
          {activePanel === 'saved' && <SavedContent />}
          {activePanel === 'feed' && (
            <div className="p-4 pb-12">
              <FeedContent />
            </div>
          )}
          {activePanel === 'profile' && <ProfileContentPanel />}
        </div>
      </div>
    </>
  );
}
