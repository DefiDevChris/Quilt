'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminModal } from '@/components/admin/AdminModal';
import { COLORS, withAlpha } from '@/lib/design-system';

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

export default function AdminBlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blocks');
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.data?.blocks ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBlocks();
  }, [fetchBlocks]);

  async function handleDelete(blockId: string) {
    if (!confirm('Delete this block?')) return;
    setDeletingId(blockId);
    try {
      const res = await fetch(`/api/admin/blocks/${blockId}`, { method: 'DELETE' });
      if (res.ok) {
        setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved() {
    setShowCreateModal(false);
    setEditingBlock(null);
    fetchBlocks();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default">Blocks</h1>
          <p className="text-sm text-dim mt-1">
            Manage quilt blocks available to all users
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-[var(--color-surface)] font-medium hover:bg-primary-hover transition-colors duration-150"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Block
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-pulse rounded-lg h-8 w-8"
            style={{ backgroundColor: withAlpha(COLORS.primary, 0.2) }}
          />
        </div>
      ) : blocks.length === 0 ? (
        <div className="bg-[var(--color-bg)] border border-default rounded-lg p-12 text-center">
          <p className="text-dim">No blocks yet. Create your first block!</p>
        </div>
      ) : (
        <div className="rounded-lg border border-default overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-bg)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dim">Block</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dim">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dim hidden md:table-cell">Tags</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dim hidden sm:table-cell">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-dim">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default bg-[var(--color-bg)]">
              {blocks.map((block) => (
                <tr key={block.id} className="hover:bg-[var(--color-bg)]/60 transition-colors duration-150">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {block.thumbnailUrl ? (
                        <img
                          src={block.thumbnailUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: withAlpha(COLORS.primary, 0.1) }}
                        >
                          <svg className="w-5 h-5 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-default truncate">{block.name}</p>
                        {block.subcategory && <p className="text-xs text-dim">{block.subcategory}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-sm text-dim">{block.category}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {block.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded-lg text-dim" style={{ backgroundColor: withAlpha(COLORS.primary, 0.1) }}>{tag}</span>
                      ))}
                      {block.tags.length > 2 && <span className="text-xs text-dim">+{block.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-dim">{new Date(block.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditingBlock(block)} className="text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-150">Edit</button>
                      <button
                        onClick={() => handleDelete(block.id)}
                        className="text-sm font-medium hover:opacity-80 transition-colors duration-150 disabled:opacity-50"
                        style={{ color: COLORS.error }}
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
      )}

      {showCreateModal && <BlockFormModal onClose={() => setShowCreateModal(false)} onSaved={handleSaved} />}
      {editingBlock && <BlockFormModal block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={handleSaved} />}
    </div>
  );
}

function BlockFormModal({ block, onClose, onSaved }: { block?: Block; onClose: () => void; onSaved: () => void }) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      const tags = formData.tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
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
      if (isEditing && formData.svgData.trim()) {
        payload.svgData = formData.svgData;
      }

      const url = isEditing ? `/api/admin/blocks/${block!.id}` : '/api/admin/blocks';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        onSaved();
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
    <AdminModal title={isEditing ? 'Edit Block' : 'Create New Block'} error={error} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="block-name" className="text-sm font-medium text-default">Name *</label>
            <input id="block-name" required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-default rounded-lg bg-[var(--color-surface)]" />
          </div>
          <div>
            <label htmlFor="block-category" className="text-sm font-medium text-default">Category *</label>
            <input id="block-category" required type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-default rounded-lg bg-[var(--color-surface)]" />
          </div>
        </div>
        <div>
          <label htmlFor="block-subcategory" className="text-sm font-medium text-default">Subcategory</label>
          <input id="block-subcategory" type="text" name="subcategory" value={formData.subcategory} onChange={handleChange} className="w-full px-3 py-2 border border-default rounded-lg bg-[var(--color-surface)]" />
        </div>
        <div>
          <label htmlFor="block-svg-data" className="text-sm font-medium text-default">SVG Data {isEditing ? '(leave blank to keep current)' : '*'}</label>
          <textarea id="block-svg-data" name="svgData" value={formData.svgData} onChange={handleChange} rows={5} className="w-full px-3 py-2 border border-default rounded-lg bg-[var(--color-surface)] font-mono text-sm" placeholder='<svg viewBox="0 0 300 300">...</svg>' />
        </div>
        <div>
          <label htmlFor="block-tags" className="text-sm font-medium text-default">Tags (comma separated)</label>
          <input id="block-tags" type="text" name="tagsStr" value={formData.tagsStr} onChange={handleChange} className="w-full px-3 py-2 border border-default rounded-lg bg-[var(--color-surface)]" placeholder="traditional, nine-patch, beginner" />
        </div>
        <div>
          <label htmlFor="block-thumbnail-url" className="text-sm font-medium text-default">Thumbnail URL</label>
          <input id="block-thumbnail-url" type="text" name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} className="w-full px-3 py-2 border border-default rounded-lg bg-[var(--color-surface)]" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-dim rounded-full hover:bg-[var(--color-bg)] transition-colors duration-150">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-[var(--color-surface)] bg-primary rounded-full disabled:opacity-50 hover:bg-primary-hover transition-colors duration-150">
            {saving ? 'Saving...' : isEditing ? 'Update Block' : 'Create Block'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
