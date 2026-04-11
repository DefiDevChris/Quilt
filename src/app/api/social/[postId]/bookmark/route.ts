import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookmarks } from '@/db/schema/bookmarks';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    // TODO: Get userId from session (Cognito auth)
    // For now, using a placeholder - in production this should come from auth
    const userId = 'placeholder-user-id';

    await db.insert(bookmarks).values({ userId, postId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bookmark error:', error);
    return NextResponse.json({ error: 'Failed to bookmark post' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const userId = 'placeholder-user-id';

    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unbookmark error:', error);
    return NextResponse.json({ error: 'Failed to unbookmark post' }, { status: 500 });
  }
}
