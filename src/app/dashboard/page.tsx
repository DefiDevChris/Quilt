'use client';

import { useEffect, useState, useCallback, useMemo, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { NewProjectWizard } from '@/components/projects/NewProjectWizard';
import { formatRelativeTime } from '@/lib/format-time';
import { useAuthStore } from '@/stores/authStore';
import { ProUpgradeModal } from '@/components/billing/ProUpgradeModal';
import { Sparkles } from 'lucide-react';
import { QuickStartWorkflows } from '@/components/dashboard/QuickStartWorkflows';
import { PhotoToDesignPromo } from '@/components/photo-layout/PhotoToLayoutPromo';
import { useMobileUploadStore } from '@/stores/mobileUploadStore';

const MobileUploadsPanel = dynamic(
  () => import('@/components/uploads/MobileUploadsPanel').then((m) => m.MobileUploadsPanel),
  { ssr: false }
);

type DashboardTab = 'my-quilts' | 'mobile-uploads';

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

function DashboardPageContent() {
  const user = useAuthStore((s) => s.user);
  const isPro = useAuthStore((s) => s.isPro);
  const isLoadingAuth = useAuthStore((s) => s.isLoading);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('my-quilts');
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const uploads = useMobileUploadStore((s) => s.uploads);
  const pendingUploads = useMemo(() => uploads.filter((u) => u.status === 'pending'), [uploads]);
  const fetchMobileUploads = useMobileUploadStore((s) => s.fetchUploads);
  const searchParams = useSearchParams();
  const action = searchParams?.get('action') ?? '';
  const preloadUrl = searchParams?.get('preloadUrl') ?? '';
  const _uploadId = searchParams?.get('uploadId') ?? '';

  // Auto-open Photo to Design promo when redirected from mobile uploads
  const [showPhotoPromo, setShowPhotoPromo] = useState<boolean>(
    () => !!(action === 'photo-to-design' && preloadUrl)
  );

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
      setTimeout(() => {
        fetchProjects();
        fetchMobileUploads('pending');
      }, 0);
    }
  }, [isLoadingAuth, user, fetchProjects, fetchMobileUploads]);

  const displayName = user?.name?.split(' ')[0] ?? 'there';
  const greeting = getGreeting();

  /* ── Mobile Uploads view ─────────────────────────────────────────── */
  if (activeTab === 'mobile-uploads') {
    return (
      <div className="md:-mt-6 md:-mx-6 md:h-[calc(100vh-56px)] md:overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0 border-b border-outline-variant bg-surface-container-lowest">
          <button
            type="button"
            onClick={() => setActiveTab('my-quilts')}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2 py-1 rounded-[var(--radius-sm)] transition-colors cursor-pointer text-secondary hover:bg-surface-container"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back to Dashboard
          </button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-5">
          <MobileUploadsPanel />
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
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-dark p-[2px] transition-all duration-300 hover:shadow-elevation-3 hover:scale-[1.02]"
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
        onNewProject={() => setDialogOpen(true)}
        recentProjects={projects.slice(0, 6).map((p) => ({
          id: p.id,
          name: p.name,
          updatedAt: p.updatedAt,
        }))}
      />

      <div className="grid grid-cols-12 gap-5 pb-20 relative z-10">
        {/* ── Quiltbook ──────────────────────────────────────────────── */}
        <Link
          href="/projects"
          className="col-span-12 md:col-span-4 rounded-2xl p-6 overflow-hidden transition-all duration-300 glass-panel hover:shadow-elevation-2 hover:scale-[1.01] flex flex-col justify-between group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-on-surface font-extrabold text-xl">My Quiltbook</p>
              <p className="text-secondary text-sm mt-0.5">
                {projectCount !== null ? `${projectCount} saved designs` : 'Your saved designs'}
              </p>
            </div>
            <Image
              src="/icons/quilt-projects.png"
              alt=""
              width={80}
              height={80}
              className="w-20 h-20 shrink-0 opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
            />
          </div>
          <div>
            <p className="text-xs text-secondary mt-3 font-medium">
              {projects.length > 0
                ? `Last edited ${formatRelativeTime(projects[0].updatedAt)}`
                : 'No projects yet'}
            </p>
          </div>
        </Link>

        {/* ── Mobile Uploads ──────────────────────────────────────── */}
        {user && (
          <button
            type="button"
            onClick={() => setActiveTab('mobile-uploads')}
            className="col-span-12 md:col-span-4 rounded-2xl p-6 overflow-hidden transition-all duration-300 text-left glass-panel hover:shadow-elevation-2 hover:scale-[1.01] group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div />
              <Image
                src="/icons/quilt-mobile-uploads.png"
                alt=""
                width={80}
                height={80}
                className="w-20 h-20 shrink-0 opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
              />
            </div>
            <div className="mt-auto">
              <p className="text-on-surface font-extrabold text-xl">Mobile Uploads</p>
              <p className="text-secondary text-sm mt-0.5">
                {pendingUploads.length > 0
                  ? `${pendingUploads.length} photo${pendingUploads.length !== 1 ? 's' : ''} waiting`
                  : 'Photos from your phone'}
              </p>
            </div>
          </button>
        )}

        {/* ── Community Threads ──────────────────────────────────────── */}
        <Link
          href="/socialthreads"
          className="col-span-12 md:col-span-4 rounded-2xl p-6 overflow-hidden transition-all duration-300 glass-panel hover:shadow-elevation-2 hover:scale-[1.01] group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div />
            <Image
              src="/icons/quilt-01-spool-Photoroom.png"
              alt=""
              width={80}
              height={80}
              className="w-20 h-20 shrink-0 opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
            />
          </div>
          <div className="mt-auto">
            <p className="text-on-surface font-extrabold text-xl">Community Threads</p>
            <p className="text-secondary text-sm mt-0.5">Share blocks &amp; discover</p>
          </div>
        </Link>

        {/* ── Profile ────────────────────────────────────────────────── */}
        <div className="col-span-12 md:col-span-6 group">
          <Link
            href="/profile"
            className="w-full rounded-2xl p-5 transition-all duration-300 glass-panel hover:shadow-elevation-2 hover:scale-[1.01] flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-on-surface font-bold text-lg truncate">My Profile</p>
              <p className="text-secondary text-sm mt-0.5">Manage details and settings</p>
            </div>
            <Image
              src="/icons/quilt-profile.png"
              alt=""
              width={64}
              height={64}
              className="w-16 h-16 shrink-0 opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
            />
          </Link>
          {/* Reflection */}
          <div className="mt-1 -mb-2 mx-2 h-8 bg-gradient-to-b from-primary-container/30 via-primary-container/10 to-transparent rounded-b-2xl blur-md pointer-events-none" />
        </div>

        {/* ── Settings ───────────────────────────────────────────────── */}
        <div className="col-span-12 md:col-span-6 group">
          <Link
            href="/settings"
            className="w-full rounded-2xl p-5 transition-all duration-300 glass-panel hover:shadow-elevation-2 hover:scale-[1.01] flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-on-surface font-bold text-lg truncate">System Settings</p>
              <p className="text-secondary text-sm mt-0.5">Units, theme, and defaults</p>
            </div>
            <Image
              src="/icons/quilt-settings.png"
              alt=""
              width={64}
              height={64}
              className="w-16 h-16 shrink-0 opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
            />
          </Link>
          {/* Reflection */}
          <div className="mt-1 -mb-2 mx-2 h-8 bg-gradient-to-b from-primary-container/30 via-primary-container/10 to-transparent rounded-b-2xl blur-md pointer-events-none" />
        </div>
      </div>

      <NewProjectWizard
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          fetchProjects();
        }}
      />

      {/* Pro upgrade modal */}
      {showProUpgrade && <ProUpgradeModal onClose={() => setShowProUpgrade(false)} />}

      {/* Photo to Design promo */}
      {showPhotoPromo && (
        <PhotoToDesignPromo
          isPro={isPro}
          onClose={() => setShowPhotoPromo(false)}
          preloadedImageUrl={preloadUrl || undefined}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}
