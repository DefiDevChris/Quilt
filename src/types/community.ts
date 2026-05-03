/** Tiptap rich-text node types (no runtime Tiptap dependency). */

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
