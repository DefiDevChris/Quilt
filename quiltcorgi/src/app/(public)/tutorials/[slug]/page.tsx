import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getTutorialBySlug, getTutorialSlugs, getAllTutorials } from '@/lib/mdx-engine';
import { mdxComponents } from '@/components/ui/MdxComponents';

const DIFFICULTY_STYLES = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-amber-100 text-amber-800',
  advanced: 'bg-red-100 text-red-800',
} as const;

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;

export async function generateStaticParams() {
  const slugs = getTutorialSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) {
    return { title: 'Tutorial Not Found | QuiltCorgi' };
  }

  return {
    title: `${tutorial.title} | QuiltCorgi`,
    description: tutorial.description,
    openGraph: {
      title: tutorial.title,
      description: tutorial.description,
      type: 'article',
    },
  };
}

function getAdjacentTutorials(currentSlug: string) {
  const tutorials = getAllTutorials();
  const currentIndex = tutorials.findIndex((t) => t.slug === currentSlug);
  if (currentIndex === -1) return { prev: null, next: null };

  return {
    prev: currentIndex > 0
      ? { slug: tutorials[currentIndex - 1].slug, title: tutorials[currentIndex - 1].title }
      : null,
    next: currentIndex < tutorials.length - 1
      ? { slug: tutorials[currentIndex + 1].slug, title: tutorials[currentIndex + 1].title }
      : null,
  };
}

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);

  if (!tutorial) {
    notFound();
  }

  const { prev, next } = getAdjacentTutorials(slug);

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: tutorial.title,
    description: tutorial.description,
    totalTime: `PT${tutorial.estimatedTime.replace(/\s/g, '').toUpperCase()}`,
    tool: [
      {
        '@type': 'HowToTool',
        name: 'QuiltCorgi Studio',
      },
    ],
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/tutorials"
          className="text-sm text-secondary hover:text-on-surface transition-colors mb-4 inline-block"
        >
          &larr; All Tutorials
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[tutorial.difficulty]}`}
          >
            {DIFFICULTY_LABELS[tutorial.difficulty]}
          </span>
          <span className="text-sm text-secondary">{tutorial.estimatedTime}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {tutorial.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-outline-variant bg-surface-container px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* MDX Content */}
      <div className="prose-quiltcorgi">
        <MDXRemote source={tutorial.content} components={mdxComponents} />
      </div>

      {/* Try It Now CTA */}
      <div className="mt-12 p-6 bg-primary-container/20 rounded-lg text-center">
        <p className="text-body-lg font-medium text-on-surface mb-3">
          Ready to try it yourself?
        </p>
        <Link
          href="/studio"
          className="inline-block bg-primary text-primary-on text-sm font-medium px-6 py-2.5 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
        >
          Open Studio
        </Link>
      </div>

      {/* Prev/Next Navigation */}
      <nav className="mt-10 flex items-stretch gap-4" aria-label="Tutorial navigation">
        {prev ? (
          <Link
            href={`/tutorials/${prev.slug}`}
            className="flex-1 p-4 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors text-left"
          >
            <span className="text-xs text-secondary block mb-1">&larr; Previous</span>
            <span className="text-sm font-medium text-on-surface">{prev.title}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/tutorials/${next.slug}`}
            className="flex-1 p-4 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors text-right"
          >
            <span className="text-xs text-secondary block mb-1">Next &rarr;</span>
            <span className="text-sm font-medium text-on-surface">{next.title}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </nav>
    </article>
  );
}
