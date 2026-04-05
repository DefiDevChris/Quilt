'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  ArrowLeft,
  Scissors,
  ScanLine,
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
import { QuickStartWorkflows } from '@/components/dashboard/QuickStartWorkflows';

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
    <div className="max-w-6xl mx-auto md:pt-16 md:pb-12 px-6 relative z-10 w-full transition-all duration-500">
      {/* Corgi mascots */}
      <Image
        src="/mascots&avatars/corgi2.png"
        alt=""
        width={80}
        height={80}
        className="hidden md:block absolute right-8 pointer-events-none"
        style={{ top: '62px' }}
      />
      <Image
        src="/mascots&avatars/corgi3.png"
        alt=""
        width={80}
        height={80}
        className="hidden md:block absolute bottom-32 -left-16 pointer-events-none"
      />
      <Image
        src="/mascots&avatars/corgi7.png"
        alt=""
        width={80}
        height={80}
        className="hidden md:block absolute bottom-32 -right-16 pointer-events-none"
      />

      {/* Greeting and Pro Upgrade Button */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-20">
        <div>
          <p className="text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-2">
            {greeting}
          </p>
          <h1 className="text-on-surface text-4xl font-extrabold tracking-tight flex items-center gap-3">
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
        onPhotoToPattern={() => (isPro ? openPhotoPattern() : setShowProUpgrade(true))}
        onStartFromTemplate={() => setActiveTab('patterns')}
        onBlankProject={() => setDialogOpen(true)}
        isPro={isPro}
      />

      <div className="grid grid-cols-12 auto-rows-[minmax(140px,auto)] md:grid-rows-[280px_200px_160px] gap-6 pb-20 relative z-10">
        {/* ── 1. Blank Project — col 1-4, row 1 ──────────────────────── */}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="col-span-12 md:col-span-4 rounded-xl p-8 text-left relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-elevation-3 glass-elevated border-white/60 flex flex-col justify-between"
        >
          <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none group-hover:scale-110 group-hover:rotate-[-5deg] transition-all duration-700">
            <Scissors size={180} strokeWidth={1} className="text-primary-dark" />
          </div>
          <div className="relative z-10 mb-auto">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-elevation-3 shadow-primary/30 group-hover:scale-110 transition-all">
              <Plus size={24} className="text-white" strokeWidth={3} />
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-on-surface font-extrabold text-2xl tracking-tight leading-none mb-2">
              Blank Project
            </p>
            <p className="text-secondary text-sm font-medium">
              Start from scratch with a custom grid/layout
            </p>
          </div>
        </button>

        {/* ── 2. Start from Template — col 5-8, row 1 ─────────────────── */}
        <button
          type="button"
          onClick={() => setActiveTab('patterns')}
          className="col-span-12 md:col-span-4 rounded-xl p-8 text-left relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-elevation-3 glass-card border-white/50 flex flex-col justify-between"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none group-hover:rotate-12 group-hover:scale-110 transition-transform duration-1000">
            <LayoutGrid size={240} strokeWidth={1} className="text-on-surface" />
          </div>
          <div className="relative z-10 mb-auto">
            <div className="w-12 h-12 rounded-full glass-inset flex items-center justify-center">
              <LayoutGrid size={22} className="text-secondary" />
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-on-surface font-extrabold text-2xl tracking-tight leading-none mb-2">
              Start from Template
            </p>
            <p className="text-secondary text-sm font-medium">
              Browse the Pattern Library for a pre-made layout
            </p>
          </div>
        </button>

        {/* ── 3. Photo to Pattern — col 9-12, row 1 ─ */}
        <button
          type="button"
          onClick={() => (isPro ? openPhotoPattern() : setShowProUpgrade(true))}
          className="col-span-12 md:col-span-4 rounded-xl p-8 text-left relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-elevation-3 glass-card border-white/50 flex flex-col justify-between"
        >
          {/* Custom Bento Graphic Background (Lucide) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] opacity-15 pointer-events-none group-hover:scale-125 transition-transform duration-700">
            <ScanLine size={180} strokeWidth={1} className="text-primary-dark" />
          </div>

          <div className="relative z-10 mb-auto">
            <span className="inline-block px-3 py-1 bg-primary/20 text-primary-dark text-caption font-extrabold uppercase tracking-widest rounded-full">
              AI Feature
            </span>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-on-surface text-2xl font-extrabold tracking-tight leading-none mb-2">
              Photo to Pattern
            </p>
            <p className="text-secondary text-sm font-medium">
              Upload a photo to automatically detect patterns
            </p>
          </div>
        </button>

        {/* ── 4. Quiltbook — col 1-6, row 2 ───────────────────────── */}
        <Link
          href="/projects"
          className="col-span-12 md:col-span-6 rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-elevation-2 glass-card border-white/40 flex flex-col justify-between group"
        >
          <div className="absolute -bottom-6 right-0 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <BookOpen size={200} strokeWidth={1} className="text-primary-dark" />
          </div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-on-surface font-extrabold text-xl tracking-tight">My Quiltbook</p>
              <p className="text-secondary text-sm mt-1 font-medium">
                {projectCount !== null ? `${projectCount} saved designs` : 'Your saved designs'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full glass-inset flex items-center justify-center flex-shrink-0">
              <BookOpen size={22} className="text-primary-dark" />
            </div>
          </div>

          <div className="relative z-10">
            {projects.length > 0 ? (
              <div className="flex gap-2.5">
                {projects.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="w-14 h-14 rounded-lg bg-surface-container overflow-hidden border border-outline-variant/30 shadow-elevation-1"
                  >
                    {p.thumbnailUrl ? (
                      <Image
                        src={p.thumbnailUrl}
                        alt={p.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                        <span className="text-secondary/50 text-sm font-extrabold">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2.5">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-lg border-2 border-dashed border-outline-variant/50 bg-white/30"
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-secondary/70 mt-4 font-bold tracking-wide">
              {projects.length > 0
                ? `LAST EDITED ${formatRelativeTime(projects[0].updatedAt).toUpperCase()}`
                : 'NO PROJECTS YET'}
            </p>
          </div>
        </Link>

        {/* ── 5. Community — col 7-12, row 2 ───────────────────────── */}
        <Link
          href="/socialthreads"
          className="col-span-12 md:col-span-6 rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-elevation-2 glass-card border-white/40 group flex flex-col justify-between"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <HeartHandshake size={200} strokeWidth={1} className="text-primary-dark" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-full glass-inset flex items-center justify-center">
              <HeartHandshake size={22} className="text-primary-dark" />
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-on-surface font-extrabold text-xl tracking-tight">
              Community Threads
            </p>
            <p className="text-secondary text-sm mt-1 font-medium">Share blocks &amp; discover</p>
          </div>
        </Link>

        {/* ── 6. Profile — col 1-6, row 3 ──────────────────────────── */}
        <Link
          href="/profile"
          className="col-span-12 md:col-span-6 rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-elevation-2 glass-card border-white/40 group flex items-center gap-6"
        >
          <div className="absolute top-[-30%] right-[-10%] opacity-[0.02] pointer-events-none transition-transform duration-1000 group-hover:scale-110">
            <UserCircle size={320} strokeWidth={1} className="text-on-surface" />
          </div>
          <div className="w-16 h-16 rounded-full glass-inset flex items-center justify-center relative z-10 shrink-0">
            <UserCircle size={32} className="text-secondary" />
          </div>
          <div className="relative z-10">
            <p className="text-on-surface font-extrabold text-xl tracking-tight">My Profile</p>
            <p className="text-secondary text-sm mt-1 font-medium">
              Manage details and public settings
            </p>
          </div>
        </Link>

        {/* ── 7. Settings — col 7-12, row 3 ────────────────────────── */}
        <Link
          href="/settings"
          className="col-span-12 md:col-span-6 rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-elevation-2 glass-card border-white/40 group flex items-center gap-6"
        >
          <div className="absolute top-1/2 left-[-15%] -translate-y-1/2 opacity-[0.03] pointer-events-none group-hover:rotate-90 transition-transform duration-1000">
            <Settings size={280} strokeWidth={1} className="text-on-surface" />
          </div>
          <div className="relative z-10 flex items-center gap-6 w-full justify-end">
            <div className="text-right">
              <p className="text-on-surface font-extrabold text-xl tracking-tight">
                System Settings
              </p>
              <p className="text-secondary text-sm mt-1 font-medium">Units, theme, and defaults</p>
            </div>
            <div className="w-16 h-16 rounded-full glass-inset flex items-center justify-center shrink-0">
              <Settings size={32} className="text-secondary" />
            </div>
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
