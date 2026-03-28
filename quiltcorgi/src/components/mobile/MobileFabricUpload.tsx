'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface MobileFabricUploadProps {
  onClose: () => void;
}

type UploadStep = 'pick' | 'details' | 'uploading' | 'done';

export function MobileFabricUpload({ onClose }: MobileFabricUploadProps) {
  const [step, setStep] = useState<UploadStep>('pick');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [collection, setCollection] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setName(selected.name.replace(/\.[^.]+$/, ''));
    setError(null);
    setStep('details');
  }

  async function handleUpload() {
    if (!file) return;

    setStep('uploading');
    setError(null);

    try {
      const presignRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          category: 'fabric',
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error ?? 'Failed to get upload URL');

      await fetch(presignData.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      await fetch('/api/fabrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || file.name,
          imageUrl: presignData.data.fileUrl,
          collection: collection || undefined,
        }),
      });

      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('details');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <button type="button" onClick={onClose} className="text-sm font-medium text-secondary">
          Cancel
        </button>
        <h1 className="text-base font-bold text-on-surface">Upload Fabric</h1>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {step === 'pick' && (
          <div className="flex flex-col items-center justify-center py-20">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-24 h-24 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--color-primary-golden-glow)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-golden)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <p className="text-sm font-semibold text-on-surface">Take a photo or choose from gallery</p>
            <p className="text-xs text-secondary mt-1">JPG, PNG, or WebP</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {step === 'details' && preview && (
          <div className="py-4">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface-container mb-6">
              <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Blue Floral Cotton"
                  className="w-full px-0 py-2 text-sm text-on-surface bg-transparent focus:outline-none"
                  style={{ borderBottom: '1.5px solid var(--color-outline-variant)' }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-primary-golden)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-outline-variant)'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Collection (optional)</label>
                <input
                  type="text"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  placeholder="e.g., Spring 2026"
                  className="w-full px-0 py-2 text-sm text-on-surface bg-transparent focus:outline-none"
                  style={{ borderBottom: '1.5px solid var(--color-outline-variant)' }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-primary-golden)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-outline-variant)'; }}
                />
              </div>
            </div>
            {error && <p className="text-sm text-error mt-4">{error}</p>}
            <button
              type="button"
              onClick={handleUpload}
              className="w-full mt-8 py-3 rounded-lg text-sm font-bold transition-all"
              style={{
                background: 'linear-gradient(145deg, var(--color-primary-golden), var(--color-primary-golden-light))',
                color: 'var(--color-primary-on)',
                boxShadow: 'var(--shadow-golden-glow)',
              }}
            >
              Save to Library
            </button>
          </div>
        )}

        {step === 'uploading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm text-secondary">Uploading...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'var(--color-primary-golden-glow)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-golden)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-on-surface">Fabric saved!</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 text-sm font-medium"
              style={{ color: 'var(--color-primary-golden)' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
