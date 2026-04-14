import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/db/schema';
import { getSession } from '@/lib/cognito-session';

export const metadata: Metadata = {
  title: 'Designer | QuiltCorgi',
};

export default async function DesignerIndexPage() {
  const session = await getSession();
  if (!session) {
    redirect('/auth/signin?callbackUrl=/designer');
  }

  const [latest] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.updatedAt))
    .limit(1);

  if (latest) {
    redirect(`/designer/${latest.id}`);
  }

  // No projects yet — send to dashboard to create one
  redirect('/dashboard');
}
