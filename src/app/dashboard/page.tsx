import { Suspense } from 'react';
import { db } from '@/lib/db';
import { projects } from '@/db/schema/projects';
import { getCognitoSession } from '@/lib/cognito-session';
import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { QuickStartWorkflows } from '@/components/dashboard/QuickStartWorkflows';
import { MobileUploadsPanel } from '@/components/uploads/MobileUploadsPanel';
import type { Project } from '@/types/project';

// Ensures the page is dynamically rendered since it relies on session state
export const dynamic = 'force-dynamic';

function adaptProjectRecord(record: any): Project {
  return {
    id: record.id,
    userId: record.userId,
    name: record.name,
    description: record.description,
    canvasData: record.canvasData || {},
    worktables: record.worktables || [],
    unitSystem: record.unitSystem || 'imperial',
    gridSettings: record.gridSettings || {},
    canvasWidth: record.canvasWidth || 0,
    canvasHeight: record.canvasHeight || 0,
    thumbnailUrl: record.thumbnailUrl || null,
    isPublic: record.isPublic || false,
    lastSavedAt: record.lastSavedAt || new Date(),
    createdAt: record.createdAt || new Date(),
    updatedAt: record.updatedAt || new Date(),
  };
}

export default async function DashboardPage() {
  const session = await getCognitoSession();
  if (!session?.user) redirect('/auth/signin');

  const recentProjectsRecords = await db.query.projects.findMany({
    where: eq(projects.userId, session.user.id),
    orderBy: [desc(projects.updatedAt)],
    limit: 6,
  });

  const recentProjects: Project[] = recentProjectsRecords.map(adaptProjectRecord);

  return (
    <div className="space-y-12 pb-12">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-light text-white mb-2">
          Welcome back, {session.user.name || 'Quilter'}
        </h1>
        <p className="text-white/60">Your digital studio is ready.</p>
      </div>

      {/* Main Workflows */}
      <QuickStartWorkflows recentProjects={recentProjects} />

      {/* Lower Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<div className="h-64 rounded-2xl bg-white/5 animate-pulse" />}>
          <MobileUploadsPanel />
        </Suspense>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Community Activity</h3>
          <div className="flex items-center justify-center h-48 border border-dashed border-white/10 rounded-xl bg-black/20">
            <p className="text-white/40">Social feeds coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
