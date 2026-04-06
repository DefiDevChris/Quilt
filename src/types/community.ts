export interface CommunityPost {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  likeCount: number;
  commentCount: number;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface CommunityPostListItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  likeCount: number;
  commentCount: number;
  creatorName: string;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  createdAt: Date;
  isLikedByUser: boolean;
}

export type CommentStatus = 'visible' | 'hidden' | 'deleted';

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  content: string;
  replyToId: string | null;
  status: CommentStatus;
  likeCount: number;
  createdAt: Date;
  replies?: Comment[];
}

export interface TiptapNode {
  readonly type: string;
  readonly attrs?: Record<string, unknown>;
  readonly content?: TiptapNode[];
  readonly marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  readonly text?: string;
}

export interface TiptapDocument {
  readonly type: 'doc';
  readonly content?: TiptapNode[];
}

export interface BlogPost {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  content: TiptapDocument | null;
  excerpt: string | null;
  featuredImageUrl: string | null;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  category: string;
  tags: string[];
  authorName: string;
  authorAvatarUrl: string | null;
  createdAt: Date;
  publishedAt: Date;
  readTimeMinutes: number;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  youtubeHandle: string | null;
  tiktokHandle: string | null;
  publicEmail: string | null;
  isPro: boolean;
}
