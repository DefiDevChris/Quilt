'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime } from '@/lib/format-time';

interface RecentProject {
  id: string;
  name: string;
  updatedAt: string;
}

interface QuickStartWorkflowsProps {
  onNewProject: () => void;
  recentProjects: ReadonlyArray<RecentProject>;
}

export function QuickStartWorkflows({
  onNewProject,
  recentProjects,
}: QuickStartWorkflowsProps) {
  const [resumeOpen, setResumeOpen] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  // Close resume popover on outside click or Escape
  useEffect(() => {
    if (!resumeOpen) return;
    function handleClick(event: MouseEvent) {
      if (resumeRef.current && !resumeRef.current.contains(event.target as Node)) {
        setResumeOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setResumeOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [resumeOpen]);

  return (
    <section className="mb-8" aria-label="Quick start workflows">
      <h2 className="text-sm font-semibold text-[#2d2a26] mb-4">
        Quick Start
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start New Project */}
        <button
          type="button"
          onClick={onNewProject}
          className="min-h-[140px] rounded-lg p-6 text-left overflow-hidden group cursor-pointer transition-colors duration-150 bg-[#fdfaf7] border border-[#e8e1da] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)] flex items-center justify-between gap-4"
          aria-label="Start a new project"
        >
          <div>
            <p className="text-[#2d2a26] font-semibold text-lg mb-1">Start New Project</p>
            <p className="text-[#6b655e] text-sm">Pick a size and start designing</p>
          </div>
          <Image
            src="/icons/quilt-13-dashed-squares-Photoroom.png"
            alt=""
            width={72}
            height={72}
            className="w-[72px] h-[72px] shrink-0 opacity-80 group-hover:opacity-100 transition-colors duration-150"
          />
        </button>

        {/* Resume */}
        <div className="relative" ref={resumeRef}>
          <button
            type="button"
            onClick={() => setResumeOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={resumeOpen}
            aria-label="Resume a recent project"
            className="w-full min-h-[140px] rounded-lg p-6 text-left overflow-hidden group cursor-pointer transition-colors duration-150 bg-[#fdfaf7] border border-[#e8e1da] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)] flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-[#2d2a26] font-semibold text-lg mb-1">Resume</p>
              <p className="text-[#6b655e] text-sm">
                {recentProjects.length > 0
                  ? `Pick up where you left off (${recentProjects.length})`
                  : 'No projects yet'}
              </p>
            </div>
            <Image
              src="/icons/quilt-12-ruler-Photoroom.png"
              alt=""
              width={72}
              height={72}
              className="w-[72px] h-[72px] shrink-0 opacity-80 group-hover:opacity-100 transition-colors duration-150"
            />
          </button>

          {resumeOpen && (
            <div
              role="listbox"
              className="absolute left-0 right-0 mt-2 z-30 rounded-lg border border-[#e8e1da] bg-[#ffffff] shadow-[0_1px_2px_rgba(45,42,38,0.08)] overflow-hidden"
            >
              {recentProjects.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-[#6b655e]">No projects yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setResumeOpen(false);
                      onNewProject();
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#ff8d49] px-4 py-1.5 text-sm font-medium text-[#2d2a26] hover:bg-[#e67d3f] transition-colors duration-150"
                  >
                    Start your first quilt
                  </button>
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto">
                  {recentProjects.map((project) => (
                    <li key={project.id} className="border-b border-[#e8e1da] last:border-b-0">
                      <Link
                        href={`/studio/${project.id}`}
                        role="option"
                        aria-selected="false"
                        className="flex items-center justify-between px-4 py-3 hover:bg-[#ff8d49]/10 transition-colors duration-150"
                        onClick={() => setResumeOpen(false)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#2d2a26] truncate">
                            {project.name}
                          </p>
                          <p className="text-xs text-[#6b655e] mt-0.5">
                            {formatRelativeTime(project.updatedAt)}
                          </p>
                        </div>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          className="text-[#6b655e] ml-3 shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 3L9 7L5 11"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/projects"
                onClick={() => setResumeOpen(false)}
                className="block px-4 py-2.5 text-center text-sm font-medium text-[#ff8d49] hover:bg-[#ff8d49]/10 border-t border-[#e8e1da]"
              >
                View all in My Quiltbook →
              </Link>
            </div>
          )}
        </div>

        {/* Photo to Design */}
        <Link
          href="/photo-to-design"
          className="min-h-[140px] rounded-lg p-6 text-left overflow-hidden transition-colors duration-150 bg-[#fdfaf7] border border-[#e8e1da] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)] flex items-center justify-between gap-4"
          aria-label="Photo to Design workflow"
        >
          <div>
            <p className="text-[#2d2a26] font-semibold text-lg mb-1">Photo to Design</p>
            <p className="text-[#6b655e] text-sm">Extract blocks with AI</p>
          </div>
          <Image
            src="/icons/quilt-photo-camera.png"
            alt=""
            width={72}
            height={72}
            className="w-[72px] h-[72px] shrink-0 opacity-80 group-hover:opacity-100 transition-colors duration-150"
          />
        </Link>
      </div>
    </section>
  );
}
