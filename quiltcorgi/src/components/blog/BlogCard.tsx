import Link from 'next/link';
import type { BlogFrontmatter } from '@/lib/mdx-schemas';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface BlogCardProps {
  readonly post: BlogFrontmatter;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block bg-surface-container rounded-lg p-5 hover:bg-surface-container-high transition-colors group"
    >
      <div className="flex items-center gap-2 mb-2 text-xs text-secondary">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        <span aria-hidden="true">&middot;</span>
        <span>{post.author}</span>
      </div>

      <h3 className="text-title-md font-medium text-on-surface group-hover:text-primary transition-colors mb-2">
        {post.title}
      </h3>

      <p className="text-body-sm text-secondary line-clamp-3 mb-3">
        {post.description}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium text-primary bg-primary-container/30 px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
