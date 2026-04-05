'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

interface Creator {
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface PublicProject {
  id: string;
  name: string;
  description: string | null;
  canvasData: unknown;
  canvasWidth: number;
  canvasHeight: number;
  thumbnailUrl: string | null;
  createdAt: string;
  creator: Creator | null;
}

interface ProjectViewerProps {
  readonly projectId: string;
}

export function ProjectViewer({ projectId }: ProjectViewerProps) {
  const [project, setProject] = useState<PublicProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}/public`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('This design is not available.');
          } else {
            setError('Failed to load design.');
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setProject(data.data);
        }
      } catch {
        if (!cancelled) setError('Failed to load design.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProject();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Render Fabric.js canvas in read-only mode
  useEffect(() => {
    if (!project?.canvasData || !canvasRef.current) return;

    let mounted = true;

    async function renderCanvas() {
      try {
        const fabricModule = await import('fabric');
        if (!mounted || !canvasRef.current) return;

        const canvas = new fabricModule.Canvas(canvasRef.current, {
          width: 800,
          height: 600,
          selection: false,
          interactive: false,
        });

        fabricRef.current = canvas;

        const canvasData = project!.canvasData;
        if (
          canvasData &&
          typeof canvasData === 'object' &&
          'objects' in (canvasData as Record<string, unknown>)
        ) {
          await canvas.loadFromJSON(canvasData);
          canvas.renderAll();

          // Fit to container
          const containerWidth = canvasContainerRef.current?.clientWidth ?? 800;
          const scale = Math.min(containerWidth / canvas.getWidth(), 600 / canvas.getHeight(), 1);
          canvas.setZoom(scale);
          canvas.setDimensions({
            width: canvas.getWidth() * scale,
            height: canvas.getHeight() * scale,
          });
          canvas.renderAll();
        }

        // Disable all interaction
        canvas.getObjects().forEach((obj: unknown) => {
          const fabricObj = obj as { selectable?: boolean; evented?: boolean };
          fabricObj.selectable = false;
          fabricObj.evented = false;
        });
        canvas.renderAll();
      } catch {
        // Canvas rendering failed — user will see thumbnail fallback
      }
    }

    renderCanvas();

    return () => {
      mounted = false;
      if (fabricRef.current) {
        (fabricRef.current as { dispose?: () => void }).dispose?.();
        fabricRef.current = null;
      }
    };
  }, [project]);

  if (loading) {
    return (
      <>
        <PublicNav />
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-container rounded w-64" />
            <div className="h-96 bg-surface-container rounded-xl" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <PublicNav />
        <main className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-container flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-secondary"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">Design Not Available</h1>
          <p className="text-secondary mb-6">
            {error ?? 'This design may have been removed or made private.'}
          </p>
          <Link href="/" className="btn-primary-sm">
            Go Home
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <PublicNav />
      <main className="max-w-4xl mx-auto px-6 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-secondary leading-relaxed">{project.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            {project.creator && (
              <div className="flex items-center gap-2">
                {project.creator.avatarUrl ? (
                  <Image
                    src={project.creator.avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-secondary">
                    {(project.creator.displayName ?? project.creator.username ?? '?')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-secondary">
                  {project.creator.displayName ?? project.creator.username}
                </span>
              </div>
            )}
            <span className="text-xs text-secondary">
              {project.canvasWidth}&Prime; &times; {project.canvasHeight}&Prime;
            </span>
          </div>
        </div>

        {/* Canvas viewer */}
        <div
          ref={canvasContainerRef}
          className="rounded-xl overflow-hidden border border-outline-variant bg-surface-container"
        >
          <canvas ref={canvasRef} />
          {/* Thumbnail fallback (shown while canvas loads) */}
          {project.thumbnailUrl && !fabricRef.current && (
            <div className="w-full aspect-[4/3] relative">
              <Image
                src={project.thumbnailUrl}
                alt={project.name}
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <Link href="/auth/signup" className="btn-primary-xs gap-2">
            Start Designing on QuiltCorgi
          </Link>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Copy Link
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
