'use client';

import { useState } from 'react';
import { Bookmark, Heart } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { BlogContent } from '@/components/social/BlogContent';
import { FeedContent } from '@/components/social/FeedContent';

export type SplitPanelId = 'blog' | 'saved' | 'feed' | 'profile';

// ── Mock data (development phase) ───────────────────────────────────────────

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

// ── Quilting icons (social palette: slate + orange, stroke-based) ───────────

function FeedPatchworkIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="3" fill="#fb923c" />
      <rect x="22" y="2" width="16" height="16" rx="3" fill="#f97316" opacity="0.55" />
      <rect x="2" y="22" width="16" height="16" rx="3" fill="#f97316" opacity="0.35" />
      <rect x="22" y="22" width="16" height="16" rx="3" fill="#fb923c" opacity="0.75" />
      <path
        d="M10 2L2 10M18 2L2 18M30 2L22 10M38 2L22 18"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.1"
      />
      <path
        d="M10 22L2 30M18 22L2 38M30 22L22 30M38 22L22 38"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.1"
      />
    </svg>
  );
}

function BlogBookIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M5 6h12a3 3 0 013 3v24c0-2-1.5-3.5-3.5-3.5H5V6z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M35 6H23a3 3 0 00-3 3v24c0-2 1.5-3.5 3.5-3.5H35V6z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="8" y="11" width="5" height="5" rx="0.5" fill="#fb923c" opacity="0.6" />
      <rect x="8" y="18" width="5" height="5" rx="0.5" fill="#f97316" opacity="0.35" />
      <rect x="27" y="11" width="5" height="5" rx="0.5" fill="#f97316" opacity="0.35" />
      <rect x="27" y="18" width="5" height="5" rx="0.5" fill="#fb923c" opacity="0.6" />
    </svg>
  );
}

function SavedHeartIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M20 34L6 20c-2.5-3.5-2.5-9 1-11.5s8 .5 13 7c5-6.5 9.5-8 13-5.5s3.5 8 1 11.5L20 34z"
        stroke="#fb923c"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M13 17l4 4m0-4l-4 4"
        stroke="#f97316"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M23 17l4 4m0-4l-4 4"
        stroke="#f97316"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M18 23l4 4m0-4l-4 4"
        stroke="#f97316"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

function ProfileSpoolIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <ellipse cx="20" cy="8" rx="10" ry="4" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <line x1="10" y1="8" x2="10" y2="32" stroke="currentColor" strokeWidth="1.4" />
      <line x1="30" y1="8" x2="30" y2="32" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="20" cy="32" rx="10" ry="4" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M12 14h16M12 20h16M12 26h16" stroke="#fb923c" strokeWidth="0.8" opacity="0.35" />
      <path
        d="M30 15c3-1.5 5-4 4-7"
        stroke="#64748b"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

function StudioScissorsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="7" cy="21" r="4" stroke="white" strokeWidth="1.4" fill="none" />
      <circle cx="21" cy="21" r="4" stroke="white" strokeWidth="1.4" fill="none" />
      <line x1="10" y1="18" x2="22" y2="4" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="18" y1="18" x2="6" y2="4" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Collapsed strips ────────────────────────────────────────────────────────
// glass-panel base, social palette (slate + orange). Vertical ~10vw, Horizontal ~3vw.

function BlogStripVertical() {
  return (
    <div className="absolute inset-0 glass-panel border-0 flex flex-col items-center justify-between py-5 px-3 overflow-hidden transition-all duration-300 group-hover:bg-white/80">
      <BlogBookIcon />
      <div className="text-center">
        <span className="text-slate-800 font-extrabold text-lg tracking-tight block">Blog</span>
        <span className="text-slate-500 text-[10px] font-medium mt-0.5 block">
          Insights & tutorials
        </span>
      </div>
    </div>
  );
}

function BlogStripHorizontal() {
  return (
    <div className="absolute inset-0 glass-panel border-0 flex items-center gap-3 px-5 transition-all duration-300 group-hover:bg-white/80">
      <span className="text-sm font-extrabold text-slate-800 tracking-wide">Blog</span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 40 40"
        fill="none"
        className="ml-auto shrink-0 opacity-60"
      >
        <path
          d="M5 6h12a3 3 0 013 3v24c0-2-1.5-3.5-3.5-3.5H5V6z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M35 6H23a3 3 0 00-3 3v24c0-2 1.5-3.5 3.5-3.5H35V6z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

function SavedStripVertical() {
  return (
    <div className="absolute inset-0 glass-panel border-0 flex flex-col items-center justify-between py-5 px-3 overflow-hidden transition-all duration-300 group-hover:bg-white/80">
      <div className="relative">
        <SavedHeartIcon />
        <span className="absolute -top-1 -right-2 text-[9px] font-bold bg-gradient-to-r from-orange-400 to-rose-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
          {MOCK_SAVED.length}
        </span>
      </div>
      <div className="text-center">
        <span className="text-slate-800 font-extrabold text-lg tracking-tight block">Saved</span>
        <span className="text-slate-500 text-[10px] font-medium mt-0.5 block">Your favorites</span>
      </div>
    </div>
  );
}

function SavedStripHorizontal() {
  return (
    <div className="absolute inset-0 glass-panel border-0 flex items-center gap-3 px-5 transition-all duration-300 group-hover:bg-white/80">
      <Bookmark size={14} className="text-orange-500 shrink-0" />
      <span className="text-sm font-extrabold text-slate-800 tracking-wide">Saved</span>
      <span className="text-[10px] text-slate-500 font-medium">{MOCK_SAVED.length}</span>
    </div>
  );
}

function FeedStripVertical() {
  return (
    <div className="absolute inset-0 glass-panel border-0 flex flex-col items-center justify-between py-5 px-3 overflow-hidden transition-all duration-300 group-hover:bg-white/80">
      <FeedPatchworkIcon />
      <div className="text-center">
        <span className="text-slate-800 font-extrabold text-lg tracking-tight block">Feed</span>
        <span className="text-slate-500 text-[10px] font-medium mt-0.5 block">Latest designs</span>
      </div>
    </div>
  );
}

function FeedStripHorizontal() {
  return (
    <div className="absolute inset-0 glass-panel border-0 flex items-center gap-3 px-5 transition-all duration-300 group-hover:bg-white/80">
      <span className="text-sm font-extrabold text-slate-800 tracking-wide">Feed</span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 40 40"
        fill="none"
        className="ml-auto shrink-0 opacity-60"
      >
        <rect x="2" y="2" width="16" height="16" rx="3" fill="#fb923c" />
        <rect x="22" y="2" width="16" height="16" rx="3" fill="#f97316" opacity="0.55" />
        <rect x="2" y="22" width="16" height="16" rx="3" fill="#f97316" opacity="0.35" />
        <rect x="22" y="22" width="16" height="16" rx="3" fill="#fb923c" opacity="0.75" />
      </svg>
    </div>
  );
}

function ProfileStripVertical() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'Q';

  return (
    <div className="absolute inset-0 glass-panel border-0 flex flex-col items-center justify-between py-5 px-3 overflow-hidden transition-all duration-300 group-hover:bg-white/80">
      {user?.image ? (
        <img
          src={user.image}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
          <span className="text-lg font-bold text-orange-500">{initial}</span>
        </div>
      )}
      <ProfileSpoolIcon />
      <div className="text-center shrink-0">
        <p className="text-sm font-bold text-slate-800 truncate max-w-full px-1">
          {user?.name ?? 'Profile'}
        </p>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
          {user?.email ? user.email.split('@')[0] : 'View account'}
        </p>
      </div>
    </div>
  );
}

function ProfileStripHorizontal() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'Q';

  return (
    <div className="absolute inset-0 glass-panel border-0 flex items-center gap-3 px-5 transition-all duration-300 group-hover:bg-white/80">
      {user?.image ? (
        <img
          src={user.image}
          alt={user.name}
          className="w-7 h-7 rounded-full object-cover border border-white shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center border border-white shrink-0">
          <span className="text-[10px] font-bold text-orange-500">{initial}</span>
        </div>
      )}
      <span className="text-xs font-bold text-slate-800 tracking-wide">
        {user?.name ?? 'Profile'}
      </span>
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

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="glass-panel rounded-[2rem] p-12 flex flex-col items-center text-center max-w-md w-full">
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="h-24 w-24 rounded-full object-cover mb-5 ring-4 ring-white/60 shadow-md"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center mb-5 ring-4 ring-white/60 shadow-md">
            <span className="text-3xl font-bold text-orange-500">{initial}</span>
          </div>
        )}
        <h2 className="font-extrabold text-2xl mb-2 text-slate-800">
          {user?.name ?? 'Your Profile'}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Manage your account, billing, and preferences.
        </p>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-sm hover:shadow-md transition-all"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

// ── Design Studio divider ──────────────────────────────────────────────────

function StudioDivider() {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 shrink-0 w-full aspect-square flex flex-col items-center justify-center gap-2 glass-panel border-0 bg-gradient-to-br from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 transition-all duration-300 cursor-pointer"
    >
      <StudioScissorsIcon />
      <span className="text-[11px] font-bold text-white drop-shadow-sm tracking-tight leading-tight text-center">
        Design
        <br />
        Studio
      </span>
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
      {/* Active content */}
      <div
        className={[
          'absolute inset-0 overflow-y-auto overscroll-contain transition-opacity duration-700',
          active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
        ].join(' ')}
      >
        {children}
      </div>

      {/* Collapsed strip */}
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
      {/* Desktop: 2D accordion */}
      <div className="hidden lg:flex h-full w-full overflow-hidden">
        {/* Left group: Blog + Saved */}
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

        {/* Right group: Feed + Profile */}
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

      {/* Mobile: tab layout */}
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
