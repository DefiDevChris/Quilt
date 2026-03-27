import { db } from '@/lib/db';
import { notifications } from '@/db/schema';

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    metadata: params.metadata ?? null,
  });
}
