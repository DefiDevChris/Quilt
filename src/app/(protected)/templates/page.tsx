import type { Metadata } from 'next';
import { ProjectTemplates } from '@/components/studio/ProjectTemplates';

export const metadata: Metadata = {
  title: 'Project Templates',
  description: 'Manage your saved project templates.',
};

export default function TemplatesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">
          Project Templates
        </h1>
        <p className="text-secondary">
          Save project settings as reusable templates for faster setup.
        </p>
      </div>

      <ProjectTemplates />
    </div>
  );
}
