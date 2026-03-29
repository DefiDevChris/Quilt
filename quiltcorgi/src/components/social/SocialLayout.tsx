'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, LayoutDashboard, User, Bell, Bookmark, Settings, LifeBuoy } from 'lucide-react';
import Link from 'next/link';

export type SectionId = 'feed' | 'blog' | 'featured' | 'trending';

interface Section {
  id: SectionId;
  label: string;
  subtitle: string;
  href: string;
  slideshowImages: string[];
}

export const SECTIONS: Section[] = [
  {
    id: 'feed',
    label: 'Feed',
    subtitle: 'Explore the latest updates',
    href: '/socialthreads',
    slideshowImages: [
      '/images/quilts/quilt_01_closeup_churndash.png',
      '/images/quilts/quilt_02_closeup_stitches.png',
      '/images/quilts/quilt_03_closeup_scrappy.png',
    ],
  },
  {
    id: 'blog',
    label: 'Blog',
    subtitle: 'Insights and tutorials',
    href: '/blog',
    slideshowImages: [
      '/images/quilts/quilt_01_bed_geometric.png',
      '/images/quilts/quilt_02_bed_hexagon.png',
      '/images/quilts/quilt_03_bed_modern.png',
    ],
  },
  {
    id: 'featured',
    label: 'Featured',
    subtitle: 'Curated collections',
    href: '/socialthreads?section=featured',
    slideshowImages: [
      '/images/quilts/quilt_06_wall_art.png',
      '/images/quilts/quilt_07_ladder_ring.png',
      '/images/quilts/quilt_08_rack_cabin.png',
    ],
  },
  {
    id: 'trending',
    label: 'Trending',
    subtitle: 'What is popular now',
    href: '/socialthreads?section=trending',
    slideshowImages: [
      '/images/quilts/quilt_21_bed_unmade.png',
      '/images/quilts/quilt_22_porch_railing.png',
      '/images/quilts/quilt_23_nursery_floor.png',
    ],
  },
];

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
  children: React.ReactNode;
  activeSection: SectionId;
}

export function SocialLayout({ children, activeSection }: SocialLayoutProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSectionData = SECTIONS.find((s) => s.id === activeSection)!;
  const miniSections = SECTIONS.filter((s) => s.id !== activeSection);

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

      {/* Header - EXACT MATCH TO REFERENCE */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel h-20 grid grid-cols-3 items-center px-6 shadow-sm border-b border-white/60">
        {/* Left Side: Logo, Active Section Info */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="QuiltCorgi" className="h-10 w-auto" />
          </Link>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-slate-300/50 mx-2"></div>

          {/* Active Section Info */}
          <div className="text-left hidden sm:block">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">
              {activeSectionData.label}
            </h1>
            <p className="text-xs text-slate-500 font-medium">{activeSectionData.subtitle}</p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex justify-center">
          <div className="hidden md:flex items-center glass-panel rounded-full px-5 py-2.5 w-64 lg:w-72 shadow-inner border border-white/50 bg-white/40 focus-within:bg-white/70 focus-within:border-orange-300 transition-all">
            <Search size={18} className="text-slate-400 mr-3" />
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Side: Avatar */}
        <div className="flex items-center gap-4 justify-end">
          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-orange-300/50 relative group"
            >
              <img
                src="https://i.pravatar.cc/150?u=quiltcorgi"
                alt="User"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
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
                    icon={<Bookmark size={28} strokeWidth={1.5} />}
                    label="Saved"
                    href="/profile"
                  />
                  <DropdownButton
                    icon={<Settings size={28} strokeWidth={1.5} />}
                    label="Settings"
                    href="/profile"
                  />
                  <DropdownButton
                    icon={<LifeBuoy size={28} strokeWidth={1.5} />}
                    label="Support"
                    href="/tutorials"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout - EXACT MATCH TO REFERENCE */}
      <div className="relative z-10 flex h-screen pt-20">
        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto relative animate-expand pt-4 px-4 lg:px-6">
          <div className="pb-10 max-w-2xl mx-auto">{children}</div>
        </main>

        {/* RIGHT SIDEBAR - EXACT MATCH TO REFERENCE */}
        <aside className="w-72 hidden lg:flex flex-col h-full flex-shrink-0">
          {miniSections.map((section, index) => (
            <Link
              key={section.id}
              href={section.href}
              className="flex-1 relative w-full aspect-square overflow-hidden group"
            >
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute inset-0 w-full h-full group-hover:scale-110 transition-transform duration-700">
                  <div
                    className="absolute inset-0 flex h-full w-full group-hover:[animation-play-state:paused]"
                    style={{
                      animation:
                        index === 0
                          ? 'fade 10s infinite'
                          : index === 1
                            ? 'swipe 7s infinite'
                            : 'scrollLeftFast 5s linear infinite',
                    }}
                  >
                    {[...section.slideshowImages, ...section.slideshowImages].map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={section.label}
                        className="w-full h-full object-cover flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute top-0 left-0 right-0 p-3 z-20 bg-gradient-to-r from-black/60 via-black/30 to-transparent">
                <h5 className="text-white font-bold text-xl">{section.label}</h5>
              </div>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
