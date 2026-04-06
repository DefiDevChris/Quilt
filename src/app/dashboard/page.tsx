'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { formatRelativeTime } from '@/lib/format-time';
import { useAuthStore } from '@/stores/authStore';
import { ProUpgradeModal } from '@/components/billing/ProUpgradeModal';
import { Sparkles } from 'lucide-react';
import { QuickStartWorkflows } from '@/components/dashboard/QuickStartWorkflows';
import { PhotoToDesignPromo } from '@/components/photo-layout/PhotoToLayoutPromo';

const TemplateLibrary = dynamic(
  () => import('@/components/templates/TemplateLibrary').then((m) => m.TemplateLibrary),
  { ssr: false }
);

type DashboardTab = 'my-quilts' | 'templates';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  unitSystem: string;
  isPublic: boolean;
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isPro = useAuthStore((s) => s.isPro);
  const isLoadingAuth = useAuthStore((s) => s.isLoading);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('my-quilts');
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [showPhotoPromo, setShowPhotoPromo] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects?sort=updatedAt&order=desc&limit=50');
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data.data.projects);
      setProjectCount(data.data.projects.length);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && user) {
      fetchProjects();
    }
  }, [isLoadingAuth, user, fetchProjects]);

  const displayName = user?.name?.split(' ')[0] ?? 'there';
  const greeting = getGreeting();

  /* ── Template Library view ────────────────────────────────────────── */
  if (activeTab === 'templates') {
    return (
      <div className="md:-mt-6 md:-mx-6 md:h-[calc(100vh-56px)] md:overflow-hidden flex flex-col">
        <div
          className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0"
          style={{
            borderBottom: '1px solid var(--color-outline-variant)',
            backgroundColor: 'var(--color-surface-container-lowest)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('my-quilts')}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2 py-1 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
            style={{ color: 'var(--color-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-container)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back to Dashboard
          </button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-5">
          <TemplateLibrary />
        </div>
      </div>
    );
  }

  /* ── Main bento grid ─────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto md:pt-10 md:pb-12 relative z-10 w-full transition-all duration-500">
      {/* Greeting and Pro Upgrade Button */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-20">
        <div>
          <p className="text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-2">
            {greeting}
          </p>
          <h1 className="text-on-surface text-4xl font-extrabold tracking-tight">
            Hello, {displayName}
          </h1>
        </div>

        {!isPro && !isLoadingAuth && user && (
          <button
            onClick={() => setShowProUpgrade(true)}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-golden p-[2px] transition-all duration-300 hover:shadow-elevation-3 hover:scale-[1.02]"
          >
            <div className="relative flex items-center gap-3 rounded-[10px] bg-white/90 px-6 py-3 backdrop-blur-sm transition-all group-hover:bg-white/80">
              <Sparkles size={20} className="text-primary-dark" />
              <div className="text-left">
                <p className="text-sm font-extrabold text-on-surface leading-none mb-1">
                  Upgrade to Pro
                </p>
                <p className="text-xs font-medium text-secondary leading-none">
                  Unlock AI & Exports
                </p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Quick Start Workflows */}
      <QuickStartWorkflows
        onPhotoToDesign={() => setShowPhotoPromo(true)}
        onStartFromTemplate={() => setActiveTab('templates')}
        onBlankProject={() => setDialogOpen(true)}
        isPro={isPro}
      />

      <div className="grid grid-cols-12 auto-rows-[minmax(140px,auto)] md:grid-rows-[200px_110px] gap-4 pb-20 relative z-10">
        {/* ── Quiltbook ──────────────────────────────────────────────── */}
        <Link
          href="/projects"
          className="col-span-12 md:col-span-4 rounded-xl p-6 overflow-hidden transition-all duration-200 bg-white/80 backdrop-blur-sm border border-white/60 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(198,123,92,0.1)] flex flex-col justify-between group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-on-surface font-extrabold text-xl">My Quiltbook</p>
              <p className="text-secondary text-sm mt-0.5">
                {projectCount !== null ? `${projectCount} saved designs` : 'Your saved designs'}
              </p>
            </div>
            {/* Open book icon */}
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className="w-11 h-11 text-[#C67B5C] shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
            >
              <path
                d="M6 10C6 10 10 6 24 6C38 6 42 10 42 10V40C42 40 38 36 24 36C10 36 6 40 6 40V10Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <line x1="24" y1="6" x2="24" y2="36" stroke="currentColor" strokeWidth="2" />
              <line
                x1="12"
                y1="16"
                x2="20"
                y2="16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.4"
              />
              <line
                x1="12"
                y1="22"
                x2="18"
                y2="22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.4"
              />
              <line
                x1="28"
                y1="16"
                x2="36"
                y2="16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.4"
              />
              <line
                x1="28"
                y1="22"
                x2="34"
                y2="22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.4"
              />
            </svg>
          </div>
          <div>
            {projects.length > 0 ? (
              <div className="flex gap-2">
                {projects.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="w-12 h-12 rounded-lg bg-white overflow-hidden border border-outline-variant shadow-sm"
                  >
                    {p.thumbnailUrl ? (
                      <Image
                        src={p.thumbnailUrl}
                        alt={p.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#FFF5EE]">
                        <span className="text-[#C67B5C]/50 text-xs font-bold">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-outline-variant"
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-secondary mt-3 font-medium">
              {projects.length > 0
                ? `Last edited ${formatRelativeTime(projects[0].updatedAt)}`
                : 'No projects yet'}
            </p>
          </div>
        </Link>

        {/* ── Browse Templates ────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className="col-span-12 md:col-span-4 rounded-xl p-6 overflow-hidden transition-all duration-200 text-left bg-white/80 backdrop-blur-sm border border-white/60 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(198,123,92,0.1)] group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div />
            {/* Quilt grid icon */}
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className="w-11 h-11 text-[#C67B5C] shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
            >
              <rect
                x="5"
                y="5"
                width="16"
                height="16"
                rx="3"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <rect
                x="27"
                y="5"
                width="16"
                height="16"
                rx="3"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <rect
                x="5"
                y="27"
                width="16"
                height="16"
                rx="3"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <rect
                x="27"
                y="27"
                width="16"
                height="16"
                rx="3"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <polygon points="9,9 17,13 9,17" fill="currentColor" opacity="0.25" />
              <rect
                x="30"
                y="30"
                width="10"
                height="10"
                rx="1"
                fill="currentColor"
                opacity="0.15"
              />
            </svg>
          </div>
          <div className="mt-auto">
            <p className="text-on-surface font-extrabold text-xl">Browse Templates</p>
            <p className="text-secondary text-sm mt-0.5">Explore pre-made designs</p>
          </div>
        </button>

        {/* ── Community Threads ──────────────────────────────────────── */}
        <Link
          href="/socialthreads"
          className="col-span-12 md:col-span-4 rounded-xl p-6 overflow-hidden transition-all duration-200 bg-white/80 backdrop-blur-sm border border-white/60 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(198,123,92,0.1)] group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div />
            {/* Heart hands icon */}
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className="w-11 h-11 text-[#C67B5C] shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
            >
              <path
                d="M24 38C24 38 8 28 8 18C8 10 14 6 20 10C22 11.5 23.5 13.5 24 15C24.5 13.5 26 11.5 28 10C34 6 40 10 40 18C40 28 24 38 24 38Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M16 24L12 32H20L18 40"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.3"
              />
              <path
                d="M32 24L36 32H28L30 40"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.3"
              />
            </svg>
          </div>
          <div className="mt-auto">
            <p className="text-on-surface font-extrabold text-xl">Community Threads</p>
            <p className="text-secondary text-sm mt-0.5">Share blocks &amp; discover</p>
          </div>
        </Link>

        {/* ── Profile ────────────────────────────────────────────────── */}
        <Link
          href="/profile"
          className="col-span-12 md:col-span-6 rounded-xl p-5 transition-all duration-200 bg-white/80 backdrop-blur-sm border border-white/60 hover:bg-white/90 hover:shadow-[0_4px_12px_rgba(198,123,92,0.08)] group flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-on-surface font-extrabold text-xl">My Profile</p>
            <p className="text-secondary text-sm mt-0.5">Manage details and settings</p>
          </div>
          {/* Person icon */}
          <svg
            viewBox="0 0 44 44"
            fill="none"
            className="w-10 h-10 text-[#C67B5C] shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
          >
            <circle cx="22" cy="14" r="8" stroke="currentColor" strokeWidth="2.5" />
            <path
              d="M6 40C6 32 13 26 22 26C31 26 38 32 38 40"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </Link>

        {/* ── Settings ───────────────────────────────────────────────── */}
        <Link
          href="/settings"
          className="col-span-12 md:col-span-6 rounded-xl p-5 transition-all duration-200 bg-white/80 backdrop-blur-sm border border-white/60 hover:bg-white/90 hover:shadow-[0_4px_12px_rgba(198,123,92,0.08)] group flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-on-surface font-extrabold text-xl">System Settings</p>
            <p className="text-secondary text-sm mt-0.5">Units, theme, and defaults</p>
          </div>
          {/* Gear icon */}
          <svg
            viewBox="0 0 44 44"
            fill="none"
            className="w-10 h-10 text-[#C67B5C] shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
          >
            <circle cx="22" cy="22" r="7" stroke="currentColor" strokeWidth="2.5" />
            <path
              d="M22 4V8M22 36V40M4 22H8M36 22H40M9.5 9.5L12.3 12.3M31.7 31.7L34.5 34.5M34.5 9.5L31.7 12.3M12.3 31.7L9.5 34.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </div>

      <NewProjectDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          fetchProjects();
        }}
        onBrowseTemplates={() => setActiveTab('templates')}
      />

      {/* Pro upgrade modal */}
      {showProUpgrade && <ProUpgradeModal onClose={() => setShowProUpgrade(false)} />}

      {/* Photo to Design promo */}
      {showPhotoPromo && (
        <PhotoToDesignPromo isPro={isPro} onClose={() => setShowPhotoPromo(false)} />
      )}
    </div>
  );
}
