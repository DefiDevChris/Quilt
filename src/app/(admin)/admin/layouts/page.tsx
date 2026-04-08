'use client';

import { useEffect, useState, useCallback } from 'react';

interface LayoutTemplate {
  id: string;
  name: string;
  category: string;
  thumbnailSvg: string | null;
  isDefault: boolean;
  isPublished: boolean;
  templateData: Record<string, unknown>;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminLayoutsPage() {
  const [layouts, setLayouts] = useState<LayoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLayout, setEditingLayout] = useState<LayoutTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLayouts = useCallback(
    async (page: number) => {
      try {
        const res = await fetch(`/api/admin/layouts?page=${page}&limit=${pagination.limit}`);
        if (res.ok) {
          const data = await res.json();
          setLayouts(data.data?.layouts ?? []);
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
    fetchLayouts(pagination.page);
  }, [fetchLayouts, pagination.page]);

  async function handleTogglePublish(layoutId: string, currentPublished: boolean) {
    try {
      const res = await fetch(`/api/admin/layouts/${layoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentPublished }),
      });
      if (res.ok) {
        setLayouts((prev) =>
          prev.map((l) => (l.id === layoutId ? { ...l, isPublished: !currentPublished } : l))
        );
      }
    } catch {
      console.error('Failed to toggle publish status');
    }
  }

  async function handleDelete(layoutId: string) {
    if (!confirm('Delete this layout? This action cannot be undone.')) return;
    setDeletingId(layoutId);
    try {
      const res = await fetch(`/api/admin/layouts/${layoutId}`, { method: 'DELETE' });
      if (res.ok) {
        setLayouts((prev) => prev.filter((l) => l.id !== layoutId));
      }
    } catch {
      console.error('Failed to delete layout');
    } finally {
      setDeletingId(null);
    }
  }

  function handleCreated() {
    setShowCreateModal(false);
    fetchLayouts(1);
  }

  function handleUpdated() {
    setEditingLayout(null);
    fetchLayouts(pagination.page);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Layout Templates</h1>
          <p className="text-sm text-secondary mt-1">
            Manage quilt layout templates available in the studio
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-400 text-white font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Layout
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : layouts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <p className="text-secondary">No layout templates yet. Create your first layout!</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-outline-variant overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider hidden sm:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider text-center">
                    Published
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 bg-surface">
                {layouts.map((layout) => (
                  <tr key={layout.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-container/40 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-on-surface truncate">{layout.name}</p>
                          {layout.isDefault && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary-container/40 text-secondary">
                              System
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-secondary">{layout.category}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(layout.id, layout.isPublished)}
                        className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          layout.isPublished ? 'bg-primary' : 'bg-primary-container/60'
                        }`}
                        role="switch"
                        aria-checked={layout.isPublished}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-elevation-1 transition-transform ${
                            layout.isPublished ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-secondary">
                        {new Date(layout.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingLayout(layout)}
                          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(layout.id)}
                          className="text-sm font-medium text-error hover:text-error/80 transition-colors disabled:opacity-50"
                          disabled={deletingId === layout.id}
                        >
                          {deletingId === layout.id ? '...' : 'Delete'}
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
                layouts
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
        <LayoutFormModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />
      )}

      {editingLayout && (
        <LayoutFormModal
          layout={editingLayout}
          onClose={() => setEditingLayout(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

function LayoutFormModal({
  layout,
  onClose,
  onCreated,
  onUpdated,
}: {
  layout?: LayoutTemplate;
  onClose: () => void;
  onCreated?: () => void;
  onUpdated?: () => void;
}) {
  const isEditing = !!layout;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: layout?.name ?? '',
    category: layout?.category ?? 'custom',
    templateDataJson: layout ? JSON.stringify(layout.templateData, null, 2) : '{}',
    thumbnailSvg: layout?.thumbnailSvg ?? '',
    isDefault: layout?.isDefault ?? false,
    isPublished: layout?.isPublished ?? true,
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

    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }

    let templateData: Record<string, unknown>;
    try {
      templateData = JSON.parse(formData.templateDataJson);
    } catch {
      setError('Template Data must be valid JSON.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        category: formData.category,
        templateData,
        isDefault: formData.isDefault,
        isPublished: formData.isPublished,
      };
      if (formData.thumbnailSvg.trim()) {
        payload.thumbnailSvg = formData.thumbnailSvg;
      }

      const url = isEditing ? `/api/admin/layouts/${layout!.id}` : '/api/admin/layouts';
      const method = isEditing ? 'PATCH' : 'POST';

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
        setError(json.error ?? 'Failed to save layout');
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
            {isEditing ? 'Edit Layout' : 'Create New Layout'}
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
                placeholder="e.g. Classic Nine-Patch"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface"
              >
                <option value="straight">Straight Set</option>
                <option value="sashing">Sashing</option>
                <option value="on-point">On Point</option>
                <option value="medallion">Medallion</option>
                <option value="strippy">Strippy</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">
              Template Data (JSON) *
            </label>
            <textarea
              required
              name="templateDataJson"
              value={formData.templateDataJson}
              onChange={handleChange}
              rows={6}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface font-mono text-xs"
              placeholder='{"shapes": [...]}'
            />
          </div>

          <div>
            <label className="text-sm font-medium text-on-surface">Thumbnail SVG</label>
            <textarea
              name="thumbnailSvg"
              value={formData.thumbnailSvg}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface font-mono text-xs"
              placeholder='<svg viewBox="0 0 100 100">...</svg>'
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded border-outline-variant"
              />
              <span className="text-sm text-on-surface">System Default</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))}
                className="rounded border-outline-variant"
              />
              <span className="text-sm text-on-surface">Published</span>
            </label>
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
              {saving ? 'Saving...' : isEditing ? 'Update Layout' : 'Create Layout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
