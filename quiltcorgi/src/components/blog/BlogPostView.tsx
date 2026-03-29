import Image from 'next/image';
import Link from 'next/link';
import { TiptapRenderer } from '@/components/editor/TiptapRenderer';
import type { BlogPostListItem } from '@/types/community';

interface BlogPostAuthor {
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly bio: string | null;
  readonly username: string | null;
}

interface BlogPostData {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly content: unknown;
  readonly excerpt: string | null;
  readonly featuredImageUrl: string | null;
  readonly category: string;
  readonly tags: string[];
  readonly publishedAt: Date | string | null;
  readonly readTimeMinutes: number;
  readonly author: BlogPostAuthor;
}

interface BlogPostViewProps {
  readonly post: BlogPostData;
  readonly relatedPosts?: readonly BlogPostListItem[];
}

function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogPostView({ post, relatedPosts = [] }: BlogPostViewProps) {
  return (
    <article className="mx-auto max-w-3xl">
      {/* Back Link */}
      <Link
        href="/blog"
        className="text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 inline-block font-medium"
      >
        &larr; Back to Blog
      </Link>

      {/* Featured Image */}
      {post.featuredImageUrl && (
        <div className="rounded-[1.5rem] overflow-hidden mb-8 max-h-[400px]">
          <Image
            src={post.featuredImageUrl}
            alt={post.title}
            width={1200}
            height={400}
            className="w-full h-full object-cover"
            priority
            unoptimized
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        {/* Category */}
        <span className="inline-block bg-gradient-to-r from-orange-400 to-rose-400 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-4 shadow-sm">
          {post.category}
        </span>

        <h1 className="text-4xl font-extrabold text-slate-800 mb-4 leading-tight tracking-tight">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={post.author.name}
              width={32}
              height={32}
              className="rounded-full border-2 border-white shadow-sm"
              unoptimized
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center">
              <span className="text-sm font-bold text-orange-500">
                {post.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-bold text-slate-800">{post.author.name}</span>
          <span aria-hidden="true">&middot;</span>
          {post.publishedAt && (
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
          )}
          <span aria-hidden="true">&middot;</span>
          <span>{post.readTimeMinutes} min read</span>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="mb-12">
        <TiptapRenderer content={post.content} />
      </div>

      {/* Author Bio Card */}
      <div className="border-t border-white/40 pt-8 mb-12">
        <div className="flex items-start gap-4 glass-panel rounded-[1.5rem] p-6">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={post.author.name}
              width={56}
              height={56}
              className="rounded-full border-2 border-white shadow-sm flex-shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-orange-500">
                {post.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Written by</p>
            <p className="font-bold text-slate-800">{post.author.name}</p>
            {post.author.bio && <p className="text-sm text-slate-600 mt-1">{post.author.bio}</p>}
            <Link
              href="/blog"
              className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors mt-2 inline-block"
            >
              View all posts
            </Link>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="border-t border-white/40 pt-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Related Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="block glass-panel rounded-[1.5rem] p-4 hover:bg-white/80 hover:shadow-lg transition-all duration-300 group"
              >
                {related.featuredImageUrl && (
                  <div className="aspect-[16/10] overflow-hidden rounded-xl mb-3">
                    <Image
                      src={related.featuredImageUrl}
                      alt={related.title}
                      width={300}
                      height={169}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-orange-500 transition-colors line-clamp-2">
                  {related.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {related.readTimeMinutes} min read
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back Link */}
      <div className="mt-12 pt-6 border-t border-white/40">
        <Link
          href="/blog"
          className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
        >
          &larr; Back to all posts
        </Link>
      </div>
    </article>
  );
}
