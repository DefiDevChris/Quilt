'use client';

import { useState, useRef, useCallback } from 'react';
import type { TiptapNode, TiptapDocument as TiptapDoc } from '@/types/community';

// Simple HTML to Tiptap JSON converter (pure function, outside component)
function htmlToTiptapInner(html: string): TiptapDoc {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const nodes: TiptapNode[] = [];

  for (const child of Array.from(doc.body.children)) {
    const node = elementToTiptapNode(child);
    if (node) nodes.push(node);
  }

  return {
    type: 'doc',
    content: nodes.length > 0 ? nodes : [{ type: 'paragraph', content: [] }],
  };
}

function elementToTiptapNode(el: Element): TiptapNode | null {
  const tag = el.tagName.toLowerCase();

  if (tag === '#text') {
    return null;
  }

  // Handle block elements
  let nodeType = 'paragraph';
  let attrs: Record<string, unknown> = {};

  switch (tag) {
    case 'h1':
      nodeType = 'heading';
      attrs = { level: 1 };
      break;
    case 'h2':
      nodeType = 'heading';
      attrs = { level: 2 };
      break;
    case 'h3':
      nodeType = 'heading';
      attrs = { level: 3 };
      break;
    case 'h4':
      nodeType = 'heading';
      attrs = { level: 4 };
      break;
    case 'ul':
      nodeType = 'bulletList';
      break;
    case 'ol':
      nodeType = 'orderedList';
      break;
    case 'li':
      nodeType = 'listItem';
      break;
    case 'blockquote':
      nodeType = 'blockquote';
      break;
    case 'pre':
      nodeType = 'codeBlock';
      break;
    case 'hr':
      return { type: 'horizontalRule' };
    case 'img':
      return {
        type: 'image',
        attrs: {
          src: el.getAttribute('src') || '',
          alt: el.getAttribute('alt') || '',
          align:
            (el.getAttribute('data-align') as 'left' | 'right' | 'center' | 'full') || 'center',
        },
      };
  }

  const children: TiptapNode[] = [];

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text) {
        children.push({ type: 'text', text });
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childNode = elementToTiptapNode(child as Element);
      if (childNode) children.push(childNode);
    }
  }

  if (nodeType === 'paragraph' && children.length === 0) {
    return { type: 'paragraph', content: [] };
  }

  return {
    type: nodeType,
    content: children,
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
  };
}

interface RichTextEditorProps {
  initialContent?: unknown;
  onChange?: (content: unknown) => void;
}

export function RichTextEditor({ initialContent, onChange }: RichTextEditorProps) {
  const [content, setContent] = useState<TiptapDoc>(() => {
    if (initialContent && typeof initialContent === 'object' && 'type' in initialContent) {
      return initialContent as TiptapDoc;
    }
    return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
  });

  const [activeMarks, setActiveMarks] = useState<Set<string>>(new Set());
  const [blockType, setBlockType] = useState<string>('paragraph');
  const [selectedImage, setSelectedImage] = useState<HTMLElement | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const toggleMark = useCallback((markType: string) => {
    setActiveMarks((prev) => {
      const next = new Set(prev);
      if (next.has(markType)) {
        next.delete(markType);
      } else {
        next.add(markType);
      }
      return next;
    });
    editorRef.current?.focus();
  }, []);

  const setBlock = useCallback((type: string) => {
    setBlockType(type);
    editorRef.current?.focus();
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    const html = editorRef.current.innerHTML;
    const doc = htmlToTiptapInner(html);
    setContent(doc);
    onChange?.(doc);
  }, [onChange]);

  const insertImage = useCallback(async () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  }, [execCommand]);

  const insertLink = useCallback(() => {
    const url = prompt('Enter link URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const setImageAlignment = useCallback(
    (align: 'left' | 'right' | 'center' | 'full') => {
      if (!selectedImage && editorRef.current) {
        // If no image selected, try to find the clicked image in the selection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const img =
            range.startContainer.nodeType === Node.ELEMENT_NODE
              ? (range.startContainer as HTMLElement).querySelector('img')
              : range.startContainer.parentElement?.closest('img') || null;
          if (img) {
            setSelectedImage(img as HTMLElement);
          }
        }
      }

      if (selectedImage) {
        selectedImage.setAttribute('data-align', align);
        handleInput();
        setSelectedImage(null);
      } else if (editorRef.current) {
        // Apply to the last inserted image
        const images = editorRef.current.querySelectorAll('img');
        if (images.length > 0) {
          const lastImg = images[images.length - 1];
          lastImg.setAttribute('data-align', align);
          handleInput();
        }
      }
    },
    [selectedImage, handleInput]
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-surface-container-high rounded-lg border border-outline-variant">
        {/* Block types */}
        <select
          value={blockType}
          onChange={(e) => setBlock(e.target.value)}
          className="px-2 py-1 text-sm bg-surface border border-outline-variant rounded text-on-surface"
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Quote</option>
          <option value="codeBlock">Code</option>
        </select>

        <div className="w-px h-6 bg-outline-variant mx-1" />

        {/* Text formatting */}
        <button
          type="button"
          onClick={() => toggleMark('bold')}
          className={`p-1.5 rounded hover:bg-surface-container ${activeMarks.has('bold') ? 'bg-surface-container text-primary' : 'text-secondary'}`}
          title="Bold"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => toggleMark('italic')}
          className={`p-1.5 rounded hover:bg-surface-container ${activeMarks.has('italic') ? 'bg-surface-container text-primary' : 'text-secondary'}`}
          title="Italic"
        >
          <span className="italic">I</span>
        </button>
        <button
          type="button"
          onClick={() => toggleMark('underline')}
          className={`p-1.5 rounded hover:bg-surface-container ${activeMarks.has('underline') ? 'bg-surface-container text-primary' : 'text-secondary'}`}
          title="Underline"
        >
          <span className="underline">U</span>
        </button>
        <button
          type="button"
          onClick={() => toggleMark('strikeThrough')}
          className={`p-1.5 rounded hover:bg-surface-container ${activeMarks.has('strikeThrough') ? 'bg-surface-container text-primary' : 'text-secondary'}`}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </button>

        <div className="w-px h-6 bg-outline-variant mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-surface-container text-secondary"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1.5 rounded hover:bg-surface-container text-secondary"
          title="Numbered List"
        >
          1. List
        </button>

        <div className="w-px h-6 bg-outline-variant mx-1" />

        {/* Insert */}
        <button
          type="button"
          onClick={insertLink}
          className="p-1.5 rounded hover:bg-surface-container text-secondary"
          title="Insert Link"
        >
          🔗 Link
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-1.5 rounded hover:bg-surface-container text-secondary"
          title="Insert Image"
        >
          🖼️ Image
        </button>

        <div className="w-px h-6 bg-outline-variant mx-1" />

        {/* Image Alignment */}
        <button
          type="button"
          onClick={() => setImageAlignment('left')}
          className="p-1.5 rounded hover:bg-surface-container text-secondary"
          title="Float Left"
        >
          ⬅️ Left
        </button>
        <button
          type="button"
          onClick={() => setImageAlignment('center')}
          className="p-1.5 rounded hover:bg-surface-container text-secondary"
          title="Center"
        >
          ↔️ Center
        </button>
        <button
          type="button"
          onClick={() => setImageAlignment('right')}
          className="p-1.5 rounded hover:bg-surface-container text-secondary"
          title="Float Right"
        >
          ➡️ Right
        </button>
        <button
          type="button"
          onClick={() => setImageAlignment('full')}
          className="p-1.5 rounded hover:bg-surface-container text-secondary"
          title="Full Width"
        >
          ⤡ Full
        </button>

        <div className="w-px h-6 bg-outline-variant mx-1" />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => execCommand('undo')}
          className="p-1.5 rounded hover:bg-surface-container text-secondary"
          title="Undo"
        >
          ↩️
        </button>
        <button
          type="button"
          onClick={() => execCommand('redo')}
          className="p-1.5 rounded hover:bg-surface-container text-secondary"
          title="Redo"
        >
          ↪️
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="min-h-[300px] max-h-[600px] overflow-y-auto p-4 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 prose-quilt-studio"
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{
          __html: tiptapToHtml(content),
        }}
      />
    </div>
  );
}

// Escape HTML entities to prevent XSS in rendered content
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate href to block javascript: and data: protocols
function sanitizeHref(href: string): string {
  const trimmed = href.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '#';
  }
  return escapeHtml(href);
}

// Simple Tiptap JSON to HTML converter for display
function tiptapToHtml(doc: TiptapDoc): string {
  if (!doc.content || doc.content.length === 0) {
    return '<p></p>';
  }

  return doc.content.map(nodeToHtml).join('');
}

function nodeToHtml(node: TiptapNode): string {
  if (node.type === 'text') {
    let text = escapeHtml(node.text || '');
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `<strong>${text}</strong>`;
            break;
          case 'italic':
            text = `<em>${text}</em>`;
            break;
          case 'underline':
            text = `<u>${text}</u>`;
            break;
          case 'strike':
            text = `<s>${text}</s>`;
            break;
          case 'link': {
            const href = sanitizeHref((mark.attrs?.href as string) || '#');
            text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            break;
          }
          case 'code':
            text = `<code>${text}</code>`;
            break;
        }
      }
    }
    return text;
  }

  const children = node.content?.map(nodeToHtml).join('') || '';

  switch (node.type) {
    case 'paragraph':
      return `<p>${children}</p>`;
    case 'heading':
      const level = (node.attrs?.level as number) || 2;
      return `<h${level}>${children}</h${level}>`;
    case 'bulletList':
      return `<ul>${children}</ul>`;
    case 'orderedList':
      return `<ol>${children}</ol>`;
    case 'listItem':
      return `<li>${children}</li>`;
    case 'blockquote':
      return `<blockquote>${children}</blockquote>`;
    case 'codeBlock':
      return `<pre><code>${children}</code></pre>`;
    case 'image': {
      const src = escapeHtml((node.attrs?.src as string) || '');
      const alt = escapeHtml((node.attrs?.alt as string) || '');
      const align = escapeHtml((node.attrs?.align as string) || 'center');
      return `<img src="${src}" alt="${alt}" data-align="${align}" />`;
    }
    case 'horizontalRule':
      return `<hr />`;
    default:
      return children;
  }
}
