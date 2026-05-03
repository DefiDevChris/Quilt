'use client';

import { useState } from 'react';

export default function AdminLibrariesPage() {
  return (
    <div className="space-y-6">
      <p className="text-dim text-sm">Manage global system content available to all users.</p>
      <div className="bg-surface rounded-lg border border-default p-6 shadow-elevated">
        <FabricForm />
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
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        setFormData({
          name: '',
          imageUrl: '',
          thumbnailUrl: '',
          manufacturer: '',
          sku: '',
          collection: '',
          colorFamily: '',
        });
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
      <h3 className="text-lg font-semibold text-default">Add New System Fabric</h3>
      <div className="space-y-2">
        <label htmlFor="fabric-name" className="text-sm font-medium text-default">
          Name *
        </label>
        <input
          id="fabric-name"
          required
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="fabric-image-url" className="text-sm font-medium text-default">
          Image URL *
        </label>
        <input
          id="fabric-image-url"
          required
          type="text"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="fabric-thumbnail-url" className="text-sm font-medium text-default">
            Thumbnail URL
          </label>
          <input
            id="fabric-thumbnail-url"
            type="text"
            name="thumbnailUrl"
            value={formData.thumbnailUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="fabric-manufacturer" className="text-sm font-medium text-default">
            Manufacturer
          </label>
          <input
            id="fabric-manufacturer"
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="fabric-sku" className="text-sm font-medium text-default">
            SKU
          </label>
          <input
            id="fabric-sku"
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="fabric-collection" className="text-sm font-medium text-default">
            Collection
          </label>
          <input
            id="fabric-collection"
            type="text"
            name="collection"
            value={formData.collection}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="fabric-color-family" className="text-sm font-medium text-default">
            Color Family
          </label>
          <input
            id="fabric-color-family"
            type="text"
            name="colorFamily"
            value={formData.colorFamily}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-primary text-surface rounded-full font-medium disabled:opacity-50 hover:bg-primary-hover transition-colors duration-150"
      >
        {saving ? 'Adding...' : 'Add Fabric'}
      </button>
    </form>
  );
}
