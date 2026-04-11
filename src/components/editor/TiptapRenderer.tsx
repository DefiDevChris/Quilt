import type { ReactNode } from 'react';
import type { TiptapMark, TiptapNode, TiptapDocument as TiptapDoc } from '@/types/community';

function isSafeHref(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return href.startsWith('/') || href.startsWith('#');
  }
}

function renderMarks(text: string, marks: readonly TiptapMark[]): ReactNode {
  let result: ReactNode = text;

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        result = <strong>{result}</strong>;
        break;
      case 'italic':
        result = <em>{result}</em>;
        break;
      case 'code':
        result = (
          <code className="bg-[#f5f2ef] px-1.5 py-0.5 rounded text-[14px] leading-[20px] font-mono">
            {result}
          </code>
        );
        break;
      case 'link': {
        const rawHref = (mark.attrs?.href as string) ?? '#';
        const href = isSafeHref(rawHref) ? rawHref : '#';
        result = (
          <a
            href={href}
            className="text-primary underline hover:text-primary/80 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {result}
          </a>
        );
        break;
      }
      case 'strike':
        result = <s>{result}</s>;
        break;
      case 'underline':
        result = <u>{result}</u>;
        break;
      default:
        break;
    }
  }

  return result;
}

function renderNode(node: TiptapNode, index: number): ReactNode {
  const key = `${node.type}-${index}`;

  if (node.type === 'text') {
    const text = node.text ?? '';
    if (node.marks && node.marks.length > 0) {
      return <span key={key}>{renderMarks(text, node.marks)}</span>;
    }
    return <span key={key}>{text}</span>;
  }

  const children = node.content?.map((child, i) => renderNode(child, i)) ?? [];

  switch (node.type) {
    case 'paragraph':
      return (
        <p key={key} className="mb-4 text-[#2d2a26] leading-relaxed">
          {children}
        </p>
      );

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 2;
      switch (level) {
        case 1:
          return (
            <h1 key={key} className="text-[40px] leading-[52px] font-bold text-[#2d2a26] mt-8 mb-4">
              {children}
            </h1>
          );
        case 2:
          return (
            <h2 key={key} className="text-[32px] leading-[40px] font-bold text-[#2d2a26] mt-6 mb-3">
              {children}
            </h2>
          );
        case 3:
          return (
            <h3 key={key} className="text-[24px] leading-[32px] font-semibold text-[#2d2a26] mt-5 mb-2">
              {children}
            </h3>
          );
        default:
          return (
            <h4 key={key} className="text-[16px] leading-[24px] font-semibold text-[#2d2a26] mt-4 mb-2">
              {children}
            </h4>
          );
      }
    }

    case 'bulletList':
      return (
        <ul key={key} className="list-disc pl-6 mb-4 space-y-1">
          {children}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={key} className="list-decimal pl-6 mb-4 space-y-1">
          {children}
        </ol>
      );

    case 'listItem':
      return (
        <li key={key} className="text-[#2d2a26]">
          {children}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="border-l-4 border-primary/40 pl-4 py-2 mb-4 text-[#6b655e] italic"
        >
          {children}
        </blockquote>
      );

    case 'codeBlock': {
      const language = (node.attrs?.language as string) ?? '';
      return (
        <pre key={key} className="bg-[#fdfaf7] rounded-lg p-4 mb-4 overflow-x-auto">
          <code className="text-[14px] leading-[20px] font-mono text-[#2d2a26]" data-language={language}>
            {children}
          </code>
        </pre>
      );
    }

    case 'image': {
      const rawSrc = (node.attrs?.src as string) ?? '';
      const alt = (node.attrs?.alt as string) ?? '';
      const align = (node.attrs?.align as string) ?? 'center';
      const src = isSafeHref(rawSrc) ? rawSrc : '#';

      // Alignment classes for staggered media layout
      const alignClasses = {
        left: 'float-left mr-6 mb-4 w-1/2 md:w-1/3 rounded-lg',
        right: 'float-right ml-6 mb-4 w-1/2 md:w-1/3 rounded-lg',
        center: 'mx-auto mb-4 rounded-lg',
        full: 'w-full mb-4 rounded-lg',
      };

      return (
        <figure key={key} className={`mb-4 ${alignClasses[align as keyof typeof alignClasses] || alignClasses.center}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          {alt && (
            <figcaption className="text-[14px] leading-[20px] text-[#6b655e] mt-2 text-center">{alt}</figcaption>
          )}
        </figure>
      );
    }
    case 'horizontalRule':
      return <hr key={key} className="border-[#e8e1da]/30 my-6" />;

    case 'hardBreak':
      return <br key={key} />;

    case 'doc':
      return <div key={key}>{children}</div>;

    default:
      return <div key={key}>{children}</div>;
  }
}

interface TiptapRendererProps {
  readonly content: unknown;
}

export function TiptapRenderer({ content }: TiptapRendererProps) {
  if (!content || typeof content !== 'object') {
    return null;
  }

  const doc = content as TiptapDoc;

  if (doc.type !== 'doc' || !doc.content) {
    // Handle simple text-only content
    if ('text' in doc && typeof (doc as { text?: string }).text === 'string') {
      return (
        <p className="mb-4 text-[#2d2a26] leading-relaxed">{(doc as { text: string }).text}</p>
      );
    }
    return null;
  }

  return (
    <div className="prose-quilt-studio">{doc.content.map((node, i) => renderNode(node, i))}</div>
  );
}
