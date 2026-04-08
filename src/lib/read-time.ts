import type { TiptapNode, TiptapDocument } from '@/types/community';

/**
 * Extract plain text from Tiptap JSON structure recursively.
 */
function extractTextFromTiptap(node: TiptapNode | TiptapDocument | unknown): string {
  if (!node || typeof node !== 'object') {
    return '';
  }

  const n = node as TiptapNode;

  // If it's a text node, return the text
  if (n.text) {
    return n.text;
  }

  // If it has content, recursively extract text from children
  if (n.content && Array.isArray(n.content)) {
    return n.content.map(extractTextFromTiptap).join(' ');
  }

  return '';
}

/**
 * Count words in a string.
 */
function countWords(text: string): number {
  // Split by whitespace and filter out empty strings
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/**
 * Calculate estimated read time from Tiptap JSON content.
 * Uses 250 words per minute as the average reading speed.
 */
export function calculateReadTime(content: unknown): number {
  // Handle null/undefined
  if (!content) {
    return 1;
  }

  // Handle plain string content
  if (typeof content === 'string') {
    const wordCount = countWords(content);
    return Math.max(1, Math.ceil(wordCount / 250));
  }

  // Handle Tiptap JSON structure
  const text = extractTextFromTiptap(content);
  const wordCount = countWords(text);

  // Minimum 1 minute read time, calculate based on 250 words per minute
  return Math.max(1, Math.ceil(wordCount / 250));
}
