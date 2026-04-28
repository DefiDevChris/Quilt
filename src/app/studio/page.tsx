import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/db/schema';
import { getSession } from '@/lib/cognito-session';

export const metadata: Metadata = {
  title: 'Studio | QuiltCorgi',
};

export default async function StudioIndexPage() {
  const session = await getSession();
  if (!session) {
    redirect('/auth/signin?callbackUrl=/studio');
  }

  const [latest] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.updatedAt))
    .limit(1);

  if (latest) {
    redirect(`/studio/${latest.id}`);
  }

  const [newProject] = await db
    .insert(projects)
    .values({
      userId: session.user.id,
      name: 'Untitled Quilt',
      mode: 'layout',
      unitSystem: 'imperial',
      canvasWidth: 48,
      canvasHeight: 48,
      gridSettings: { enabled: true, size: 1, snapToGrid: true },
    })
    .returning({ id: projects.id });

  redirect(`/studio/${newProject.id}`);
}
