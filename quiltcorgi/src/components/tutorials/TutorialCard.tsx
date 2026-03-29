import Link from 'next/link';
import Image from 'next/image';
import type { TutorialFrontmatter } from '@/lib/mdx-schemas';

const DIFFICULTY_STYLES = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-amber-100 text-amber-800 border-amber-200',
  advanced: 'bg-red-100 text-red-800 border-red-200',
} as const;

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;

interface TutorialCardProps {
  readonly tutorial: TutorialFrontmatter;
}

export function TutorialCard({ tutorial }: TutorialCardProps) {
  return (
    <Link
      href={`/tutorials/${tutorial.slug}`}
      className="group block w-full max-w-4xl mx-auto"
    >
      <div
        className="relative flex bg-surface-container rounded-2xl overflow-hidden 
                   hover:bg-surface-container-high transition-all duration-300 
                   hover:shadow-elevation-3 border border-outline-variant/50
                   hover:border-outline-variant"
        style={{ aspectRatio: '3/1.5' }}
      >
        {/* Left side - Image (3/4 height, full width of left section) */}
        <div className="relative w-[55%] h-full overflow-hidden">
          {tutorial.featuredImage ? (
            <Image
              src={tutorial.featuredImage}
              alt={tutorial.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 55vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface-container-high to-surface-container-highest flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <span className="text-body-sm text-secondary">Tutorial Preview</span>
              </div>
            </div>
          )}
          
          {/* Difficulty badge overlay on image */}
          <div className="absolute top-4 left-4">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold 
                         border shadow-sm backdrop-blur-sm bg-white/90
                         ${DIFFICULTY_STYLES[tutorial.difficulty]}`}
            >
              {DIFFICULTY_LABELS[tutorial.difficulty]}
            </span>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="flex-1 flex flex-col justify-center p-6 lg:p-8">
          {/* Time estimate */}
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-warm-peach"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-body-sm text-secondary font-medium">
              {tutorial.estimatedTime}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-headline-sm lg:text-headline-md font-bold text-on-surface 
                         group-hover:text-primary transition-colors mb-3 line-clamp-2">
            {tutorial.title}
          </h3>

          {/* Description */}
          <p className="text-body-md text-secondary line-clamp-3 mb-4">
            {tutorial.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {tutorial.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs text-secondary bg-surface-container-highest 
                          px-2.5 py-1 rounded-full border border-outline-variant/30"
              >
                {tag}
              </span>
            ))}
            {tutorial.tags.length > 4 && (
              <span className="text-xs text-secondary px-2 py-1">
                +{tutorial.tags.length - 4} more
              </span>
            )}
          </div>

          {/* Arrow indicator */}
          <div className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center 
                          group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <svg
                className="w-5 h-5 text-primary group-hover:text-white transition-colors"
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
      </div>
    </Link>
  );
}
