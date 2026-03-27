import Link from 'next/link';
import type { TutorialFrontmatter } from '@/lib/mdx-schemas';

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

interface TutorialCardProps {
  readonly tutorial: TutorialFrontmatter;
}

export function TutorialCard({ tutorial }: TutorialCardProps) {
  return (
    <Link
      href={`/tutorials/${tutorial.slug}`}
      className="block bg-surface-container rounded-lg p-4 hover:bg-surface-container-high transition-colors group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[tutorial.difficulty]}`}
        >
          {DIFFICULTY_LABELS[tutorial.difficulty]}
        </span>
        <span className="text-xs text-secondary">{tutorial.estimatedTime}</span>
      </div>

      <h3 className="text-title-md font-medium text-on-surface group-hover:text-primary transition-colors mb-1.5">
        {tutorial.title}
      </h3>

      <p className="text-body-sm text-secondary line-clamp-2">
        {tutorial.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {tutorial.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs text-outline-variant bg-surface-container-highest px-1.5 py-0.5 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
