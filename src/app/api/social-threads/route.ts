import { NextResponse } from 'next/server';
import { mockPosts } from '@/lib/mock/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'newest';

  let posts = [...mockPosts];

  if (filter === 'featured') {
    posts = posts.filter(post => post.isFeatured);
  } else {
    // Sort by newest
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { content, image, userId } = body;

  const newPost = {
    id: String(mockPosts.length + 1),
    userId,
    user: mockPosts[0].user, // Default to first user for demo
    content,
    image: image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    comments: [],
    likes: 0,
    createdAt: new Date().toISOString(),
    isFeatured: false,
  };

  mockPosts.unshift(newPost);

  return NextResponse.json({ post: newPost });
}
