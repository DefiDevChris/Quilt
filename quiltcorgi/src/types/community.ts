export type CommunityCategory = 'show-and-tell' | 'wip' | 'help' | 'inspiration' | 'general';

export interface CommunityPost {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  likeCount: number;
  commentCount: number;
  status: 'pending' | 'approved' | 'rejected';
  isFeatured: boolean;
  isPinned: boolean;
  category: CommunityCategory;
  createdAt: Date;
}

export interface CommunityPostListItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  likeCount: number;
  commentCount: number;
  category: CommunityCategory;
  creatorName: string;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  createdAt: Date;
  isLikedByUser: boolean;
  isSavedByUser: boolean;
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
  likeCount: number;
  status: CommentStatus;
  createdAt: Date;
  isLikedByUser: boolean;
  replies?: Comment[];
}

export type BlogPostStatus = 'draft' | 'pending' | 'published' | 'rejected';

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
  status: BlogPostStatus;
  publishedAt: Date | null;
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
  publishedAt: Date | null;
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
  followerCount: number;
  followingCount: number;
  isPro: boolean;
  isFollowedByUser: boolean;
}

export type ReportTargetType = 'post' | 'comment' | 'user';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  createdAt: Date;
}
