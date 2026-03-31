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
        category: 'general',
      };

      if (mode === 'project' && selectedProject) {
        payload.projectId = selectedProject.id;
      } else if (mode === 'image' && (imageUrl || uploadedImage)) {
        payload.imageUrl = uploadedImage || imageUrl;
      }

      const res = await fetch('/api/community', {
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
          onClick={handleOpen}
          className="w-full glass-panel rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-lg font-bold text-orange-500">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
            <span className="flex-1 bg-white/40 border border-white/50 rounded-2xl px-4 py-3 text-secondary font-medium">
              Share your latest quilt design...
            </span>
          </div>
        </button>
      </>
    );
  }

  return (
    <div className="glass-panel rounded-[1.5rem] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center shadow-sm shrink-0">
          <span className="text-sm font-bold text-orange-500">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>

        <div className="flex-1 space-y-3">
          {/* Mode selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('text')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                mode === 'text'
                  ? 'bg-primary text-white'
                  : 'bg-white/50 text-secondary hover:bg-white/70'
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setMode('image')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                mode === 'image'
                  ? 'bg-primary text-white'
                  : 'bg-white/50 text-secondary hover:bg-white/70'
              }`}
            >
              <ImageIcon size={12} className="inline mr-1" />
              Image
            </button>
            <button
              onClick={() => setMode('project')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                mode === 'project'
                  ? 'bg-primary text-white'
                  : 'bg-white/50 text-secondary hover:bg-white/70'
              }`}
            >
              <Link2 size={12} className="inline mr-1" />
              Project
            </button>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-none text-lg font-bold text-on-surface placeholder:text-secondary focus:outline-none"
            autoFocus
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us more..."
            rows={3}
            className="w-full bg-white/30 rounded-xl px-3 py-2 text-on-surface placeholder:text-secondary font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Image mode inputs */}
          {mode === 'image' && (
            <div className="space-y-2">
              {/* Uploaded image preview */}
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

              {/* Image URL input */}
              {!uploadedImage && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Or paste an image URL..."
                    className="flex-1 bg-white/30 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}

              {/* File upload button */}
              {!uploadedImage && (
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
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 text-sm font-bold text-secondary hover:bg-white/70 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    Upload Image
                  </button>
                  <span className="text-xs text-secondary self-center">or paste URL above</span>
                </div>
              )}
            </div>
          )}

          {/* Selected project preview */}
          {mode === 'project' && selectedProject && (
            <div className="flex items-center gap-2 p-2 bg-white/40 rounded-lg">
              {selectedProject.thumbnailUrl ? (
                <NextImage
                  src={selectedProject.thumbnailUrl}
                  alt={selectedProject.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                  <span className="text-lg">🧵</span>
                </div>
              )}
              <span className="flex-1 text-sm font-medium text-on-surface truncate">
                {selectedProject.name}
              </span>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1 hover:bg-white/50 rounded"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex items-center justify-between pt-2 border-t border-white/30">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-bold text-secondary hover:text-on-surface transition-colors"
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
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 text-sm font-bold text-secondary hover:bg-white/70 transition-colors"
                >
                  <Link2 size={16} />
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
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white text-sm font-bold hover:from-orange-500 hover:to-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project picker modal */}
      {showProjectPicker && mode === 'project' && (
        <div className="mt-4 pt-4 border-t border-white/30">
          <p className="text-sm font-bold text-secondary mb-2">Select a project to share:</p>
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
                  className={`p-2 rounded-lg text-left transition-colors ${
                    selectedProject?.id === project.id
                      ? 'bg-primary/20 ring-2 ring-primary'
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
                    <div className="w-full h-16 rounded bg-primary/20 flex items-center justify-center mb-1">
                      <span className="text-xl">🧵</span>
                    </div>
                  )}
                  <p className="text-xs font-medium text-on-surface truncate">{project.name}</p>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowProjectPicker(false)}
            className="mt-2 text-sm text-secondary hover:text-primary"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
