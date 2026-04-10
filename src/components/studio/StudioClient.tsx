'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/types/project';

import { StudioDialogsProvider } from '@/components/studio/StudioDialogs';
import { StudioLayout } from '@/components/studio/StudioLayout';

import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTempProjectMigration } from '@/hooks/useTempProjectMigration';
import { cleanupExpiredProjects } from '@/lib/temp-project-storage';
import { applyInitialSetup, markSetupModalDismissed } from '@/lib/wizard-hydration';

interface StudioClientProps {
 readonly projectId: string;
}

/**
 * Project loader + shell mounter. All UI lives in StudioLayout; all dialogs
 * live in StudioDialogsProvider. This component just owns the project fetch
 * lifecycle and the loading/error states.
 */
export function StudioClient({ projectId }: StudioClientProps) {
 const [project, setProject] = useState<Project | null>(null);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(true);
 const isPro = useAuthStore((s) => s.isPro);

 // Cleanup expired temp projects on mount
 useEffect(() => {
 cleanupExpiredProjects();
 }, []);

 // Migrate temp project to server when user upgrades to Pro
 useTempProjectMigration();

 useEffect(() => {
 let cancelled = false;

 async function fetchProject() {
 try {
 const res = await fetch(`/api/projects/${projectId}`);
 const data = await res.json();
 if (cancelled) return;

 if (!res.ok) {
 setError(data.error ?? 'Failed to load project');
 return;
 }

 const projectData = data.data as Project;

 // For free users, check if there's a newer temp version in localStorage
 if (!isPro) {
 const { loadTempProject } = await import('@/lib/temp-project-storage');
 const tempData = loadTempProject(projectId);
 if (tempData && tempData.savedAt > new Date(projectData.lastSavedAt).getTime()) {
 projectData.canvasData = tempData.canvasData as Project['canvasData'];
 projectData.unitSystem = tempData.unitSystem as Project['unitSystem'];
 projectData.gridSettings = tempData.gridSettings as unknown as Project['gridSettings'];
 projectData.fabricPresets = tempData.fabricPresets;
 projectData.canvasWidth = tempData.canvasWidth;
 projectData.canvasHeight = tempData.canvasHeight;
 }
 }

 // If the project was created via the New Project wizard, hydrate the
 // layoutStore from canvasData.initialSetup so the canvas paints with
 // the chosen layout/template on first frame, then suppress the legacy
 // first-visit setup modal.
 const layoutSetters = useLayoutStore.getState();
 const hydration = applyInitialSetup(projectData, layoutSetters, {
 setCanvasDimensions: (w, h) => {
 useProjectStore.getState().setCanvasDimensions(w, h);
 },
 });
 if (hydration.hydrated) {
 markSetupModalDismissed(projectData.id);
 }

 setProject(projectData);
 } catch {
 if (!cancelled) setError('Failed to load project');
 } finally {
 if (!cancelled) setLoading(false);
 }
 }

 fetchProject();
 return () => {
 cancelled = true;
 };
 }, [projectId, isPro]);

 if (loading) {
 return (
 <div className="h-screen flex items-center justify-center bg-[#fdfaf7]">
 <div className="text-center">
 <div className="w-8 h-8 border-2 border-[#ff8d49] border-t-transparent rounded-full animation-spinner mx-auto mb-3" />
 <p className="text-sm text-[#6b655e]">Loading your design...</p>
 </div>
 </div>
 );
 }

 if (error || !project) {
 return (
 <div className="h-screen flex items-center justify-center bg-[#fdfaf7]">
 <div className="text-center">
 <p className="text-sm text-[#ffc7c7] mb-4">{error || 'Failed to load project.'}</p>
 <Link
 href="/dashboard"
 className="inline-block rounded-lg bg-[#ff8d49] px-6 py-2 text-[13px] font-semibold text-[#2d2a26] hover:opacity-90 transition-colors duration-150"
 >
 Return to Dashboard
 </Link>
 </div>
 </div>
 );
 }

 return (
 <StudioDialogsProvider>
 <StudioLayout project={project} />
 </StudioDialogsProvider>
 );
}
