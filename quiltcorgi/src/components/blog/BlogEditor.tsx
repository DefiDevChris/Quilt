'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { TiptapRenderer } from '@/components/editor/TiptapRenderer';

interface TiptapNode {
  readonly type: string;
  readonly content?: readonly TiptapNode[];
  readonly text?: string;
  readonly marks?: readonly { type: string; attrs?: Record<string, unknown> }[];
  readonly attrs?: Record<string, unknown>;
}

interface TiptapDoc {
  readonly type: 'doc';
  readonly content: readonly TiptapNode[];
}

const CATEGORIES = [
  'Tutorials',
  'Tips & Tricks',
  'Community',
  'Product Updates',
  'Inspiration',
  'Behind the Scenes',
];

const DEFAULT_CONTENT: TiptapDoc = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [] }],
};

export function BlogEditor() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [tagsInput, setTagsInput] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [content, setContent] = useState<TiptapDoc>(DEFAULT_CONTENT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const parseTags = useCallback((): string[] => {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 5);
  }, [tagsInput]);

  const handleSubmit = useCallback(
    async (status: 'draft' | 'pending') => {
      if (!title.trim()) {
        setError('Title is required.');
        return;
      }

      if (!category) {
        setError('Category is required.');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const tags = parseTags();

        const res = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            excerpt: excerpt || undefined,
            featuredImageUrl: featuredImageUrl || undefined,
            category,
            tags,
            status,
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? 'Failed to create post.');
          return;
        }

        router.push('/blog');
      } catch {
        setError('Failed to create post. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [title, excerpt, category, featuredImageUrl, content, parseTags, router]
  );

  if (showPreview) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-on-surface">Preview</h1>
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="rounded-md bg-surface-container px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Back to Editor
          </button>
        </div>

        {featuredImageUrl && /^https?:\/\//i.test(featuredImageUrl) && (
          <div className="rounded-xl overflow-hidden mb-6 max-h-[400px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featuredImageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        <h2 className="text-headline-lg font-bold text-on-surface mb-2">
          {title || 'Untitled Post'}
        </h2>

        {excerpt && <p className="text-secondary mb-6">{excerpt}</p>}

        <div className="flex items-center gap-2 mb-6 text-xs text-secondary">
          <span className="font-medium text-primary bg-primary-container/30 px-2 py-0.5 rounded-full">
            {category}
          </span>
          {parseTags().map((tag) => (
            <span key={tag} className="bg-surface-container-high px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <TiptapRenderer content={content} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Write a Blog Post</h1>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="rounded-md bg-surface-container px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
        >
          Preview
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="blog-title" className="block text-sm font-medium text-on-surface mb-1">
            Title
          </label>
          <input
            id="blog-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your blog post title"
            maxLength={200}
            className="w-full rounded-lg border border-outline-variant/30 bg-surface px-4 py-2.5 text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="blog-excerpt" className="block text-sm font-medium text-on-surface mb-1">
            Excerpt (optional)
          </label>
          <textarea
            id="blog-excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="A brief summary of your post"
            maxLength={300}
            rows={2}
            className="w-full rounded-lg border border-outline-variant/30 bg-surface px-4 py-2.5 text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Featured Image URL */}
        <div>
          <label htmlFor="blog-image" className="block text-sm font-medium text-on-surface mb-1">
            Featured Image URL (optional)
          </label>
          <input
            id="blog-image"
            type="text"
            value={featuredImageUrl}
            onChange={(e) => setFeaturedImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-lg border border-outline-variant/30 bg-surface px-4 py-2.5 text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="blog-category" className="block text-sm font-medium text-on-surface mb-1">
            Category
          </label>
          <select
            id="blog-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-outline-variant/30 bg-surface px-4 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="blog-tags" className="block text-sm font-medium text-on-surface mb-1">
            Tags (comma-separated, max 5)
          </label>
          <input
            id="blog-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="quilting, beginner, design"
            className="w-full rounded-lg border border-outline-variant/30 bg-surface px-4 py-2.5 text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Content</label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="rounded-md bg-surface-container px-6 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('pending')}
            disabled={isSubmitting}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
