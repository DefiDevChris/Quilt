/**
 * Shared project ownership verification.
 */

import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/db/schema';

/**
 * Verify that a user owns a project. Returns `{ id }` if owned, `null` otherwise.
 */
export async function verifyProjectOwner(
  projectId: string,
  userId: string
): Promise<{ id: string } | null> {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return project ?? null;
}
