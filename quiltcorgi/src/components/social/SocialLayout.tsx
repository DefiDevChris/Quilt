'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, User, Bell, Settings, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { SocialQuickViewModal } from '@/components/social/SocialQuickViewModal';
import { SocialSplitPane, type SplitPanelId } from '@/components/social/SocialSplitPane';

const SPLIT_HEADERS: Record<SplitPanelId, { label: string; subtitle: string }> = {
  blog: { label: 'Blog', subtitle: 'Insights and tutorials' },
  saved: { label: 'Saved', subtitle: 'Your favorite posts' },
  feed: { label: 'Feed', subtitle: 'Explore the latest updates' },
  profile: { label: 'Profile', subtitle: 'Manage your account' },
};

export type SectionId = 'feed' | 'blog' | 'profile';

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
  {
    id: 'blog',
    label: 'Blog',
    subtitle: 'Insights and tutorials',
    href: '/blog',
    image: '/images/quilts/quilt_02_bed_hexagon.png',
  },
];

const PROFILE_HEADER = {
  label: 'My Profile',
  subtitle: 'Your account and settings',
};

interface DropdownButtonProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

const DropdownButton = ({ icon, label, href, onClick }: DropdownButtonProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-[1.5rem] bg-white/50 hover:bg-white/90 transition-all duration-300 border border-white/60 hover:border-orange-300 shadow-sm hover:shadow-md hover:-translate-y-1 text-slate-600 hover:text-orange-600 group cursor-pointer">
      <div className="text-slate-500 group-hover:text-orange-500 transition-colors">{icon}</div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <button onClick={onClick}>{content}</button>;
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-[#FDF9F6] relative overflow-hidden font-sans selection:bg-orange-200 selection:text-orange-900">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-rose-200/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-orange-200/50 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-[20%] left-[30%] w-[40vw] h-[40vw] bg-white/60 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel h-20 grid grid-cols-3 items-center px-6 shadow-sm border-b border-white/40">
        {/* Left: Logo + Section Info */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="QuiltCorgi" className="h-10 w-auto" />
          </Link>
          <div className="hidden sm:block w-px h-8 bg-slate-300/50 mx-2" />
          <div className="text-left hidden sm:block">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">
              {splitMode ? SPLIT_HEADERS[splitPanel].label : activeSectionData.label}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {splitMode ? SPLIT_HEADERS[splitPanel].subtitle : activeSectionData.subtitle}
            </p>
          </div>
        </div>

        {/* Center: Section Title (mobile) */}
        <div className="flex justify-center">
          <span className="md:hidden text-sm font-bold text-slate-700">
            {activeSectionData.label}
          </span>
        </div>

        {/* Right: Avatar + Dropdown */}
        <div className="flex items-center gap-4 justify-end">
          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-orange-300/50 relative group bg-orange-100 flex items-center justify-center"
            >
              <span className="text-lg font-bold text-orange-500">Q</span>
            </button>

            {dropdownOpen && (
              <div className="absolute top-16 right-0 w-[340px] glass-panel rounded-[2rem] p-4 shadow-2xl z-50 animate-expand origin-top-right border border-white/80">
                <div className="grid grid-cols-2 gap-3">
                  <DropdownButton
                    icon={<LayoutDashboard size={28} strokeWidth={1.5} />}
                    label="Dashboard"
                    href="/dashboard"
                  />
                  <DropdownButton
                    icon={<User size={28} strokeWidth={1.5} />}
                    label="My Profile"
                    href="/profile"
                  />
                  <DropdownButton
                    icon={<Bell size={28} strokeWidth={1.5} />}
                    label="Notifications"
                    href="/profile"
                  />
                  <DropdownButton
                    icon={<Settings size={28} strokeWidth={1.5} />}
                    label="Settings"
                    href="/profile/billing"
                  />
                  <DropdownButton
                    icon={<LifeBuoy size={28} strokeWidth={1.5} />}
                    label="Support"
                    href="/blog"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

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
