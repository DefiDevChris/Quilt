import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSketchbookStore } from '@/stores/sketchbookStore';

describe('sketchbookStore', () => {
  beforeEach(() => {
    useSketchbookStore.setState({
      variations: [],
      activeVariationId: null,
      isPanelOpen: false,
      isLoading: false,
      isSaving: false,
      compareMode: false,
      compareVariationId: null,
    });
    vi.restoreAllMocks();
  });

  describe('panel toggle', () => {
    it('starts with panel closed', () => {
      expect(useSketchbookStore.getState().isPanelOpen).toBe(false);
    });

    it('toggles panel open and closed', () => {
      useSketchbookStore.getState().togglePanel();
      expect(useSketchbookStore.getState().isPanelOpen).toBe(true);
      useSketchbookStore.getState().togglePanel();
      expect(useSketchbookStore.getState().isPanelOpen).toBe(false);
    });

    it('sets panel open directly', () => {
      useSketchbookStore.getState().setPanelOpen(true);
      expect(useSketchbookStore.getState().isPanelOpen).toBe(true);
      useSketchbookStore.getState().setPanelOpen(false);
      expect(useSketchbookStore.getState().isPanelOpen).toBe(false);
    });
  });

  describe('active variation', () => {
    it('starts with no active variation', () => {
      expect(useSketchbookStore.getState().activeVariationId).toBeNull();
    });

    it('sets active variation id', () => {
      useSketchbookStore.getState().setActiveVariation('var-1');
      expect(useSketchbookStore.getState().activeVariationId).toBe('var-1');
    });

    it('changes active variation', () => {
      useSketchbookStore.getState().setActiveVariation('var-1');
      useSketchbookStore.getState().setActiveVariation('var-2');
      expect(useSketchbookStore.getState().activeVariationId).toBe('var-2');
    });
  });

  describe('compare mode', () => {
    it('starts with compare mode off', () => {
      expect(useSketchbookStore.getState().compareMode).toBe(false);
      expect(useSketchbookStore.getState().compareVariationId).toBeNull();
    });

    it('enables compare mode with a variation id', () => {
      useSketchbookStore.getState().setCompareMode(true, 'var-2');
      expect(useSketchbookStore.getState().compareMode).toBe(true);
      expect(useSketchbookStore.getState().compareVariationId).toBe('var-2');
    });

    it('disables compare mode and clears compare id', () => {
      useSketchbookStore.getState().setCompareMode(true, 'var-2');
      useSketchbookStore.getState().setCompareMode(false);
      expect(useSketchbookStore.getState().compareMode).toBe(false);
      expect(useSketchbookStore.getState().compareVariationId).toBeNull();
    });
  });

  describe('loadVariations', () => {
    it('sets isLoading during fetch', async () => {
      const mockVariations = [
        { id: 'v1', name: 'Variation 1', canvasData: {}, thumbnailUrl: null, createdAt: new Date().toISOString() },
      ];

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: mockVariations }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const promise = useSketchbookStore.getState().loadVariations('proj-1');
      expect(useSketchbookStore.getState().isLoading).toBe(true);

      await promise;
      expect(useSketchbookStore.getState().isLoading).toBe(false);
      expect(useSketchbookStore.getState().variations).toHaveLength(1);
      expect(useSketchbookStore.getState().variations[0].name).toBe('Variation 1');
    });

    it('handles fetch failure gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await useSketchbookStore.getState().loadVariations('proj-1');
      expect(useSketchbookStore.getState().isLoading).toBe(false);
      expect(useSketchbookStore.getState().variations).toEqual([]);
    });
  });

  describe('saveVariation', () => {
    it('adds new variation to the list', async () => {
      const newVar = {
        id: 'v-new',
        name: 'My Design',
        canvasData: { objects: [] },
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: newVar }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await useSketchbookStore.getState().saveVariation('proj-1', 'My Design', { objects: [] });
      expect(useSketchbookStore.getState().variations).toHaveLength(1);
      expect(useSketchbookStore.getState().variations[0].name).toBe('My Design');
      expect(useSketchbookStore.getState().isSaving).toBe(false);
    });

    it('sets isSaving during save', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { id: 'v1', name: 'V', canvasData: {}, thumbnailUrl: null, createdAt: new Date().toISOString() } }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const promise = useSketchbookStore.getState().saveVariation('proj-1', 'V', {});
      expect(useSketchbookStore.getState().isSaving).toBe(true);

      await promise;
      expect(useSketchbookStore.getState().isSaving).toBe(false);
    });
  });

  describe('deleteVariation', () => {
    it('removes variation from list', async () => {
      useSketchbookStore.setState({
        variations: [
          { id: 'v1', projectId: 'p1', userId: 'u1', name: 'V1', canvasData: {}, thumbnailUrl: null, createdAt: new Date() },
          { id: 'v2', projectId: 'p1', userId: 'u1', name: 'V2', canvasData: {}, thumbnailUrl: null, createdAt: new Date() },
        ],
      });

      global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

      await useSketchbookStore.getState().deleteVariation('proj-1', 'v1');
      expect(useSketchbookStore.getState().variations).toHaveLength(1);
      expect(useSketchbookStore.getState().variations[0].id).toBe('v2');
    });

    it('clears active variation if deleted variation was active', async () => {
      useSketchbookStore.setState({
        variations: [
          { id: 'v1', projectId: 'p1', userId: 'u1', name: 'V1', canvasData: {}, thumbnailUrl: null, createdAt: new Date() },
        ],
        activeVariationId: 'v1',
      });

      global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

      await useSketchbookStore.getState().deleteVariation('proj-1', 'v1');
      expect(useSketchbookStore.getState().activeVariationId).toBeNull();
    });
  });

  describe('renameVariation', () => {
    it('updates variation name in list', async () => {
      useSketchbookStore.setState({
        variations: [
          { id: 'v1', projectId: 'p1', userId: 'u1', name: 'Old Name', canvasData: {}, thumbnailUrl: null, createdAt: new Date() },
        ],
      });

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { id: 'v1', name: 'New Name' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await useSketchbookStore.getState().renameVariation('proj-1', 'v1', 'New Name');
      expect(useSketchbookStore.getState().variations[0].name).toBe('New Name');
    });
  });

  describe('duplicateVariation', () => {
    it('adds duplicated variation to list', async () => {
      useSketchbookStore.setState({
        variations: [
          { id: 'v1', projectId: 'p1', userId: 'u1', name: 'Original', canvasData: { data: 1 }, thumbnailUrl: null, createdAt: new Date() },
        ],
      });

      const duplicated = {
        id: 'v2',
        name: 'Original (Copy)',
        canvasData: { data: 1 },
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: duplicated }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await useSketchbookStore.getState().duplicateVariation('proj-1', 'v1');
      expect(useSketchbookStore.getState().variations).toHaveLength(2);
      expect(useSketchbookStore.getState().variations[1].name).toBe('Original (Copy)');
    });
  });
});
