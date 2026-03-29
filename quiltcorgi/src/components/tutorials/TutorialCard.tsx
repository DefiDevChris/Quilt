import Link from 'next/link';
import type { TutorialFrontmatter } from '@/lib/mdx-schemas';

interface TutorialCardProps {
  readonly tutorial: TutorialFrontmatter;
}

export function TutorialCard({ tutorial }: TutorialCardProps) {
  return (
    <Link href={`/tutorials/${tutorial.slug}`} className="group block w-full max-w-4xl mx-auto">
      <div className="relative flex glass-panel rounded-2xl overflow-hidden transition-all duration-300 glass-panel-hover">
        {/* Left accent — compact gradient with decorative quilt grid */}
        <div className="relative w-24 lg:w-32 shrink-0 bg-gradient-to-br from-warm-peach to-warm-golden flex items-center justify-center">
          <div className="w-12 h-12 grid grid-cols-2 gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-sm bg-white/40" />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center p-5 lg:p-6 min-w-0">
          {/* Top row: time */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5 text-warm-text-muted">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-body-sm">{tutorial.estimatedTime}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-headline-sm font-bold text-warm-text group-hover:text-warm-peach transition-colors mb-1.5 line-clamp-1">
            {tutorial.title}
          </h3>

          {/* Description */}
          <p className="text-body-md text-warm-text-secondary line-clamp-2 mb-3">
            {tutorial.description}
          </p>
        </div>

        {/* Arrow indicator */}
        <div className="flex items-center pr-5 lg:pr-6 shrink-0">
          <div className="w-9 h-9 rounded-full bg-warm-peach/10 flex items-center justify-center group-hover:bg-warm-peach transition-all duration-300">
            <svg
              className="w-4 h-4 text-warm-peach group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
