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
    <div className="min-h-screen bg-white relative font-sans selection:bg-primary-container selection:text-primary-dark">
      {/* Content */}

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
        <div className="relative z-10 h-screen">
          <SocialSplitPane onPanelChange={setSplitPanel} />
        </div>
      ) : (
        <div className="relative z-10 flex min-h-screen">
          {/* Main Content */}
          <main className="flex-1 relative">
            <div className={contentClassName ?? 'pb-10 max-w-2xl mx-auto'}>{children}</div>
          </main>

          {/* Right Sidebar — static image per section */}
          <aside className="w-72 hidden lg:flex flex-col h-screen flex-shrink-0 sticky top-0">
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
