import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getBlogPostBySlug, getBlogSlugs } from '@/lib/mdx-engine';
import { mdxComponents } from '@/components/ui/MdxComponents';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateStaticParams() {
  const slugs = getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return { title: 'Post Not Found | QuiltCorgi' };
  }

  return {
    title: `${post.title} | QuiltCorgi`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: [...post.tags],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    datePublished: post.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'QuiltCorgi',
      url: 'https://quiltcorgi.com',
    },
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/blog"
          className="text-sm text-secondary hover:text-on-surface transition-colors mb-4 inline-block"
        >
          &larr; Back to Blog
        </Link>

        <h1 className="text-headline-lg font-bold text-on-surface mb-3">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-secondary mb-4">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden="true">&middot;</span>
          <span>{post.author}</span>
        </div>

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
      </div>

      {/* MDX Content */}
      <div className="prose-quiltcorgi">
        <MDXRemote source={post.content} components={mdxComponents} />
      </div>

      {/* Back to Blog */}
      <div className="mt-12 pt-6 border-t border-outline-variant/20">
        <Link
          href="/blog"
          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          &larr; Back to all posts
        </Link>
      </div>
    </article>
  );
}
