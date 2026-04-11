import { NextResponse } from 'next/server';
import { mockPosts } from '@/lib/mock-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = mockPosts.find(p => p.id === id);
  
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  
  return NextResponse.json({ comments: post.comments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { content, userId } = body;
  
  const post = mockPosts.find(p => p.id === id);
  
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  
  const newComment = {
    id: `${id}-comment-${post.comments.length + 1}`,
    userId,
    user: mockPosts[0].user,
    content,
    createdAt: new Date().toISOString(),
    likes: 0,
  };
  
  post.comments.push(newComment);
  
  return NextResponse.json({ comment: newComment });
}
