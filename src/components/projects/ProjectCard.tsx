'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  unitSystem: string;
  updatedAt: string;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export function ProjectCard({
  id,
  name,
  thumbnailUrl,
  unitSystem,
  updatedAt,
  onDelete,
  onRename,
}: ProjectCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  function handleRenameSubmit() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== name) {
      onRename(id, trimmed);
    } else {
      setEditName(name);
    }
    setIsRenaming(false);
  }

  const formattedDate = new Date(updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group relative rounded-lg bg-surface-container shadow-elevation-1 hover:shadow-elevation-2 transition-shadow overflow-hidden">
      <button
        type="button"
        onClick={() => router.push(`/studio/${id}`)}
        className="block w-full text-left"
      >
        <div className="aspect-video bg-background flex items-center justify-center overflow-hidden">
          {thumbnailUrl ? (
            <Image src={thumbnailUrl} alt={name} fill className="object-cover" unoptimized />
          ) : (
            <div className="text-secondary text-sm">No preview</div>
          )}
        </div>
      </button>

      <div className="px-3 py-2.5">
        {isRenaming ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setEditName(name);
                setIsRenaming(false);
              }
            }}
            maxLength={255}
            className="w-full text-sm font-medium text-on-surface bg-transparent border-b border-primary outline-none"
          />
        ) : (
          <p className="text-sm font-medium text-on-surface truncate">{name}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-secondary">{formattedDate}</span>
          <span className="text-xs text-secondary bg-surface-container-high rounded px-1.5 py-0.5">
            {unitSystem === 'imperial' ? 'in' : 'cm'}
          </span>
        </div>
      </div>

      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-surface/80 p-1.5 hover:bg-surface shadow-elevation-1"
        >
          <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-10 w-36 rounded-lg bg-surface shadow-elevation-2 py-1">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setIsRenaming(true);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-secondary hover:bg-surface-container"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setShowDeleteConfirm(true);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-error hover:bg-surface-container"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
          <div className="w-full max-w-sm rounded-xl bg-surface shadow-elevation-3 p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-2">Delete Project</h3>
            <p className="text-sm text-secondary mb-6">
              Delete &ldquo;{name}&rdquo;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md px-4 py-2.5 text-sm font-medium text-secondary hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(id);
                }}
                className="rounded-md bg-error px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
