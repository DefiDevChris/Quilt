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
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-rose-400 p-[2px] transition-all duration-300 hover:shadow-elevation-3 hover:scale-[1.02]"
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

      <div className="grid grid-cols-12 auto-rows-[minmax(140px,auto)] md:grid-rows-[200px_200px_110px] gap-4 pb-20 relative z-10">
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
            <Image
              src="/icons/quilt-projects.png"
              alt=""
              width={44}
              height={44}
              className="w-11 h-11 shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
            />
          </div>
          <div>
            {projects.length > 0 ? (
              <div className="flex gap-2">
                {projects.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="w-12 h-12 rounded-lg bg-white overflow-hidden border border-outline-variant shadow-elevation-1"
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
                      <div className="w-full h-full flex items-center justify-center bg-primary-container">
                        <span className="text-warm-terracotta/50 text-xs font-bold">
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

        {/* ── Mobile Uploads ──────────────────────────────────────── */}
        {user && (
          <button
            type="button"
            onClick={() => setActiveTab('mobile-uploads')}
            className="col-span-12 md:col-span-4 rounded-xl p-6 overflow-hidden transition-all duration-200 text-left bg-white/80 backdrop-blur-sm border border-white/60 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(198,123,92,0.1)] group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div />
              <Image
                src="/icons/quilt-mobile-uploads.png"
                alt=""
                width={44}
                height={44}
                className="w-11 h-11 shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
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
          className="col-span-12 md:col-span-4 rounded-xl p-6 overflow-hidden transition-all duration-200 bg-white/80 backdrop-blur-sm border border-white/60 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(198,123,92,0.1)] group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div />
            <Image
              src="/icons/quilt-01-spool-Photoroom.png"
              alt=""
              width={44}
              height={44}
              className="w-11 h-11 shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
            />
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
          <Image
            src="/icons/quilt-profile.png"
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
          />
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
          <Image
            src="/icons/quilt-settings.png"
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
          />
        </Link>
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
