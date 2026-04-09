import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ProjectViewer } from '@/components/projects/ProjectViewer';

interface SharePageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { projectId } = await params;

  const [project] = await db
    .select({
      name: projects.name,
      description: projects.description,
      thumbnailUrl: projects.thumbnailUrl,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.isPublic, true)))
    .limit(1);

  if (!project) {
    return { title: 'Design Not Found' };
  }

  return {
    title: `${project.name} | QuiltCorgi`,
    description: project.description ?? `A quilt design shared on QuiltCorgi`,
    openGraph: {
      title: project.name,
      description: project.description ?? 'A quilt design shared on QuiltCorgi',
      ...(project.thumbnailUrl ? { images: [{ url: project.thumbnailUrl }] } : {}),
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { projectId } = await params;

  const [project] = await db
    .select({ id: projects.id, isPublic: projects.isPublic })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.isPublic, true)))
    .limit(1);

  if (!project) {
    notFound();
  }

  return <ProjectViewer projectId={projectId} />;
}
