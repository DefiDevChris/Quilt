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
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-primary-golden/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-[20%] left-[30%] w-[40vw] h-[40vw] bg-white/60 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel h-20 grid grid-cols-3 items-center px-6 border-b border-white/40">
        {/* Left: Logo + Section Info */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="QuiltCorgi" className="h-10 w-auto" />
          </Link>
          <div className="hidden sm:block w-px h-8 bg-tertiary/50 mx-2" />
          <div className="text-left hidden sm:block">
            <h1 className="text-xl font-extrabold text-on-surface tracking-tight leading-tight">
              {splitMode ? SPLIT_HEADERS[splitPanel].label : activeSectionData.label}
            </h1>
            <p className="text-xs text-secondary/80 font-medium">
              {splitMode ? SPLIT_HEADERS[splitPanel].subtitle : activeSectionData.subtitle}
            </p>
          </div>
        </div>

        {/* Center: Section Title (mobile) */}
        <div className="flex justify-center">
          <span className="md:hidden text-sm font-bold text-on-surface">
            {activeSectionData.label}
          </span>
        </div>

        {/* Right: Avatar + Dropdown */}
        <div className="flex items-center gap-4 justify-end">
          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            <button
              onClick={handleAvatarClick}
              className="w-12 h-12 rounded-full border-2 border-white overflow-hidden transition-all focus:outline-none focus:ring-4 focus:ring-primary/30 relative bg-primary-container flex items-center justify-center"
              aria-label={user ? 'Account menu' : 'Sign in'}
            >
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <Image
                  src="/mascots&avatars/corgi1.png"
                  alt="Default Avatar"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              )}
            </button>

            {dropdownOpen && user && (
              <div className="absolute top-16 right-0 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-elevation-4 z-50 border border-white/80 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-outline-variant">
                  <p className="text-sm font-bold text-on-surface truncate">{user.name}</p>
                  <p className="text-xs text-secondary/80 truncate">{user.email}</p>
                </div>

                {/* Links */}
                <div className="py-1">
                  <Link
                    href="/socialthreads"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-primary-container/50 hover:text-primary transition-colors"
                  >
                    Profile
                  </Link>
                </div>

                {/* Sign out */}
                <div className="py-1 border-t border-outline-variant">
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                  >
                    {signingOut ? 'Signing out…' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth gate modal for unauthenticated users */}
      <AuthGateModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Join QuiltCorgi"
        description="Sign up to share your designs and connect with the quilting community."
      />

      {/* Quick-view modal — rendered at root so it overlays everything */}
      <SocialQuickViewModal />

      {/* Main Layout */}
      {splitMode ? (
        <div className="relative z-10 h-screen pt-20">
          <SocialSplitPane onPanelChange={setSplitPanel} />
        </div>
      ) : (
        <div className="relative z-10 flex h-screen pt-20">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto relative animate-expand pt-4 px-4 lg:px-6">
            <div className={contentClassName ?? 'pb-10 max-w-2xl mx-auto'}>{children}</div>
          </main>

          {/* Right Sidebar — static image per section */}
          <aside className="w-72 hidden lg:flex flex-col h-full flex-shrink-0">
            {miniSections.map((section) => (
              <Link
                key={section.id}
                href={section.href}
                className="flex-1 relative w-full overflow-hidden group"
              >
                <img
                  src={section.image}
                  alt={section.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 right-0 p-3 z-10 bg-gradient-to-b from-black/60 to-transparent">
                  <h5 className="text-white font-bold text-xl drop-shadow">{section.label}</h5>
                </div>
              </Link>
            ))}
          </aside>
        </div>
      )}
    </div>
  );
}
