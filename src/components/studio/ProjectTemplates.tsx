'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  unitSystem: 'imperial' | 'metric';
  gridSettings: {
    enabled: boolean;
    size: number;
    snapToGrid: boolean;
  };
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
}

interface ProjectTemplatesProps {
  onSelectTemplate?: (template: ProjectTemplate) => void;
  showCreateButton?: boolean;
}

export function ProjectTemplates({
  onSelectTemplate,
  showCreateButton = true,
}: ProjectTemplatesProps) {
  const user = useAuthStore((s) => s.user);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    canvasWidth: 48,
    canvasHeight: 48,
    unitSystem: 'imperial' as const,
    gridSettings: {
      enabled: true,
      size: 1,
      snapToGrid: true,
    },
  });

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/project-templates');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTemplates(data.data);
    } catch {
      // Failed to fetch templates
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/project-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create template');

      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        canvasWidth: 48,
        canvasHeight: 48,
        unitSystem: 'imperial',
        gridSettings: { enabled: true, size: 1, snapToGrid: true },
      });
      fetchTemplates();
    } catch {
      // Failed to create template
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      const res = await fetch(`/api/project-templates/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      fetchTemplates();
    } catch {
      // Failed to delete template
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showCreateButton && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-outline-variant/50 rounded-xl text-secondary hover:text-on-surface hover:border-primary/50 transition-colors"
        >
          <Plus size={20} />
          <span className="font-semibold">Create Template</span>
        </button>
      )}

      {showCreateForm && (
        <form
          onSubmit={handleCreateTemplate}
          className="glass-card border border-white/40 rounded-xl p-6 space-y-4"
        >
          <h3 className="font-bold text-on-surface">New Template</h3>

          <input
            type="text"
            placeholder="Template name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Width"
              value={formData.canvasWidth}
              onChange={(e) => setFormData({ ...formData, canvasWidth: Number(e.target.value) })}
              className="px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              min="1"
              required
            />
            <input
              type="number"
              placeholder="Height"
              value={formData.canvasHeight}
              onChange={(e) => setFormData({ ...formData, canvasHeight: Number(e.target.value) })}
              className="px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              min="1"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Save Template
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-3 bg-surface-container text-secondary rounded-xl font-semibold hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {templates.map((template) => (
        <div
          key={template.id}
          className="glass-card border border-white/40 rounded-xl p-4 flex items-center justify-between group hover:shadow-elevation-2 transition-all"
        >
          <div className="flex-1 cursor-pointer" onClick={() => onSelectTemplate?.(template)}>
            <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">
              {template.name}
            </h4>
            <p className="text-sm text-secondary">
              {template.canvasWidth}&quot; × {template.canvasHeight}&quot; • {template.unitSystem}
            </p>
          </div>

          <button
            onClick={() => handleDeleteTemplate(template.id)}
            className="p-2 text-secondary hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {templates.length === 0 && !showCreateForm && (
        <div className="text-center py-8 text-secondary">
          <Settings size={32} className="mx-auto mb-3 opacity-50" />
          <p>No templates saved yet</p>
        </div>
      )}
    </div>
  );
}
