import type { ComponentPropsWithoutRef } from 'react';

function H1(props: ComponentPropsWithoutRef<'h1'>) {
  return (
    <h1
      className="text-headline-lg font-bold text-on-surface mt-8 mb-4"
      {...props}
    />
  );
}

function H2(props: ComponentPropsWithoutRef<'h2'>) {
  return (
    <h2
      className="text-headline-sm font-semibold text-on-surface mt-6 mb-3"
      {...props}
    />
  );
}

function H3(props: ComponentPropsWithoutRef<'h3'>) {
  return (
    <h3
      className="text-title-lg font-medium text-on-surface mt-5 mb-2"
      {...props}
    />
  );
}

function H4(props: ComponentPropsWithoutRef<'h4'>) {
  return (
    <h4
      className="text-title-md font-medium text-on-surface mt-4 mb-2"
      {...props}
    />
  );
}

function Paragraph(props: ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      className="text-body-md text-on-surface leading-relaxed mb-4"
      {...props}
    />
  );
}

function Anchor(props: ComponentPropsWithoutRef<'a'>) {
  return (
    <a
      className="text-primary hover:text-primary-dark underline underline-offset-2 transition-colors"
      {...props}
    />
  );
}

function UnorderedList(props: ComponentPropsWithoutRef<'ul'>) {
  return (
    <ul
      className="list-disc list-inside text-body-md text-on-surface space-y-1.5 mb-4 ml-4"
      {...props}
    />
  );
}

function OrderedList(props: ComponentPropsWithoutRef<'ol'>) {
  return (
    <ol
      className="list-decimal list-inside text-body-md text-on-surface space-y-1.5 mb-4 ml-4"
      {...props}
    />
  );
}

function ListItem(props: ComponentPropsWithoutRef<'li'>) {
  return <li className="text-body-md leading-relaxed" {...props} />;
}

function CodeBlock(props: ComponentPropsWithoutRef<'pre'>) {
  return (
    <pre
      className="bg-surface-container-highest rounded-md p-4 overflow-x-auto mb-4 font-mono text-sm text-on-surface"
      {...props}
    />
  );
}

function InlineCode(props: ComponentPropsWithoutRef<'code'>) {
  const isInPre =
    typeof props.className === 'string' && props.className.includes('language-');
  if (isInPre) {
    return <code {...props} />;
  }
  return (
    <code
      className="bg-surface-container-high rounded px-1.5 py-0.5 font-mono text-sm text-on-surface"
      {...props}
    />
  );
}

function Blockquote(props: ComponentPropsWithoutRef<'blockquote'>) {
  return (
    <blockquote
      className="border-l-4 border-primary/30 bg-primary-container/10 px-4 py-3 rounded-r-md mb-4 text-body-md text-secondary italic"
      {...props}
    />
  );
}

function isSafeImageSrc(src: string): boolean {
  try {
    const url = new URL(src);
    // Only allow HTTPS URLs (not HTTP) for external images
    return url.protocol === 'https:';
  } catch {
    // Allow relative paths and anchors for local images
    return src.startsWith('/') || src.startsWith('#');
  }
}

function Image(props: ComponentPropsWithoutRef<'img'>) {
  const src = typeof props.src === 'string' ? props.src : '#';
  const safeSrc = src && isSafeImageSrc(src) ? src : '#';
  return (
    <img
      className="rounded-lg shadow-elevation-1 max-w-full h-auto my-4"
      loading="lazy"
      {...props}
      src={safeSrc}
    />
  );
}

function HorizontalRule() {
  return <hr className="border-outline-variant/20 my-8" />;
}

function Table(props: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-body-sm text-on-surface" {...props} />
    </div>
  );
}

function TableHead(props: ComponentPropsWithoutRef<'thead'>) {
  return <thead className="bg-surface-container" {...props} />;
}

function TableHeader(props: ComponentPropsWithoutRef<'th'>) {
  return (
    <th
      className="px-3 py-2 text-left font-medium text-secondary text-label-sm uppercase tracking-wider"
      {...props}
    />
  );
}

function TableCell(props: ComponentPropsWithoutRef<'td'>) {
  return (
    <td
      className="px-3 py-2 border-t border-outline-variant/10"
      {...props}
    />
  );
}

export const mdxComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: Paragraph,
  a: Anchor,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  pre: CodeBlock,
  code: InlineCode,
  blockquote: Blockquote,
  img: Image,
  hr: HorizontalRule,
  table: Table,
  thead: TableHead,
  th: TableHeader,
  td: TableCell,
};
