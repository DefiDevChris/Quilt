import type { Metadata } from 'next';
import { getAllTutorials } from '@/lib/mdx-engine';
import { TutorialGrid } from '@/components/tutorials/TutorialGrid';

export const metadata: Metadata = {
  title: 'Tutorials | QuiltCorgi',
  description:
    'Step-by-step tutorials for designing quilts with QuiltCorgi. Learn block drafting, fabric management, layout types, exporting, and more.',
};

export default function TutorialsPage() {
  const tutorials = getAllTutorials();

  const tutorialFrontmatters = tutorials.map(({ content: _content, ...frontmatter }) => frontmatter);

  return (
    <>
      {/* Hero Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-sm font-semibold">Learning Center</span>
        </div>
        
        <h1 className="text-display-md lg:text-display-lg font-bold text-on-surface mb-4">
          Master Quilt Design
        </h1>
        
        <p className="text-body-lg lg:text-headline-sm text-secondary max-w-2xl mx-auto">
          Step-by-step tutorials to help you create beautiful quilts. 
          From first-time basics to advanced techniques.
        </p>
        
        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-8">
          <div className="text-center">
            <div className="text-headline-md font-bold text-primary">{tutorialFrontmatters.length}</div>
            <div className="text-body-sm text-secondary">Tutorials</div>
          </div>
          <div className="w-px h-10 bg-outline-variant" />
          <div className="text-center">
            <div className="text-headline-md font-bold text-primary">
              {tutorialFrontmatters.filter(t => t.difficulty === 'beginner').length}
            </div>
            <div className="text-body-sm text-secondary">Beginner</div>
          </div>
          <div className="w-px h-10 bg-outline-variant" />
          <div className="text-center">
            <div className="text-headline-md font-bold text-primary">
              {tutorialFrontmatters.filter(t => t.difficulty === 'advanced').length}
            </div>
            <div className="text-body-sm text-secondary">Advanced</div>
          </div>
        </div>
      </div>

      <TutorialGrid tutorials={tutorialFrontmatters} />
    </>
  );
}
