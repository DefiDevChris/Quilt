'use client';

import { create } from 'zustand';
import type {
  MobileUpload,
  MobileUploadStatus,
  MobileUploadAssignedType,
} from '@/types/mobile-upload';

interface MobileUploadState {
  uploads: MobileUpload[];
  isLoading: boolean;
  error: string | null;

  fetchUploads: (status?: MobileUploadStatus) => Promise<void>;
  createUpload: (
    imageUrl: string,
    originalFilename?: string,
    fileSizeBytes?: number
  ) => Promise<MobileUpload | null>;
  updateType: (id: string, assignedType: MobileUploadAssignedType) => Promise<void>;
  processUpload: (
    id: string,
    assignedType: 'fabric' | 'block' | 'quilt'
  ) => Promise<{ redirectAction: string } | null>;
  completeUpload: (id: string, entityId: string, entityType: string) => Promise<void>;
  deleteUpload: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  uploads: [] as MobileUpload[],
  isLoading: false,
  error: null as string | null,
};

export const useMobileUploadStore = create<MobileUploadState>((set, get) => ({
  ...initialState,

  fetchUploads: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('limit', '50');

      const res = await fetch(`/api/mobile-uploads?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server returned ${res.status}`);
      }

      const { data } = await res.json();
      set({ uploads: data.uploads, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch uploads',
        isLoading: false,
      });
    }
  },

  createUpload: async (imageUrl, originalFilename, fileSizeBytes) => {
    set({ error: null });
    try {
      const res = await fetch('/api/mobile-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, originalFilename, fileSizeBytes }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server returned ${res.status}`);
      }

      const { data } = await res.json();
      const upload = data as MobileUpload;
      set({ uploads: [upload, ...get().uploads] });
      return upload;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create upload' });
      return null;
    }
  },

  updateType: async (id, assignedType) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/mobile-uploads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedType }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server returned ${res.status}`);
      }

      const { data } = await res.json();
      set({
        uploads: get().uploads.map((u) => (u.id === id ? (data as MobileUpload) : u)),
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update upload' });
    }
  },

  processUpload: async (id, assignedType) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/mobile-uploads/${id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedType }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server returned ${res.status}`);
      }

      const { data } = await res.json();
      set({
        uploads: get().uploads.map((u) =>
          u.id === id ? { ...u, status: 'processing' as const, assignedType } : u
        ),
      });
      return { redirectAction: data.redirectAction };
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to process upload' });
      return null;
    }
  },

  completeUpload: async (id, entityId, entityType) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/mobile-uploads/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processedEntityId: entityId, processedEntityType: entityType }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server returned ${res.status}`);
      }

      // Remove completed upload from the list
      set({ uploads: get().uploads.filter((u) => u.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to complete upload' });
    }
  },

  deleteUpload: async (id) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/mobile-uploads/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server returned ${res.status}`);
      }

      set({ uploads: get().uploads.filter((u) => u.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete upload' });
    }
  },

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState }),
}));
