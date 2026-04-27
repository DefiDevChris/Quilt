import { describe, it, expect, beforeEach } from 'vitest';
import { useLeftPanelStore } from '@/stores/leftPanelStore';

describe('leftPanelStore', () => {
  beforeEach(() => {
    useLeftPanelStore.setState({
      panelMode: 'none',
      layoutBrowserView: 'families',
      selectedFamily: null,
      selectedPresetId: null,
      previewCache: null,
      previewName: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useLeftPanelStore.getState();
      expect(state.panelMode).toBe('none');
      expect(state.layoutBrowserView).toBe('families');
      expect(state.selectedFamily).toBeNull();
      expect(state.selectedPresetId).toBeNull();
      expect(state.previewCache).toBeNull();
      expect(state.previewName).toBeNull();
    });
  });

  describe('openLayouts', () => {
    it('should set panel mode to layouts', () => {
      useLeftPanelStore.getState().openLayouts();
      const state = useLeftPanelStore.getState();
      expect(state.panelMode).toBe('layouts');
      expect(state.layoutBrowserView).toBe('families');
      expect(state.selectedFamily).toBeNull();
      expect(state.selectedPresetId).toBeNull();
    });

    it('should reset browser view and selections when opening layouts', () => {
      useLeftPanelStore.getState().drillIntoFamily('grid');
      useLeftPanelStore.getState().selectPreset('preset-1');
      useLeftPanelStore.getState().openLayouts();
      const state = useLeftPanelStore.getState();
      expect(state.layoutBrowserView).toBe('families');
      expect(state.selectedFamily).toBeNull();
      expect(state.selectedPresetId).toBeNull();
    });
  });

  describe('openTemplates', () => {
    it('should set panel mode to templates', () => {
      useLeftPanelStore.getState().openTemplates();
      const state = useLeftPanelStore.getState();
      expect(state.panelMode).toBe('templates');
    });
  });

  describe('openQuiltSetup', () => {
    it('should set panel mode to quilt-setup', () => {
      useLeftPanelStore.getState().openQuiltSetup();
      const state = useLeftPanelStore.getState();
      expect(state.panelMode).toBe('quilt-setup');
    });
  });

  describe('dismiss', () => {
    it('should reset all state to initial values', () => {
      const store = useLeftPanelStore.getState();
      store.openLayouts();
      store.drillIntoFamily('grid');
      store.selectPreset('preset-1');
      store.startPreview('{}', 'Test Preview');
      store.dismiss();
      const state = useLeftPanelStore.getState();
      expect(state.panelMode).toBe('none');
      expect(state.layoutBrowserView).toBe('families');
      expect(state.selectedFamily).toBeNull();
      expect(state.selectedPresetId).toBeNull();
      expect(state.previewCache).toBeNull();
      expect(state.previewName).toBeNull();
    });
  });

  describe('drillIntoFamily', () => {
    it('should set selected family and switch to presets view', () => {
      useLeftPanelStore.getState().drillIntoFamily('on-point');
      const state = useLeftPanelStore.getState();
      expect(state.selectedFamily).toBe('on-point');
      expect(state.layoutBrowserView).toBe('presets');
    });

    it('should allow drilling into different families', () => {
      useLeftPanelStore.getState().drillIntoFamily('grid');
      useLeftPanelStore.getState().drillIntoFamily('row');
      const state = useLeftPanelStore.getState();
      expect(state.selectedFamily).toBe('row');
    });
  });

  describe('backToFamilies', () => {
    it('should reset to families view and clear selections', () => {
      const store = useLeftPanelStore.getState();
      store.drillIntoFamily('grid');
      store.selectPreset('preset-1');
      store.startPreview('{}', 'Test');
      store.backToFamilies();
      const state = useLeftPanelStore.getState();
      expect(state.layoutBrowserView).toBe('families');
      expect(state.selectedFamily).toBeNull();
      expect(state.selectedPresetId).toBeNull();
      expect(state.previewCache).toBeNull();
      expect(state.previewName).toBeNull();
    });
  });

  describe('selectPreset', () => {
    it('should set selected preset ID', () => {
      useLeftPanelStore.getState().selectPreset('my-preset-123');
      const state = useLeftPanelStore.getState();
      expect(state.selectedPresetId).toBe('my-preset-123');
    });

    it('should allow changing selected preset', () => {
      useLeftPanelStore.getState().selectPreset('preset-1');
      useLeftPanelStore.getState().selectPreset('preset-2');
      const state = useLeftPanelStore.getState();
      expect(state.selectedPresetId).toBe('preset-2');
    });
  });

  describe('startPreview', () => {
    it('should store canvas JSON and name', () => {
      const json = '{"objects":[]}';
      const name = 'My Layout';
      useLeftPanelStore.getState().startPreview(json, name);
      const state = useLeftPanelStore.getState();
      expect(state.previewCache).toBe(json);
      expect(state.previewName).toBe(name);
    });
  });

  describe('applyPreview', () => {
    it('should clear preview cache and name', () => {
      const store = useLeftPanelStore.getState();
      store.startPreview('{}', 'Test');
      store.applyPreview();
      const state = useLeftPanelStore.getState();
      expect(state.previewCache).toBeNull();
      expect(state.previewName).toBeNull();
    });
  });

  describe('cancelPreview', () => {
    it('should clear preview and reset layout selections if in layouts mode', () => {
      const store = useLeftPanelStore.getState();
      store.openLayouts();
      store.drillIntoFamily('grid');
      store.selectPreset('preset-1');
      store.startPreview('{}', 'Test');
      store.cancelPreview();
      const state = useLeftPanelStore.getState();
      expect(state.previewCache).toBeNull();
      expect(state.previewName).toBeNull();
      expect(state.selectedPresetId).toBeNull();
      expect(state.layoutBrowserView).toBe('families');
      expect(state.selectedFamily).toBeNull();
    });

    it('should clear preview but keep other modes intact', () => {
      const store = useLeftPanelStore.getState();
      store.openTemplates();
      store.startPreview('{}', 'Test');
      store.selectPreset('preset-1');
      store.cancelPreview();
      const state = useLeftPanelStore.getState();
      expect(state.previewCache).toBeNull();
      expect(state.previewName).toBeNull();
      expect(state.selectedPresetId).toBeNull();
      expect(state.panelMode).toBe('templates');
    });
  });

  describe('state persistence across actions', () => {
    it('should maintain layout browser view when selecting preset', () => {
      const store = useLeftPanelStore.getState();
      store.drillIntoFamily('grid');
      store.selectPreset('preset-1');
      const state = useLeftPanelStore.getState();
      expect(state.layoutBrowserView).toBe('presets');
      expect(state.selectedFamily).toBe('grid');
      expect(state.selectedPresetId).toBe('preset-1');
    });
  });
});
