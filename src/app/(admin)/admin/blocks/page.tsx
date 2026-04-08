'use client';

import { useEffect, useState, useCallback } from 'react';

interface Block {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  isDefault: boolean;
  thumbnailUrl: string | null;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminBlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBlocks = useCallback(
    async (page: number) => {
      try {
        const res = await fetch(`/api/admin/blocks?page=${page}&limit=${pagination.limit}`);
        if (res.ok) {
          const data = await res.json();
          setBlocks(data.data?.blocks ?? []);
          setPagination(data.data?.pagination ?? pagination);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    fetchBlocks(pagination.page);
  }, [fetchBlocks, pagination.page]);

  async function handleDelete(blockId: string) {
    if (!confirm('Delete this block? This action cannot be undone.')) return;
    setDeletingId(blockId);
    try {
      const res = await fetch(`/api/admin/blocks/${blockId}`, { method: 'DELETE' });
      if (res.ok) {
        setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      }
    } catch {
      console.error('Failed to delete block');
    } finally {
      setDeletingId(null);
    }
  }

  function handleCreated() {
    setShowCreateModal(false);
    fetchBlocks(1);
  }

  function handleUpdated() {
    setEditingBlock(null);
    fetchBlocks(pagination.page);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">System Blocks</h1>
          <p className="text-sm text-secondary mt-1">
            Manage the quilt block library available to all users
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-400 text-white font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Block
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : blocks.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <p className="text-secondary">No blocks yet. Create your first block!</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-outline-variant overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Block
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider hidden sm:table-cell">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 bg-surface">
                {blocks.map((block) => (
                  <tr key={block.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {block.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={block.thumbnailUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary-container/40 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-on-surface truncate">{block.name}</p>
                          {block.subcategory && (
                            <p className="text-xs text-secondary">{block.subcategory}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-secondary">{block.category}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {block.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded bg-primary-container/40 text-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                        {block.tags.length > 2 && (
                          <span className="text-xs text-secondary">+{block.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-secondary">
                        {new Date(block.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingBlock(block)}
                          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(block.id)}
                          className="text-sm font-medium text-error hover:text-error/80 transition-colors disabled:opacity-50"
                          disabled={deletingId === block.id}
                        >
                          {deletingId === block.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
                blocks
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm font-medium text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.totalPages, prev.page + 1),
                    }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm font-medium text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <BlockFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {editingBlock && (
        <BlockFormModal
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

function BlockFormModal({
  block,
  onClose,
  onCreated,
  onUpdated,
}: {
  block?: Block;
  onClose: () => void;
  onCreated?: () => void;
  onUpdated?: () => void;
}) {
  const isEditing = !!block;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: block?.name ?? '',
    category: block?.category ?? '',
    subcategory: block?.subcategory ?? '',
    svgData: '',
    tagsStr: block?.tags?.join(', ') ?? '',
    thumbnailUrl: block?.thumbnailUrl ?? '',
  });
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.category.trim()) {
      setError('Name and category are required.');
      return;
    }
    if (!isEditing && !formData.svgData.trim()) {
      setError('SVG data is required for new blocks.');
      return;
    }

    setSaving(true);
    try {
      const tags = formData.tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Record<string, unknown> = {
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        tags,
        thumbnailUrl: formData.thumbnailUrl || undefined,
      };

      if (!isEditing) {
        payload.svgData = formData.svgData;
      }

      const url = isEditing ? `/api/admin/blocks/${block!.id}` : '/api/admin/blocks';
      const method = isEditing ? 'PATCH' : 'POST';

      // For editing, only send changed fields
      if (isEditing && formData.svgData.trim()) {
        payload.svgData = formData.svgData;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (isEditing) {
          onUpdated?.();
        } else {
          onCreated?.();
        }
      } else {
        const json = await res.json();
        setError(json.error ?? 'Failed to save block');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
      <div className="glass-elevated rounded-2xl p-6 max-w-2xl w-full mx-4 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-on-surface">
            {isEditing ? 'Edit Block' : 'Create New Block'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
          >
            <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium bg-red-50 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-on-surface">Name *</label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface">Category *</label>
              <input
                required
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Subcategory</label>
            <input
              type="text"
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">
              SVG Data {isEditing ? '(leave blank to keep current)' : '*'}
            </label>
            <textarea
              name="svgData"
              value={formData.svgData}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface font-mono text-sm"
              placeholder="<svg viewBox=&quot;0 0 300 300&quot;>...</svg>"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Tags (comma separated)</label>
            <input
              type="text"
              name="tagsStr"
              value={formData.tagsStr}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface"
              placeholder="traditional, nine-patch, beginner"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Thumbnail URL</label>
            <input
              type="text"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary rounded-full hover:bg-white/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-rose-400 rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Block' : 'Create Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
