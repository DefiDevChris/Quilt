import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { follows } from '@/db/schema/follows';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const followerId = 'placeholder-user-id';

    await db.insert(follows).values({ followerId, followingId: userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const followerId = 'placeholder-user-id';

    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
