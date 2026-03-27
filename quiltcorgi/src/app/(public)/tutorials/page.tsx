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
      <h1 className="text-headline-lg font-bold text-on-surface mb-2">Tutorials</h1>
      <p className="text-body-lg text-secondary mb-8">
        Learn to design quilts with step-by-step guides for every skill level.
      </p>
      <TutorialGrid tutorials={tutorialFrontmatters} />
    </>
  );
}
