'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  ArrowLeft,
  BookOpen,
  LayoutGrid,
  HeartHandshake,
  Settings,
  UserCircle,
} from 'lucide-react';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { formatRelativeTime } from '@/lib/format-time';
import { useAuthStore } from '@/stores/authStore';
import { PhotoPatternModal } from '@/components/photo-pattern/PhotoPatternModal';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { useToast } from '@/components/ui/ToastProvider';
import { ProUpgradeModal } from '@/components/billing/ProUpgradeModal';
import { Sparkles } from 'lucide-react';

const PatternLibrary = dynamic(
  () => import('@/components/patterns/PatternLibrary').then((m) => m.PatternLibrary),
  { ssr: false }
);

type DashboardTab = 'my-quilts' | 'patterns';

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
  const { toast } = useToast();

  const openPhotoPattern = usePhotoPatternStore((s) => s.openModal);
  const photoPatternStep = usePhotoPatternStore((s) => s.step);
  const isPhotoPatternOpen = usePhotoPatternStore((s) => s.isModalOpen);

  useEffect(() => {
    if (photoPatternStep !== 'complete' || !isPhotoPatternOpen) return;

    async function createProjectAndNavigate() {
      try {
        const date = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const { targetWidth, targetHeight } = usePhotoPatternStore.getState();
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Photo Import — ${date}`,
            canvasWidth: targetWidth,
            canvasHeight: targetHeight,
          }),
        });
        if (!res.ok) throw new Error('Failed to create project');
        const data = await res.json();
        window.location.href = `/studio/${data.data.id}`;
      } catch {
        toast({
          type: 'error',
          title: 'Import failed',
          description: 'Could not create a project from your photo. Please try again.',
        });
        usePhotoPatternStore.getState().setStep('dimensions');
      }
    }

    createProjectAndNavigate();
  }, [photoPatternStep, isPhotoPatternOpen, toast]);

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

  /* ── Pattern Library view ────────────────────────────────────────── */
  if (activeTab === 'patterns') {
    return (
      <div className="md:-mt-6 md:-mx-6 md:h-[calc(100vh-56px)] md:overflow-hidden flex flex-col">
        <div className="flex items-center gap-4 px-6 py-3.5 border-b border-white/50 bg-white/40 backdrop-blur-xl flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('my-quilts')}
            className="flex items-center gap-2 text-secondary hover:text-on-surface transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            <span className="text-sm font-semibold">Dashboard</span>
          </button>
          <div className="w-px h-4 bg-outline-variant/60" />
          <h1 className="text-on-surface font-bold text-sm">Pattern Library</h1>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <PatternLibrary />
        </div>
      </div>
    );
  }

  /* ── Main bento grid ─────────────────────────────────────────────── */
  return (
    <div className="max-w-6xl mx-auto px-6 relative z-10 w-full h-[calc(100vh-56px)] flex flex-col justify-center overflow-hidden">
      {/* Greeting */}
      <div className="mb-3 flex flex-col md:flex-row md:items-end justify-between gap-3 relative z-20 flex-shrink-0">
        <div>
          <p className="text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-1">
            {greeting}
          </p>
          <h1 className="text-on-surface text-3xl font-extrabold tracking-tight flex items-center gap-3">
            Hello, {displayName}
            {isPro && (
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary-dark text-xs font-extrabold uppercase tracking-widest rounded-full align-middle">
                PRO
              </span>
            )}
          </h1>
        </div>

        {!isPro && !isLoadingAuth && user && (
          <button
            onClick={() => setShowProUpgrade(true)}
            className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary-golden p-[2px] transition-shadow duration-200 hover:shadow-elevation-2"
          >
            <div className="flex items-center gap-2.5 rounded-[6px] bg-white/90 px-5 py-2.5 backdrop-blur-sm">
              <Sparkles size={18} className="text-primary-dark" />
              <div className="text-left">
                <p className="text-sm font-bold text-on-surface leading-none mb-0.5">
                  Upgrade to Pro
                </p>
                <p className="text-caption font-medium text-secondary leading-none">
                  Unlock AI & Exports
                </p>
              </div>
            </div>
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 auto-rows-min gap-3 relative z-10 flex-1 min-h-0">
        {/* ── 1. Blank Project — wide left ─────────────────────────── */}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="col-span-12 md:col-span-5 rounded-lg p-5 text-left relative overflow-hidden cursor-pointer glass-elevated border-white/60 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-elevation-2"
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <Plus size={20} className="text-white" strokeWidth={3} />
          </div>
          <div>
            <p className="text-on-surface font-bold text-lg leading-tight">Blank Project</p>
            <p className="text-secondary text-body-sm mt-0.5">Start from scratch</p>
          </div>
        </button>

        {/* ── 2. Start from Template — narrow right ───────────────── */}
        <button
          type="button"
          onClick={() => setActiveTab('patterns')}
          className="col-span-12 md:col-span-3 rounded-lg p-5 text-left glass-card border-white/50 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-elevation-2"
        >
          <div className="w-10 h-10 rounded-full glass-inset flex items-center justify-center">
            <LayoutGrid size={18} className="text-secondary" />
          </div>
          <div>
            <p className="text-on-surface font-bold text-base leading-tight">Templates</p>
            <p className="text-secondary text-body-sm mt-0.5">Browse patterns</p>
          </div>
        </button>

        {/* ── 3. Photo to Pattern — medium right ─────────────────── */}
        <button
          type="button"
          onClick={() => (isPro ? openPhotoPattern() : setShowProUpgrade(true))}
          className="col-span-12 md:col-span-4 rounded-lg p-5 text-left glass-card border-white/50 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-elevation-2"
        >
          <span className="inline-block px-2.5 py-0.5 bg-primary/20 text-primary-dark text-caption font-bold uppercase tracking-widest rounded-full w-fit">
            AI
          </span>
          <div>
            <p className="text-on-surface font-bold text-base leading-tight">Photo to Pattern</p>
            <p className="text-secondary text-body-sm mt-0.5">Detect patterns from a photo</p>
          </div>
        </button>

        {/* ── 4. Quiltbook — wider left ──────────────────────────── */}
        <Link
          href="/projects"
          className="col-span-12 md:col-span-7 rounded-lg p-5 glass-card border-white/40 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-elevation-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface font-bold text-base leading-tight">My Quiltbook</p>
              <p className="text-secondary text-body-sm mt-0.5">
                {projectCount !== null ? `${projectCount} saved designs` : 'Your saved designs'}
              </p>
            </div>
            <BookOpen size={20} className="text-secondary" />
          </div>

          {projects.length > 0 ? (
            <div className="flex gap-2">
              {projects.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="w-11 h-11 rounded-md bg-surface-container overflow-hidden border border-outline-variant/30"
                >
                  {p.thumbnailUrl ? (
                    <Image
                      src={p.thumbnailUrl}
                      alt={p.name}
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                      <span className="text-secondary/50 text-body-sm font-bold">
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
                  className="w-11 h-11 rounded-md border-2 border-dashed border-outline-variant/50 bg-white/30"
                />
              ))}
            </div>
          )}
          <p className="text-caption text-secondary/70 font-bold tracking-wide">
            {projects.length > 0
              ? `LAST EDITED ${formatRelativeTime(projects[0].updatedAt).toUpperCase()}`
              : 'NO PROJECTS YET'}
          </p>
        </Link>

        {/* ── 5. Community — narrower right ────────────────────────── */}
        <Link
          href="/socialthreads"
          className="col-span-12 md:col-span-5 rounded-lg p-5 glass-card border-white/40 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-elevation-2"
        >
          <div className="w-10 h-10 rounded-full glass-inset flex items-center justify-center">
            <HeartHandshake size={18} className="text-primary-dark" />
          </div>
          <div>
            <p className="text-on-surface font-bold text-base leading-tight">Community</p>
            <p className="text-secondary text-body-sm mt-0.5">Share blocks &amp; discover</p>
          </div>
        </Link>

        {/* ── 6. Profile — narrow left ─────────────────────────────── */}
        <Link
          href="/profile"
          className="col-span-12 md:col-span-4 rounded-lg px-5 py-4 glass-card border-white/40 flex items-center gap-3 transition-shadow duration-200 hover:shadow-elevation-2"
        >
          <div className="w-10 h-10 rounded-full glass-inset flex items-center justify-center shrink-0">
            <UserCircle size={20} className="text-secondary" />
          </div>
          <div>
            <p className="text-on-surface font-bold text-sm leading-tight">My Profile</p>
            <p className="text-secondary text-body-sm">Public settings</p>
          </div>
        </Link>

        {/* ── 7. Settings — wider right ────────────────────────────── */}
        <Link
          href="/settings"
          className="col-span-12 md:col-span-8 rounded-lg px-5 py-4 glass-card border-white/40 flex items-center gap-3 justify-end text-right transition-shadow duration-200 hover:shadow-elevation-2"
        >
          <div>
            <p className="text-on-surface font-bold text-sm leading-tight">System Settings</p>
            <p className="text-secondary text-body-sm">Units, theme, and defaults</p>
          </div>
          <div className="w-10 h-10 rounded-full glass-inset flex items-center justify-center shrink-0">
            <Settings size={20} className="text-secondary" />
          </div>
        </Link>
      </div>

      <PhotoPatternModal />
      <NewProjectDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          fetchProjects();
        }}
        onBrowsePatterns={() => setActiveTab('patterns')}
      />

      {/* Pro upgrade modal */}
      {showProUpgrade && <ProUpgradeModal onClose={() => setShowProUpgrade(false)} />}
    </div>
  );
}
