'use client';

import { useState, useCallback, useRef } from 'react';
import { TiptapRenderer } from '@/components/editor/TiptapRenderer';

interface TiptapDoc {
  readonly type: 'doc';
  readonly content: readonly TiptapNode[];
}

interface TiptapNode {
  readonly type: string;
  readonly content?: readonly TiptapNode[];
  readonly text?: string;
  readonly marks?: readonly TiptapMark[];
  readonly attrs?: Record<string, unknown>;
}

interface TiptapMark {
  readonly type: string;
  readonly attrs?: Record<string, unknown>;
}

function textToTiptapDoc(text: string): TiptapDoc {
  const lines = text.split('\n');
  const content: TiptapNode[] = [];

  for (const line of lines) {
    if (line.trim() === '') {
      content.push({ type: 'paragraph', content: [] });
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1]!.length;
      content.push({
        type: 'heading',
        attrs: { level },
        content: parseInlineMarks(headingMatch[2]!),
      });
      continue;
    }

    if (line.startsWith('> ')) {
      content.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: parseInlineMarks(line.slice(2)),
          },
        ],
      });
      continue;
    }

    content.push({
      type: 'paragraph',
      content: parseInlineMarks(line),
    });
  }

  return { type: 'doc', content };
}

function parseInlineMarks(text: string): TiptapNode[] {
  const nodes: TiptapNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      nodes.push({
        type: 'text',
        text: boldMatch[1],
        marks: [{ type: 'bold' }],
      });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      nodes.push({
        type: 'text',
        text: italicMatch[1],
        marks: [{ type: 'italic' }],
      });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
    if (linkMatch) {
      nodes.push({
        type: 'text',
        text: linkMatch[1],
        marks: [{ type: 'link', attrs: { href: linkMatch[2] } }],
      });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    const codeMatch = remaining.match(/^`(.+?)`/);
    if (codeMatch) {
      nodes.push({
        type: 'text',
        text: codeMatch[1],
        marks: [{ type: 'code' }],
      });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Plain text — consume until the next potential marker or end
    const nextMarker = remaining.slice(1).search(/\*\*|\*|`|\[/);
    if (nextMarker === -1) {
      nodes.push({ type: 'text', text: remaining });
      break;
    }

    const plainEnd = nextMarker + 1;
    nodes.push({ type: 'text', text: remaining.slice(0, plainEnd) });
    remaining = remaining.slice(plainEnd);
  }

  return nodes;
}

function tiptapDocToText(doc: TiptapDoc): string {
  const lines: string[] = [];

  for (const node of doc.content) {
    switch (node.type) {
      case 'heading': {
        const level = (node.attrs?.level as number) ?? 2;
        const prefix = '#'.repeat(level);
        const text = nodeToPlainText(node);
        lines.push(`${prefix} ${text}`);
        break;
      }
      case 'blockquote': {
        const text = nodeToPlainText(node);
        lines.push(`> ${text}`);
        break;
      }
      case 'paragraph': {
        const text = nodeToPlainText(node);
        lines.push(text);
        break;
      }
      default: {
        const text = nodeToPlainText(node);
        lines.push(text);
        break;
      }
    }
  }

  return lines.join('\n');
}

function nodeToPlainText(node: TiptapNode): string {
  if (node.type === 'text') {
    let text = node.text ?? '';
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `**${text}**`;
            break;
          case 'italic':
            text = `*${text}*`;
            break;
          case 'code':
            text = `\`${text}\``;
            break;
          case 'link': {
            const href = (mark.attrs?.href as string) ?? '';
            text = `[${text}](${href})`;
            break;
          }
        }
      }
    }
    return text;
  }

  return (node.content ?? []).map(nodeToPlainText).join('');
}

interface RichTextEditorProps {
  readonly value: TiptapDoc | null;
  readonly onChange: (doc: TiptapDoc) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const textValue = value ? tiptapDocToText(value) : '';

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const doc = textToTiptapDoc(e.target.value);
      onChange(doc);
    },
    [onChange]
  );

  const insertSyntax = useCallback(
    (before: string, after: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textValue.slice(start, end);
      const newText =
        textValue.slice(0, start) + before + selected + after + textValue.slice(end);

      const doc = textToTiptapDoc(newText);
      onChange(doc);

      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos = start + before.length + selected.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [textValue, onChange]
  );

  const toolbarButtons = [
    { label: 'B', title: 'Bold', action: () => insertSyntax('**', '**') },
    { label: 'I', title: 'Italic', action: () => insertSyntax('*', '*') },
    { label: 'H2', title: 'Heading 2', action: () => insertSyntax('## ', '') },
    { label: 'H3', title: 'Heading 3', action: () => insertSyntax('### ', '') },
    { label: '""', title: 'Blockquote', action: () => insertSyntax('> ', '') },
    { label: '<>', title: 'Code', action: () => insertSyntax('`', '`') },
    {
      label: 'Link',
      title: 'Link',
      action: () => insertSyntax('[', '](https://)'),
    },
  ];

  return (
    <div className="border border-outline-variant/30 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-outline-variant/30 bg-surface-container">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.title}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className="px-2 py-1 text-xs font-medium text-on-surface bg-surface rounded hover:bg-surface-container-high transition-colors"
          >
            {btn.label}
          </button>
        ))}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setShowPreview((prev) => !prev)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            showPreview
              ? 'bg-primary text-primary-on'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="p-4 min-h-[300px] bg-surface">
          {value ? (
            <TiptapRenderer content={value} />
          ) : (
            <p className="text-secondary italic">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={textValue}
          onChange={handleTextChange}
          placeholder="Write your blog post content here...

Use markdown-like syntax:
## Heading 2
### Heading 3
**bold** *italic* `code`
> blockquote
[link text](url)"
          className="w-full min-h-[300px] p-4 bg-surface text-on-surface font-mono text-sm resize-y focus:outline-none placeholder:text-secondary/50"
        />
      )}
    </div>
  );
}
