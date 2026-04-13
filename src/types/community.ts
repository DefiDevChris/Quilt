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
