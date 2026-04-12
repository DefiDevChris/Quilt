'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { TiptapRenderer } from '@/components/editor/TiptapRenderer';
import { COLORS } from '@/lib/design-system';

interface BlogPostFormData {
  title: string;
  excerpt: string;
  content?: Record<string, unknown>;
  featuredImageUrl: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  layout: 'standard' | 'hero-cover' | 'staggered-media';
}

const BLOG_CATEGORIES = [
  'Product Updates',
  'Behind the Scenes',
  'Tutorials',
  'Community',
  'Tips',
  'Inspiration',
  'History',
  'Organization',
];

export default function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    excerpt: '',
    content: undefined,
    featuredImageUrl: '',
    category: 'Tutorials',
    tags: [],
    status: 'draft',
    layout: 'standard',
  });
  const [tagInput, setTagInput] = useState('');
  const [postId, setPostId] = useState<string | null>(null);

  // Resolve params and fetch post if editing
  useEffect(() => {
    async function loadPost() {
      try {
        const { id } = await params;
        if (id === 'new') {
          setPostId(null);
          setLoading(false);
          return;
        }

        setPostId(id);
        const res = await fetch(`/api/admin/blog/${id}`);
        if (res.ok) {
          const data = await res.json();
          const post = data.data;
          setFormData({
            title: post.title || '',
            excerpt: post.excerpt || '',
            content: post.content || undefined,
            featuredImageUrl: post.featuredImageUrl || '',
            category: post.category || 'Tutorials',
            tags: post.tags || [],
            status: post.status || 'draft',
            layout: post.layout || 'standard',
          });
        }
      } catch (error) {
        console.error('Failed to load post:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [params]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          purpose: 'fabric',
        }),
      });

      if (!presignedRes.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { data } = await presignedRes.json();
      const { uploadUrl, publicUrl } = data;

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      setFormData((prev) => ({ ...prev, featuredImageUrl: publicUrl }));
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !formData.tags.includes(trimmed) && formData.tags.length < 5) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
  }, []);

  const handleSubmit = useCallback(
    async (statusOverride?: 'draft' | 'published') => {
      if (!formData.title.trim()) {
        alert('Please enter a title');
        return;
      }

      setSaving(true);
      try {
        const url = postId ? `/api/admin/blog/${postId}` : '/api/blog';
        const method = postId ? 'PUT' : 'POST';

        const payload = {
          ...formData,
          status: statusOverride ?? formData.status,
        };

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          router.push('/admin/blog');
        } else {
          const error = await res.json();
          alert(error.error || 'Failed to save post');
        }
      } catch (error) {
        console.error('Save failed:', error);
        alert('Failed to save post');
      } finally {
        setSaving(false);
      }
    },
    [formData, postId, router]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse rounded-lg h-8 w-8 bg-primary/20"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default">
            {postId ? 'Edit Post' : 'Create New Post'}
          </h1>
          <p className="text-sm text-dim mt-1">
            {postId ? 'Update your blog post' : 'Create a new blog post'}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-surface text-dim rounded-full text-sm font-medium hover:bg-default transition-colors duration-150"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-default mb-2">
            Title <span style={{ color: COLORS.error }}>*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2.5 bg-surface border border-default rounded-lg text-default focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Enter post title"
            maxLength={200}
            required
          />
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-default mb-2">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
            className="w-full px-4 py-2.5 bg-surface border border-default rounded-lg text-default focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            placeholder="Brief summary of the post"
            rows={3}
            maxLength={300}
          />
        </div>

        {/* Cover Image */}
        <div>
          <label htmlFor="blog-cover-image" className="block text-sm font-medium text-default mb-2">Cover Image</label>
          <div className="space-y-3">
            {formData.featuredImageUrl ? (
              <div className="relative aspect-video max-w-lg rounded-lg overflow-hidden border border-default">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.featuredImageUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove cover image"
                  onClick={() => setFormData((prev) => ({ ...prev, featuredImageUrl: '' }))}
                  className="absolute top-2 right-2 p-1.5 text-white rounded-full hover:opacity-90 transition-colors duration-150"
                  style={{ backgroundColor: COLORS.error }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <label htmlFor="blog-cover-upload" className="flex flex-col items-center justify-center w-full max-w-lg h-32 border-2 border-dashed border-default rounded-lg cursor-pointer hover:bg-default transition-colors duration-150">
                <div className="text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-dim"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-1 text-sm text-dim">
                    {uploading ? 'Uploading...' : 'Click to upload or enter URL'}
                  </p>
                </div>
                <input
                  id="blog-cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
            {!formData.featuredImageUrl && (
              <>
                <label htmlFor="blog-cover-url" className="sr-only">Cover Image URL</label>
                <input
                  id="blog-cover-url"
                  type="url"
                  value={formData.featuredImageUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, featuredImageUrl: e.target.value }))
                  }
                  className="w-full max-w-lg px-4 py-2.5 bg-surface border border-default rounded-lg text-default text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Or paste image URL..."
                />
              </>
            )}
          </div>
        </div>

        {/* Category & Status & Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-default mb-2">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2.5 bg-surface border border-default rounded-lg text-default focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {BLOG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="layout" className="block text-sm font-medium text-default mb-2">
              Layout
            </label>
            <select
              id="layout"
              value={formData.layout}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  layout: e.target.value as BlogPostFormData['layout'],
                }))
              }
              className="w-full px-4 py-2.5 bg-surface border border-default rounded-lg text-default focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="standard">Standard</option>
              <option value="hero-cover">Hero Cover</option>
              <option value="staggered-media">Staggered Media</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-default mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as BlogPostFormData['status'],
                }))
              }
              className="w-full px-4 py-2.5 bg-surface border border-default rounded-lg text-default focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-default mb-2">
            Tags (max 5)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 px-4 py-2.5 bg-surface border border-default rounded-lg text-default text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Add a tag"
              maxLength={50}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={formData.tags.length >= 5 || !tagInput.trim()}
              className="px-4 py-2.5 bg-default border border-default rounded-full text-sm font-medium text-dim hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-default rounded-lg text-xs font-medium text-dim"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:opacity-80 transition-colors duration-150"
                    style={{ color: COLORS.error }}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-default mb-2">Content</label>
          <RichTextEditor
            initialContent={formData.content}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, content: content as Record<string, unknown> }))
            }
          />
        </div>

        {/* Preview */}
        {formData.content && (
          <div>
            <label className="block text-sm font-medium text-default mb-2">Preview</label>
            <div className="p-4 bg-default rounded-lg border border-default">
              <TiptapRenderer content={formData.content} />
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-default">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="px-5 py-2.5 bg-surface text-dim rounded-full text-sm font-medium hover:bg-default disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-full bg-primary text-surface text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {saving ? 'Saving...' : postId ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
