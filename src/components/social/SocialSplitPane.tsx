'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Heart } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { FeedContent } from '@/components/social/FeedContent';

export type SplitPanelId = 'saved' | 'feed' | 'profile';

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

// ── Saved Strip: Fabric swatch collection with hearts ────────────────────────

function SavedStripVertical() {
  return (
    <div className="absolute inset-0 overflow-hidden group-hover:bg-[#ff8d49]/5">
      {/* Base */}
      <div className="absolute inset-0 bg-[#ffffff] border border-[#e8e1da]" />

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
              <rect x="0" y="0" width="32" height="32" fill="#fdfaf7" />
              <path
                d="M16 28 C16 28 4 20 4 12 C4 6 10 4 16 10 C22 4 28 6 28 12 C28 20 16 28 16 28Z"
                fill="var(--color-primary)"
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
            'repeating-linear-gradient(to bottom, var(--color-primary) 0px, var(--color-primary) 3px, transparent 3px, transparent 7px)',
        }}
      />
      <div
        className="absolute right-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--color-primary) 0px, var(--color-primary) 3px, transparent 3px, transparent 7px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full items-center justify-between py-4 pt-6 pb-6">
        <span className="text-[#2d2a26] text-[24px] leading-[32px] text-center">
          Saved
        </span>

        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-[#ff8d49]/30 rounded-full blur-2xl scale-[1.8]" />
            <div className="relative w-28 h-28 flex items-center justify-center">
              <img
                src="/icons/quilt-10-pincushion-Photoroom.png"
                alt="Saved"
                className="w-24 h-24 object-contain relative z-10"
              />
            </div>
          </div>
        </div>

        <div className="relative mt-3">
          <img src="/mascots&avatars/corgi20.png" alt="" className="w-20 h-20 object-contain" />
        </div>
      </div>
    </div>
  );
}

function SavedStripHorizontal() {
  return (
    <div className="absolute inset-0 flex items-center gap-3 px-4 overflow-hidden bg-[#fdfaf7] group-hover:bg-[#ff8d49]/5">
      {/* Stitching top & bottom */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, var(--color-primary) 0px, var(--color-primary) 3px, transparent 3px, transparent 7px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, var(--color-primary) 0px, var(--color-primary) 3px, transparent 3px, transparent 7px)',
        }}
      />
      <div className="w-10 h-10 bg-transparent flex items-center justify-center relative shrink-0">
        <img
          src="/icons/quilt-10-pincushion-Photoroom.png"
          alt="Saved"
          className="w-8 h-8 object-contain"
        />
      </div>

      <span className="text-base text-[#2d2a26] tracking-wide">Saved</span>

      <img
        src="/mascots&avatars/corgi20.png"
        alt=""
        className="ml-auto w-14 h-14 object-contain"
      />
    </div>
  );
}

// ── Feed Strip: Community quilt with flying geese ────────────────────────────

function FeedStripVertical() {
  return (
    <div className="absolute inset-0 overflow-hidden group-hover:bg-[#ff8d49]/5">
      <div className="absolute inset-0 bg-[#ffffff] border border-[#e8e1da]" />

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
              <path d="M0 36 L12 24 L24 36 Z" fill="var(--color-primary)" opacity="0.5" />
              <path d="M24 36 L36 24 L48 36 Z" fill="var(--color-secondary)" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#feed-geese)" />
        </svg>
      </div>

      <div
        className="absolute left-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--color-secondary) 0px, var(--color-secondary) 2px, transparent 2px, transparent 6px)',
        }}
      />
      <div
        className="absolute right-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--color-secondary) 0px, var(--color-secondary) 2px, transparent 2px, transparent 6px)',
        }}
      />

      <div className="relative z-10 flex flex-col h-full items-center justify-between py-4 pt-6 pb-6">
        <span className="text-[#2d2a26] text-[24px] leading-[32px] text-center">
          Thread
        </span>

        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-[#ffc8a6]/30 rounded-full blur-2xl scale-[1.8]" />
            <div className="relative w-28 h-28 flex items-center justify-center">
              <img
                src="/icons/quilt-01-spool-Photoroom.png"
                alt="Thread"
                className="w-24 h-24 object-contain relative z-10"
              />
            </div>
          </div>
        </div>

        <div className="relative mt-3">
          <img src="/mascots&avatars/corgi12.png" alt="" className="w-20 h-20 object-contain" />
        </div>
      </div>
    </div>
  );
}

function FeedStripHorizontal() {
  return (
    <div className="absolute inset-0 flex items-center gap-3 px-4 overflow-hidden bg-[#fdfaf7] group-hover:bg-[#ff8d49]/5">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, var(--color-secondary) 0px, var(--color-secondary) 2px, transparent 2px, transparent 6px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, var(--color-secondary) 0px, var(--color-secondary) 2px, transparent 2px, transparent 6px)',
        }}
      />
      <div className="w-10 h-10 bg-transparent flex items-center justify-center shrink-0">
        <img
          src="/icons/quilt-01-spool-Photoroom.png"
          alt="Thread"
          className="w-8 h-8 object-contain"
        />
      </div>

      <span className="text-base text-[#2d2a26] tracking-wide">Thread</span>

      <img
        src="/mascots&avatars/corgi12.png"
        alt=""
        className="ml-auto w-14 h-14 object-contain"
      />
    </div>
  );
}

// ── Profile Strip: Personal sewing kit with measuring tape ───────────────────

function ProfileStripVertical() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'Q';

  return (
    <div className="absolute inset-0 overflow-hidden group-hover:bg-[#ff8d49]/5">
      <div className="absolute inset-0 bg-[#ffffff] border border-[#e8e1da]" />

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
              <line x1="8" y1="0" x2="8" y2="12" stroke="var(--color-primary)" strokeWidth="1" opacity="0.4" />
              <line
                x1="16"
                y1="0"
                x2="16"
                y2="8"
                stroke="var(--color-primary)"
                strokeWidth="0.7"
                opacity="0.3"
              />
              <line x1="24" y1="0" x2="24" y2="12" stroke="var(--color-primary)" strokeWidth="1" opacity="0.4" />
              <line
                x1="32"
                y1="0"
                x2="32"
                y2="8"
                stroke="var(--color-primary)"
                strokeWidth="0.7"
                opacity="0.3"
              />
              <line x1="40" y1="0" x2="40" y2="12" stroke="var(--color-primary)" strokeWidth="1" opacity="0.4" />
              <rect x="0" y="20" width="48" height="8" fill="var(--color-primary)" opacity="0.15" rx="1" />
              <circle cx="24" cy="36" r="2" fill="#E76F51" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profile-tape)" />
        </svg>
      </div>

      <div
        className="absolute left-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--color-primary) 0px, var(--color-primary) 4px, transparent 4px, transparent 10px)',
        }}
      />
      <div
        className="absolute right-2 top-0 bottom-0 w-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--color-primary) 0px, var(--color-primary) 4px, transparent 4px, transparent 10px)',
        }}
      />

      <div className="relative z-10 flex flex-col h-full items-center justify-between py-4 pt-6 pb-6">
        <span className="text-[#2d2a26] text-[24px] leading-[32px] text-center">
          Profile
        </span>

        <div className="flex-1 flex flex-col items-center justify-center w-full gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-[#ffc8a6]/30 rounded-full blur-2xl scale-[1.8]" />
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="relative w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="relative w-24 h-24 rounded-full bg-[#ffc8a6] flex items-center justify-center">
                <span className="text-4xl text-[#ff8d49]">{initial}</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-[#2d2a26] text-[18px] leading-[28px]">
              {user?.name ?? 'Your Name'}
            </p>
            <p className="text-[#ff8d49] text-[14px] leading-[20px]">
              @{user?.email?.split('@')[0] ?? 'username'}
            </p>
          </div>
        </div>

        <div className="relative mt-3">
          <img src="/mascots&avatars/corgi28.png" alt="" className="w-20 h-20 object-contain" />
        </div>
      </div>
    </div>
  );
}

function ProfileStripHorizontal() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'Q';

  return (
    <div className="absolute inset-0 flex items-center gap-3 px-4 overflow-hidden bg-[#fdfaf7] group-hover:bg-[#ff8d49]/5">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, var(--color-primary) 0px, var(--color-primary) 4px, transparent 4px, transparent 10px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, var(--color-primary) 0px, var(--color-primary) 4px, transparent 4px, transparent 10px)',
        }}
      />
      <div className="relative shrink-0">
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover relative"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#ffc8a6] flex items-center justify-center relative">
            <span className="text-sm text-[#ff8d49]">{initial}</span>
          </div>
        )}
      </div>

      <span className="text-base text-[#2d2a26] tracking-wide truncate">
        {user?.name ?? 'Profile'}
      </span>

      <img
        src="/mascots&avatars/corgi28.png"
        alt=""
        className="ml-auto w-14 h-14 object-contain"
      />
    </div>
  );
}

// ── Content panels ──────────────────────────────────────────────────────────

function SavedContent() {
  return (
    <div className="p-6 lg:p-8 pb-16 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark size={20} className="text-[#ff8d49]" />
        <h2 className="text-[24px] leading-[32px] text-[#2d2a26]">Saved</h2>
        <span className="text-[14px] leading-[20px] text-[#6b655e]">{MOCK_SAVED.length} designs</span>
      </div>

      <div className="space-y-5">
        {MOCK_SAVED.map((post, i) => (
          <article
            key={i}
            className="bg-[#ffffff] border border-[#e8e1da] rounded-lg overflow-hidden cursor-pointer shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={post.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <h3 className="text-[16px] leading-[24px] text-[#2d2a26] mb-2">{post.title}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#ff8d49]/20 flex items-center justify-center border border-[#ffffff]">
                    <span className="text-[14px] leading-[20px] text-[#2d2a26]">
                      {post.author.charAt(0)}
                    </span>
                  </div>
                  <span className="text-[14px] leading-[20px] text-[#6b655e]">{post.author}</span>
                </div>
                <div className="flex items-center gap-3 text-[#6b655e]">
                  <span className="flex items-center gap-1 text-[14px] leading-[20px]">
                    <Heart size={14} /> {post.likes}
                  </span>
                  <Bookmark size={14} className="text-[#ff8d49] fill-[#ff8d49]" />
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
          fetch('/api/projects?limit=50'),
          fetch('/api/social?limit=1'),
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
          <div className="h-24 w-24 rounded-full bg-[#fdfaf7] mx-auto" />
          <div className="h-6 bg-[#fdfaf7] w-1/3 mx-auto rounded-lg" />
        </div>
      </div>
    );
  }

  const avatarSrc = user.image;
  const displayName = user.name;

  return (
    <div className="p-6 lg:p-8 pb-16 max-w-2xl mx-auto">
      <h2 className="text-[24px] leading-[32px] text-[#2d2a26] mb-6">Profile</h2>

      <div className="rounded-lg bg-[#ffffff] border border-[#e8e1da] p-6 mb-4 shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
        <div className="flex items-start gap-4">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover border-2 border-[#ffffff]"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-[#ff8d49]/20 border-2 border-[#ffffff] flex items-center justify-center text-2xl text-[#2d2a26]">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-[18px] leading-[28px] text-[#2d2a26] truncate">{displayName}</h3>
            <p className="text-[14px] leading-[20px] text-[#6b655e] truncate">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-[#ffffff] border border-[#e8e1da] p-4 hover:bg-[#ff8d49]/5 transition-colors duration-150"
        >
          <p className="text-[24px] leading-[32px] text-[#2d2a26]">{stats?.projectCount ?? '\u2014'}</p>
          <p className="text-[14px] leading-[20px] text-[#6b655e]">
            {(stats?.projectCount ?? 0) === 1 ? 'Project' : 'Projects'}
          </p>
        </Link>
        <Link
          href="/socialthreads"
          className="rounded-lg bg-[#ffffff] border border-[#e8e1da] p-4 hover:bg-[#ff8d49]/5 transition-colors duration-150"
        >
          <p className="text-[24px] leading-[32px] text-[#2d2a26]">{stats?.postCount ?? '\u2014'}</p>
          <p className="text-[14px] leading-[20px] text-[#6b655e]">
            {(stats?.postCount ?? 0) === 1 ? 'Design' : 'Designs'}
          </p>
        </Link>
      </div>

      <div className="rounded-lg bg-[#ffffff] border border-[#e8e1da] divide-y divide-[#e8e1da]">
        <Link
          href="/settings"
          className="flex items-center justify-between p-4 hover:bg-[#ff8d49]/5 transition-colors duration-150"
        >
          <div>
            <p className="text-[16px] leading-[24px] text-[#2d2a26]">All Settings</p>
            <p className="text-[14px] leading-[20px] text-[#6b655e] mt-0.5">Edit profile, billing, and account</p>
          </div>
          <svg
            className="w-4 h-4 text-[#6b655e]"
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
      <div className="absolute inset-0 bg-[#ff8d49]" />

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

      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 4px, white 4px, white 5px)',
        }}
      />

      <div className="absolute inset-0 bg-[#ffffff]/0 group-hover:bg-[#ffffff]/10 transition-colors duration-150" />

      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="relative">
          <div className="absolute inset-0 bg-[#ffffff]/40 rounded-full blur-xl" />
          <div className="relative w-20 h-20 rounded-full bg-[#ffffff]/25 border-2 border-[#ffffff] flex items-center justify-center">
            <img
              src="/icons/quilt-04-scissors-Photoroom.png"
              alt="Design Studio"
              className="w-12 h-12 object-contain brightness-0 invert"
            />
          </div>
        </div>

        <div className="text-center">
          <span className="text-[#ffffff] text-lg tracking-wider uppercase leading-none block">
            Design
          </span>
          <span className="text-[#ffffff]/90 text-base tracking-widest uppercase leading-none block mt-1">
            Studio
          </span>
        </div>
      </div>

      <div className="absolute bottom-3 w-1.5 h-1.5 rounded-full bg-[#ffffff]/70" />
      <div className="absolute bottom-4 right-4 w-1 h-1 rounded-full bg-[#ffffff]/50" />
      <div className="absolute bottom-6 left-6 w-0.5 h-0.5 rounded-full bg-[#ffffff]/40" />
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
        'relative w-full overflow-hidden group',
        position === 'top' ? 'border-b border-[#e8e1da]' : '',
        !active ? 'cursor-pointer' : 'cursor-default',
      ].join(' ')}
      style={{ height }}
    >
      <div
        className={[
          'absolute inset-0 overflow-y-auto overscroll-contain',
          active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
        ].join(' ')}
      >
        {children}
      </div>

      <div
        className={[
          'absolute inset-0',
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

  const isLeftActive = activePanel === 'saved';
  const isRightActive = activePanel === 'feed' || activePanel === 'profile';

  return (
    <>
      <div className="hidden lg:flex h-full w-full overflow-hidden">
        <div
          className="h-full relative flex flex-col border-r border-[#e8e1da] flex-shrink-0"
          style={{ width: isLeftActive ? '90%' : '10%' }}
        >
          <PanelSlot
            active={activePanel === 'saved'}
            groupActive={isLeftActive}
            position="top"
            onClick={() => activate('saved')}
            renderStrip={(o) =>
              o === 'vertical' ? <SavedStripVertical /> : <SavedStripHorizontal />
            }
          >
            <SavedContent />
          </PanelSlot>
        </div>

        <div
          className="h-full relative flex flex-col flex-shrink-0"
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
        <div className="flex shrink-0 border-b border-[#e8e1da] bg-[#fdfaf7]">
          {(['saved', 'feed', 'profile'] as SplitPanelId[]).map((panel) => (
            <button
              key={panel}
              onClick={() => activate(panel)}
              className={`relative flex-1 py-3 text-[16px] leading-[24px] transition-colors capitalize ${
                activePanel === panel ? 'text-[#ff8d49]' : 'text-[#6b655e] hover:text-[#2d2a26]'
              }`}
            >
              {panel === 'feed' ? 'thread' : panel}
              {activePanel === panel && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff8d49]" />
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
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
