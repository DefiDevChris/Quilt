export type CommentStatus = 'visible' | 'hidden' | 'deleted';

// ============================================================================
// Tiptap Editor Types
// Canonical definitions for Tiptap rich text document structure.
// Used by RichTextEditor, TiptapRenderer, read-time, and blog seed data.
// ============================================================================

export interface TiptapMark {
  readonly type: string;
  readonly attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  readonly type: string;
  readonly attrs?: Record<string, unknown>;
  readonly content?: readonly TiptapNode[];
  readonly marks?: readonly TiptapMark[];
  readonly text?: string;
}

export interface TiptapDocument {
  readonly type: 'doc';
  readonly content?: readonly TiptapNode[];
}

// ============================================================================
// Community & Blog Types
// ============================================================================

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
