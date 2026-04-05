'use client';

import { useState } from 'react';
import SectionTitle from '@/components/ui/SectionTitle';

export default function AdminLibrariesPage() {
  const [activeTab, setActiveTab] = useState<'fabrics' | 'blocks' | 'templates'>('fabrics');

  return (
    <div className="space-y-6">
      <SectionTitle title="System Libraries" />
      <p className="text-secondary text-sm">Manage global system content available to all users.</p>

      <div className="flex border-b border-outline-variant">
        {['fabrics', 'blocks', 'templates'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant p-6 shadow-sm">
        {activeTab === 'fabrics' && <FabricForm />}
        {activeTab === 'blocks' && <BlockForm />}
        {activeTab === 'templates' && <TemplateForm />}
      </div>
    </div>
  );
}

function FabricForm() {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    thumbnailUrl: '',
    manufacturer: '',
    sku: '',
    collection: '',
    colorFamily: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/libraries/fabrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      } else {
        alert('Fabric added successfully!');
        setFormData({ name: '', imageUrl: '', thumbnailUrl: '', manufacturer: '', sku: '', collection: '', colorFamily: '' });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add fabric.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <h3 className="text-lg font-semibold text-on-surface">Add New System Fabric</h3>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Name *</label>
        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Image URL *</label>
        <input required type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Thumbnail URL</label>
          <input type="text" name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Manufacturer</label>
          <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">SKU</label>
          <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Collection</label>
          <input type="text" name="collection" value={formData.collection} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Color Family</label>
          <input type="text" name="colorFamily" value={formData.colorFamily} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
      </div>
      <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium disabled:opacity-50">
        {saving ? 'Adding...' : 'Add Fabric'}
      </button>
    </form>
  );
}

function BlockForm() {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    svgData: '',
    fabricJsDataStr: '',
    tagsStr: '',
    thumbnailUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let fabricJsData = null;
      if (formData.fabricJsDataStr) {
        try { fabricJsData = JSON.parse(formData.fabricJsDataStr); }
        catch { fabricJsData = null; }
      }

      const tags = formData.tagsStr.split(',').map(t => t.trim()).filter(Boolean);

      const res = await fetch('/api/admin/libraries/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, fabricJsData, tags }),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      } else {
        alert('Block added successfully!');
        setFormData({ name: '', category: '', subcategory: '', svgData: '', fabricJsDataStr: '', tagsStr: '', thumbnailUrl: '' });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add block.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <h3 className="text-lg font-semibold text-on-surface">Add New System Block</h3>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Name *</label>
        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Category *</label>
          <input required type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Subcategory</label>
          <input type="text" name="subcategory" value={formData.subcategory} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">SVG Data *</label>
        <textarea required name="svgData" value={formData.svgData} onChange={handleChange} rows={4} className="w-full px-3 py-2 border rounded-lg bg-surface font-mono text-sm" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">FabricJS JSON (optional)</label>
        <textarea name="fabricJsDataStr" value={formData.fabricJsDataStr} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-lg bg-surface font-mono text-sm" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Tags (comma separated)</label>
        <input type="text" name="tagsStr" value={formData.tagsStr} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Thumbnail URL</label>
        <input type="text" name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
      </div>
      <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium disabled:opacity-50">
        {saving ? 'Adding...' : 'Add Block'}
      </button>
    </form>
  );
}

function TemplateForm() {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skillLevel: 'beginner',
    finishedWidth: '',
    finishedHeight: '',
    blockCount: '',
    fabricCount: '',
    patternDataStr: '',
    tagsStr: '',
    thumbnailUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let patternData = null;
      if (formData.patternDataStr) {
        try { patternData = JSON.parse(formData.patternDataStr); }
        catch { patternData = formData.patternDataStr; }
      }

      const tags = formData.tagsStr.split(',').map(t => t.trim()).filter(Boolean);

      const res = await fetch('/api/admin/libraries/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, patternData, tags }),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      } else {
        alert('Template added successfully!');
        setFormData({ name: '', description: '', skillLevel: 'beginner', finishedWidth: '', finishedHeight: '', blockCount: '', fabricCount: '', patternDataStr: '', tagsStr: '', thumbnailUrl: '' });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add template.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <h3 className="text-lg font-semibold text-on-surface">Add New Pattern Template</h3>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Name *</label>
        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full px-3 py-2 border rounded-lg bg-surface" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Skill Level *</label>
          <select name="skillLevel" value={formData.skillLevel} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Thumbnail URL</label>
          <input type="text" name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Width (inches) *</label>
          <input required type="number" step="0.1" name="finishedWidth" value={formData.finishedWidth} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Height (inches) *</label>
          <input required type="number" step="0.1" name="finishedHeight" value={formData.finishedHeight} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Block Count</label>
          <input type="number" name="blockCount" value={formData.blockCount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface">Fabric Count</label>
          <input type="number" name="fabricCount" value={formData.fabricCount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Pattern Data (JSON) *</label>
        <textarea required name="patternDataStr" value={formData.patternDataStr} onChange={handleChange} rows={4} className="w-full px-3 py-2 border rounded-lg bg-surface font-mono text-sm" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Tags (comma separated)</label>
        <input type="text" name="tagsStr" value={formData.tagsStr} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-surface" />
      </div>
      <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium disabled:opacity-50">
        {saving ? 'Adding...' : 'Add Template'}
      </button>
    </form>
  );
}
