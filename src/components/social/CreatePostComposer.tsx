'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { X, Image as ImageIcon, Send, Upload } from 'lucide-react';
import { AuthGateModal } from '@/components/auth/AuthGateModal';

interface CreatePostComposerProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreatePostComposer({ onSuccess, onCancel }: CreatePostComposerProps) {
  const user = useAuthStore((s) => s.user);
  const [isExpanded, setIsExpanded] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = async () => {
    if (!user) {
      setAuthGateOpen(true);
      return;
    }
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setDescription('');
    setImageUrl('');
    setUploadedImage(null);
    setError(null);
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
    if (!description.trim() && !uploadedImage && !imageUrl) {
      setError('Write something or add an image');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: description.trim().slice(0, 80) || 'Shared a design',
        description: description.trim() || undefined,
        category: 'general',
      };

      if (uploadedImage || imageUrl) {
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

      setDescription('');
      setImageUrl('');
      setUploadedImage(null);
      setIsExpanded(false);
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
          className="composer-trigger"
        >
          <div className="composer-trigger-avatar">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <span className="composer-trigger-text">Share your latest quilt design...</span>
        </button>
      </>
    );
  }

  const canShare = description.trim() || uploadedImage || imageUrl;

  return (
    <div className="composer-expanded">
      <div className="composer-expanded-header">
        <h3>New Post</h3>
        <button onClick={handleClose} className="composer-close-btn">
          <X size={20} />
        </button>
      </div>

      <div className="composer-body">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you working on?"
          rows={3}
          className="composer-input"
          autoFocus
        />

        {/* Image preview */}
        {uploadedImage && (
          <div className="composer-image-preview">
            <img src={uploadedImage} alt="Uploaded" />
            <button
              onClick={() => setUploadedImage(null)}
              className="composer-image-remove"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Image upload area */}
        {!uploadedImage && !imageUrl && (
          <div className="composer-options">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="composer-option"
            >
              {isUploading ? (
                <div className="w-4 h-4 animate-pulse rounded-full bg-[#e8e1da]" />
              ) : (
                <ImageIcon size={16} />
              )}
              {isUploading ? 'Uploading...' : 'Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Image URL input */}
        {!uploadedImage && (
          <div style={{ marginTop: uploadedImage ? 0 : 12 }}>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste an image URL..."
              className="composer-input"
              style={{ fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--color-tertiary)' }}
            />
          </div>
        )}

        {error && <p className="composer-error">{error}</p>}

        <div className="composer-footer">
          <button
            onClick={handleSubmit}
            disabled={!canShare || isSubmitting}
            className="composer-share-btn"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 animate-pulse rounded-full bg-[#fdfaf7]" />
                Posting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send size={16} />
                Share
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
