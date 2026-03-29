import Link from 'next/link';
import Image from 'next/image';
import type { BlogPostListItem } from '@/types/community';

function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface BlogCardProps {
  readonly post: BlogPostListItem;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block bg-surface-container rounded-lg overflow-hidden hover:bg-surface-container-high transition-colors group"
    >
      {/* Featured Image */}
      {post.featuredImageUrl && (
        <div className="aspect-[16/9] overflow-hidden bg-surface-container-high">
          <Image
            src={post.featuredImageUrl}
            alt={post.title}
            width={600}
            height={338}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="p-5">
        {/* Read Time */}
        <div className="flex items-center gap-2 mb-2 text-xs text-secondary">
          <span>{post.readTimeMinutes} min read</span>
        </div>

        {/* Title */}
        <h3 className="text-title-md font-medium text-on-surface group-hover:text-primary transition-colors mb-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-body-sm text-secondary line-clamp-3 mb-3">{post.excerpt}</p>
        )}

        {/* Author & Date */}
        <div className="flex items-center gap-2 text-xs text-secondary">
          {post.authorAvatarUrl ? (
            <Image
              src={post.authorAvatarUrl}
              alt={post.authorName}
              width={20}
              height={20}
              className="rounded-full"
              unoptimized
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-[10px] font-medium text-primary">
                {post.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span>{post.authorName}</span>
          {post.publishedAt && (
            <>
              <span aria-hidden="true">&middot;</span>
              <time dateTime={new Date(post.publishedAt).toISOString()}>
                {formatDate(post.publishedAt)}
              </time>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
