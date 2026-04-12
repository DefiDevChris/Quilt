'use client';

import { useState } from 'react';

export default function AdminLibrariesPage() {
  const [activeTab, setActiveTab] = useState<'fabrics' | 'blocks' | 'shop'>('fabrics');

  return (
    <div className="space-y-6">
      <p className="text-dim text-sm">Manage global system content available to all users.</p>

      <div className="flex border-b border-default">
        {['fabrics', 'blocks', 'shop'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'fabrics' | 'blocks' | 'shop')}
            className={`px-4 py-2 font-medium text-sm transition-colors duration-150 ${activeTab === tab
              ? 'border-b-2 border-primary text-primary'
              : 'text-dim hover:text-default'
              }`}
          >
            {tab === 'shop' ? 'Shop Management' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-lg border border-default p-6 shadow-brand">
        {activeTab === 'fabrics' && <FabricForm />}
        {activeTab === 'blocks' && <BlockForm />}
        {activeTab === 'shop' && <ShopManagement />}
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
        <label htmlFor="fabric-name" className="text-sm font-medium text-default">Name *</label>
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
        <label htmlFor="fabric-image-url" className="text-sm font-medium text-default">Image URL *</label>
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
          <label htmlFor="fabric-thumbnail-url" className="text-sm font-medium text-default">Thumbnail URL</label>
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
          <label htmlFor="fabric-manufacturer" className="text-sm font-medium text-default">Manufacturer</label>
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
          <label htmlFor="fabric-sku" className="text-sm font-medium text-default">SKU</label>
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
          <label htmlFor="fabric-collection" className="text-sm font-medium text-default">Collection</label>
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
          <label htmlFor="fabric-color-family" className="text-sm font-medium text-default">Color Family</label>
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
        className="px-4 py-2 bg-primary text-surface rounded-full font-medium disabled:opacity-50 hover:bg-primary-dark transition-colors duration-150"
      >
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
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let fabricJsData = null;
      if (formData.fabricJsDataStr) {
        try {
          fabricJsData = JSON.parse(formData.fabricJsDataStr);
        } catch {
          fabricJsData = null;
        }
      }

      const tags = formData.tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

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
        setFormData({
          name: '',
          category: '',
          subcategory: '',
          svgData: '',
          fabricJsDataStr: '',
          tagsStr: '',
          thumbnailUrl: '',
        });
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
      <h3 className="text-lg font-semibold text-default">Add New System Block</h3>
      <div className="space-y-2">
        <label htmlFor="lib-block-name" className="text-sm font-medium text-default">Name *</label>
        <input
          id="lib-block-name"
          required
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="lib-block-category" className="text-sm font-medium text-default">Category *</label>
          <input
            id="lib-block-category"
            required
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lib-block-subcategory" className="text-sm font-medium text-default">Subcategory</label>
          <input
            id="lib-block-subcategory"
            type="text"
            name="subcategory"
            value={formData.subcategory}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="lib-block-svg-data" className="text-sm font-medium text-default">SVG Data *</label>
        <textarea
          id="lib-block-svg-data"
          required
          name="svgData"
          value={formData.svgData}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-default rounded-lg bg-surface font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="lib-block-fabric-json" className="text-sm font-medium text-default">FabricJS JSON (optional)</label>
        <textarea
          id="lib-block-fabric-json"
          name="fabricJsDataStr"
          value={formData.fabricJsDataStr}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-default rounded-lg bg-surface font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="lib-block-tags" className="text-sm font-medium text-default">Tags (comma separated)</label>
        <input
          id="lib-block-tags"
          type="text"
          name="tagsStr"
          value={formData.tagsStr}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="lib-block-thumbnail" className="text-sm font-medium text-default">Thumbnail URL</label>
        <input
          id="lib-block-thumbnail"
          type="text"
          name="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-default rounded-lg bg-surface"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-primary text-surface rounded-full font-medium disabled:opacity-50 hover:bg-primary-dark transition-colors duration-150"
      >
        {saving ? 'Adding...' : 'Add Block'}
      </button>
    </form>
  );
}

interface ShopFabricRow {
  id: string;
  name: string;
  manufacturer: string | null;
  hex: string | null;
  pricePerYard: string | null;
  inStock: boolean;
  isPurchasable: boolean;
}

function ShopManagement() {
  const [fabricRows, setFabricRows] = useState<ShopFabricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bulkManufacturer, setBulkManufacturer] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchFabrics = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/fabrics?page=${p}&limit=20`);
      const json = await res.json();
      if (res.ok) {
        setFabricRows(json.data.fabrics);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchFabrics(1);
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchFabrics(newPage);
  };

  const handleToggleField = async (
    fabricId: string,
    field: 'isPurchasable' | 'inStock',
    currentValue: boolean
  ) => {
    try {
      const res = await fetch(`/api/admin/fabrics/${fabricId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      if (res.ok) {
        setFabricRows((prev) =>
          prev.map((f) => (f.id === fabricId ? { ...f, [field]: !currentValue } : f))
        );
      }
    } catch {
      // ignore
    }
  };

  const handlePriceUpdate = async (fabricId: string, price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) return;
    try {
      const res = await fetch(`/api/admin/fabrics/${fabricId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricePerYard: numPrice }),
      });
      if (res.ok) {
        setFabricRows((prev) =>
          prev.map((f) => (f.id === fabricId ? { ...f, pricePerYard: String(numPrice) } : f))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleBulkToggle = async (isPurchasable: boolean) => {
    if (!bulkManufacturer.trim()) return;
    setBulkSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/fabrics/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manufacturer: bulkManufacturer.trim(), isPurchasable }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage(
          `Updated ${json.data.updatedCount} fabrics from ${bulkManufacturer} to ${isPurchasable ? 'purchasable' : 'not purchasable'}`
        );
        fetchFabrics(page);
      } else {
        setMessage(json.error ?? 'Failed to bulk update');
      }
    } catch {
      setMessage('Network error');
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-default">Shop Fabric Management</h3>
      <p className="text-sm text-dim">
        Set pricing, stock status, and purchasability for fabrics. Purchasable fabrics appear in the
        shop when it is enabled.
      </p>

      {/* Bulk Toggle */}
      <div className="border border-default rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-semibold text-default">Bulk Toggle by Manufacturer</h4>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <label htmlFor="bulk-manufacturer" className="text-xs text-dim">Manufacturer name</label>
            <input
              id="bulk-manufacturer"
              type="text"
              value={bulkManufacturer}
              onChange={(e) => setBulkManufacturer(e.target.value)}
              placeholder="e.g. Kona Cotton"
              className="w-full px-3 py-2 border border-default rounded-lg bg-surface text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => handleBulkToggle(true)}
            disabled={bulkSaving || !bulkManufacturer.trim()}
            className="px-3 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-full disabled:opacity-50 hover:bg-green-100 transition-colors duration-150"
          >
            Mark All Purchasable
          </button>
          <button
            type="button"
            onClick={() => handleBulkToggle(false)}
            disabled={bulkSaving || !bulkManufacturer.trim()}
            className="px-3 py-2 text-xs font-medium bg-red-50 text-red-700 rounded-full disabled:opacity-50 hover:bg-red-100 transition-colors duration-150"
          >
            Remove All
          </button>
        </div>
        {message && <p className="text-xs text-dim">{message}</p>}
      </div>

      {/* Fabric Table */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-primary/10 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default text-left">
                <th className="py-2 pr-4 text-dim font-medium">Fabric</th>
                <th className="py-2 pr-4 text-dim font-medium">Manufacturer</th>
                <th className="py-2 pr-4 text-dim font-medium">Price/yd</th>
                <th className="py-2 pr-4 text-dim font-medium text-center">In Stock</th>
                <th className="py-2 text-dim font-medium text-center">Purchasable</th>
              </tr>
            </thead>
            <tbody>
              {fabricRows.map((fabric) => (
                <tr key={fabric.id} className="border-b border-default/50">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      {fabric.hex && (
                        <div
                          className="w-6 h-6 rounded-lg border border-default flex-shrink-0"
                          style={{ backgroundColor: fabric.hex }}
                        />
                      )}
                      <span className="text-default truncate max-w-[200px]">{fabric.name}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-dim">{fabric.manufacturer ?? '—'}</td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={fabric.pricePerYard ?? ''}
                      onBlur={(e) => handlePriceUpdate(fabric.id, e.target.value)}
                      placeholder="0.00"
                      className="w-20 px-2 py-1 border border-default rounded-lg bg-surface text-xs"
                    />
                  </td>
                  <td className="py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleField(fabric.id, 'inStock', fabric.inStock)}
                      className={`inline-flex h-5 w-9 items-center rounded-full transition-colors duration-150 ${fabric.inStock ? 'bg-green-500' : 'bg-secondary/60'
                        }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-surface transition-transform duration-150 ${fabric.inStock ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                      />
                    </button>
                  </td>
                  <td className="py-2 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleField(fabric.id, 'isPurchasable', fabric.isPurchasable)
                      }
                      className={`inline-flex h-5 w-9 items-center rounded-full transition-colors duration-150 ${fabric.isPurchasable ? 'bg-primary' : 'bg-secondary/60'
                        }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-surface transition-transform duration-150 ${fabric.isPurchasable ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
            className="px-3 py-1 text-xs text-dim rounded-full hover:bg-default disabled:opacity-50 transition-colors duration-150"
          >
            Previous
          </button>
          <span className="text-xs text-dim">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="px-3 py-1 text-xs text-dim rounded-full hover:bg-default disabled:opacity-50 transition-colors duration-150"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
