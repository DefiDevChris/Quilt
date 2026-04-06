'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { X, Image as ImageIcon, Send, Loader2, Link2, Upload } from 'lucide-react';
import NextImage from 'next/image';
import { AuthGateModal } from '@/components/auth/AuthGateModal';

interface Project {
  id: string;
  name: string;
  thumbnailUrl: string | null;
}

interface CreatePostComposerProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreatePostComposer({ onSuccess, onCancel }: CreatePostComposerProps) {
  const user = useAuthStore((s) => s.user);

  const [isExpanded, setIsExpanded] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'text' | 'image' | 'project'>('text');
  const [selectedCategory, setSelectedCategory] = useState<string>('general');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects?limit=50');
      const json = await res.json();
      if (json.data?.projects) {
        setProjects(json.data.projects);
        setShowProjectPicker(true);
      }
    } catch {
      setError('Failed to load projects');
    }
  };

  const handleOpen = async () => {
    if (!user) {
      setAuthGateOpen(true);
      return;
    }
    setIsExpanded(true);
    await fetchProjects();
  };

  const handleClose = () => {
    setIsExpanded(false);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setUploadedImage(null);
    setSelectedProject(null);
    setShowProjectPicker(false);
    setError(null);
    setMode('text');
    setSelectedCategory('general');
    onCancel?.();
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const res = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          purpose: 'community-post',
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError('Pro subscription required for image uploads');
        } else {
          throw new Error(json.error || 'Upload failed');
        }
        return;
      }

      const { uploadUrl, publicUrl } = json.data;

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      setUploadedImage(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please add a title');
      return;
    }

    if (mode === 'image' && !imageUrl.trim() && !uploadedImage) {
      setError('Please add an image');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: selectedCategory,
      };

      if (mode === 'project' && selectedProject) {
        payload.projectId = selectedProject.id;
      } else if (mode === 'image' && (imageUrl || uploadedImage)) {
        payload.imageUrl = uploadedImage || imageUrl;
      }

      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create post');
      }

      setTitle('');
      setDescription('');
      setImageUrl('');
      setUploadedImage(null);
      setSelectedProject(null);
      setIsExpanded(false);
      setMode('text');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <>
        <AuthGateModal
          isOpen={authGateOpen}
          onClose={() => setAuthGateOpen(false)}
          title="Join the community"
          description="Sign up to share your quilt designs and connect with other quilters."
        />
        <button
          data-composer-trigger
          onClick={handleOpen}
          className="w-full glass-panel rounded-2xl p-4 hover:bg-white/80 transition-all text-left"
        >
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary-dark">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
            <span className="flex-1 text-secondary text-sm">Share your latest quilt design...</span>
          </div>
        </button>
      </>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-primary-dark">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>

        <div className="flex-1 space-y-3">
          {/* Mode selector */}
          <div className="flex gap-2">
            {(['text', 'image', 'project'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                  mode === m
                    ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                    : 'bg-white/50 text-secondary hover:bg-white/70 hover:text-on-surface'
                }`}
              >
                {m === 'image' && <ImageIcon size={12} className="inline mr-1" />}
                {m === 'project' && <Link2 size={12} className="inline mr-1" />}
                {m}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-none text-base font-semibold text-on-surface placeholder:text-secondary focus:outline-none"
            autoFocus
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us more..."
            rows={3}
            className="w-full bg-white/40 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 border border-white/60"
          />

          {/* Category selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white/40 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 border border-white/60"
          >
            <option value="general">General</option>
            <option value="show-and-tell">Show &amp; Tell</option>
            <option value="wip">WIP</option>
            <option value="help">Help</option>
            <option value="inspiration">Inspiration</option>
          </select>

          {/* Image mode inputs */}
          {mode === 'image' && (
            <div className="space-y-2">
              {uploadedImage && (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={uploadedImage} alt="Uploaded" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              )}

              {!uploadedImage && (
                <>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste an image URL..."
                    className="w-full bg-white/40 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 border border-white/60"
                  />
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 text-sm font-semibold text-secondary hover:bg-white/70 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      Upload
                    </button>
                    <span className="text-xs text-secondary self-center">or paste URL above</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Selected project preview */}
          {mode === 'project' && selectedProject && (
            <div className="flex items-center gap-2 p-2 bg-white/40 border border-white/60 rounded-xl">
              {selectedProject.thumbnailUrl ? (
                <NextImage
                  src={selectedProject.thumbnailUrl}
                  alt={selectedProject.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-primary-container/30 flex items-center justify-center">
                  <span className="text-sm text-secondary">Q</span>
                </div>
              )}
              <span className="flex-1 text-sm font-medium text-on-surface truncate">
                {selectedProject.name}
              </span>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1 hover:bg-white/50 rounded transition-colors"
              >
                <X size={16} className="text-secondary" />
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex items-center justify-between pt-3 border-t border-white/40">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-sm font-semibold text-secondary hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              {mode === 'project' && (
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setShowProjectPicker(true);
                    fetchProjects();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 text-sm font-semibold text-secondary hover:bg-white/70 transition-colors"
                >
                  <Link2 size={14} />
                  {selectedProject ? 'Change' : 'Attach Project'}
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !title.trim() ||
                  (mode === 'image' && !imageUrl && !uploadedImage) ||
                  (mode === 'project' && !selectedProject)
                }
                className="flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-400 text-white text-sm font-semibold shadow-elevation-1 hover:shadow-elevation-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project picker */}
      {showProjectPicker && mode === 'project' && (
        <div className="mt-4 pt-4 border-t border-white/40">
          <p className="text-sm font-semibold text-secondary mb-2">Select a project to share:</p>
          {projects.length === 0 ? (
            <p className="text-sm text-secondary">No projects found. Create one in the studio!</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project);
                    setShowProjectPicker(false);
                  }}
                  className={`p-2 rounded-xl text-left transition-colors ${
                    selectedProject?.id === project.id
                      ? 'bg-primary-container/50 ring-2 ring-primary'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                >
                  {project.thumbnailUrl ? (
                    <NextImage
                      src={project.thumbnailUrl}
                      alt={project.name}
                      width={80}
                      height={80}
                      className="w-full h-16 rounded object-cover mb-1"
                    />
                  ) : (
                    <div className="w-full h-16 rounded bg-primary-container/20 flex items-center justify-center mb-1">
                      <span className="text-lg text-secondary">Q</span>
                    </div>
                  )}
                  <p className="text-xs font-medium text-on-surface truncate">{project.name}</p>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowProjectPicker(false)}
            className="mt-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
