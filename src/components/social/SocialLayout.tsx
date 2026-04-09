'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { SocialQuickViewModal } from '@/components/social/SocialQuickViewModal';
import { SocialSplitPane, type SplitPanelId } from '@/components/social/SocialSplitPane';

const SPLIT_HEADERS: Record<SplitPanelId, { label: string; subtitle: string }> = {
  saved: { label: 'Saved', subtitle: 'Your favorite posts' },
  feed: { label: 'Feed', subtitle: 'Explore the latest updates' },
  profile: { label: 'Profile', subtitle: 'Manage your account' },
};

export type SectionId = 'feed' | 'profile';

interface Section {
  id: SectionId;
  label: string;
  subtitle: string;
  href: string;
  image: string;
}

export const SECTIONS: Section[] = [
  {
    id: 'feed',
    label: 'Feed',
    subtitle: 'Explore the latest updates',
    href: '/socialthreads',
    image: '/images/quilts/quilt_01_closeup_churndash.png',
  },
];

const PROFILE_HEADER = {
  label: 'My Profile',
  subtitle: 'Your account and settings',
};

interface SocialLayoutProps {
  children?: React.ReactNode;
  activeSection: SectionId;
  contentClassName?: string;
  splitMode?: boolean;
}

export function SocialLayout({
  children,
  activeSection,
  contentClassName,
  splitMode = false,
}: SocialLayoutProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [splitPanel, setSplitPanel] = useState<SplitPanelId>('feed');

  const isProfile = activeSection === 'profile';
  const activeSectionData = isProfile
    ? PROFILE_HEADER
    : SECTIONS.find((s) => s.id === activeSection)!;
  const miniSections = isProfile ? SECTIONS : SECTIONS.filter((s) => s.id !== activeSection);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      setDropdownOpen((prev) => !prev);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setDropdownOpen(false);
    try {
      await fetch('/api/auth/cognito/signout', { method: 'POST' });
      useAuthStore.getState().reset();
      router.push('/');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden font-sans selection:bg-primary-container selection:text-primary-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center px-12 border-b border-outline-variant/30 bg-white/80 backdrop-blur-2xl">
        {/* Left: Logo + Session Info */}
        <div className="flex items-center gap-10 flex-1">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Quilt Studio" className="h-10 w-auto group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-black text-on-surface tracking-tighter">Quilt Studio</span>
          </Link>
          
          <div className="hidden md:flex flex-col">
            <h1 className="text-sm font-black text-on-surface tracking-widest uppercase">
              {splitMode ? SPLIT_HEADERS[splitPanel].label : activeSectionData.label}
            </h1>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-[0.2em] opacity-60">
              Collective Studio
            </p>
          </div>
        </div>

        {/* Center: Search (optional placeholder for later) */}
        <div className="hidden lg:flex flex-1 justify-center">
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex-1 flex items-center justify-end gap-6">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleAvatarClick}
              className="flex items-center gap-3 p-1 rounded-full hover:bg-surface-container transition-all group"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white shadow-elevation-1 group-hover:shadow-elevation-2 transition-all relative bg-primary-container flex items-center justify-center">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container flex items-center justify-center">
                    <span className="text-xs font-black text-secondary/40">QS</span>
                  </div>
                )}
              </div>
              {user && (
                <div className="hidden sm:block text-left pr-2">
                  <p className="text-xs font-black text-on-surface truncate max-w-[120px]">{user.name}</p>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider opacity-60">Studio Member</p>
                </div>
              )}
            </button>

            {dropdownOpen && user && (
              <div className="absolute top-14 right-0 w-64 glass-elevated rounded-3xl shadow-elevation-4 z-50 py-2 border border-outline-variant/30 overflow-hidden animate-in fade-in slide-in-from-top-4">
                <div className="px-6 py-4 border-b border-outline-variant/30">
                  <p className="text-sm font-black text-on-surface truncate">{user.name}</p>
                  <p className="text-xs text-secondary font-medium truncate">{user.email}</p>
                </div>

                <div className="py-2">
                  <Link
                    href="/socialthreads"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-6 py-3 text-sm font-black text-on-surface hover:bg-surface-container transition-colors uppercase tracking-widest text-[11px]"
                  >
                    Personal Portfolio
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-6 py-3 text-sm font-black text-on-surface hover:bg-surface-container transition-colors uppercase tracking-widest text-[11px]"
                  >
                    Studio Settings
                  </Link>
                </div>

                <div className="py-2 border-t border-outline-variant/30">
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full text-left px-6 py-3 text-[11px] font-black uppercase tracking-widest text-error hover:bg-error/5 transition-colors disabled:opacity-50"
                  >
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      {splitMode ? (
        <div className="relative z-10 h-screen pt-20">
          <SocialSplitPane onPanelChange={setSplitPanel} />
        </div>
      ) : (
        <div className="relative z-10 flex h-screen pt-20">
          {/* Sidebar */}
          <aside className="w-80 hidden lg:flex flex-col h-full border-r border-outline-variant/30 bg-white/50">
            <div className="p-8 space-y-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/60">Directory</p>
                <nav className="space-y-1">
                  {SECTIONS.map((section) => (
                    <Link
                      key={section.id}
                      href={section.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        activeSection === section.id 
                          ? 'bg-on-surface text-surface shadow-elevation-2' 
                          : 'text-secondary hover:bg-surface-container'
                      }`}
                    >
                      {section.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="space-y-6">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/60">Featured Studio</p>
                 <div className="aspect-[4/5] rounded-3xl overflow-hidden relative group cursor-pointer shadow-elevation-2">
                    <img 
                      src="/images/quilts/quilt_01_closeup_churndash.png" 
                      alt="Featured Work" 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-black/60 backdrop-blur-md">
                      <p className="text-white text-xs font-black uppercase tracking-widest mb-1">Archive #042</p>
                      <h5 className="text-white font-black text-lg leading-tight uppercase">Classic Churndash</h5>
                    </div>
                 </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto relative animate-expand bg-surface-container/10">
            <div className={contentClassName ?? 'py-12 px-6 lg:px-12 max-w-4xl mx-auto'}>{children}</div>
          </main>
        </div>
      )}
    </div>
  );
}
