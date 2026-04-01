import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '@/stores/projectStore';

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
  });

  it('sets project metadata', () => {
    useProjectStore.getState().setProject({
      id: 'abc-123',
      name: 'My Quilt',
      width: 60,
      height: 72,
    });

    const state = useProjectStore.getState();
    expect(state.projectId).toBe('abc-123');
    expect(state.projectName).toBe('My Quilt');
    expect(state.canvasWidth).toBe(60);
    expect(state.canvasHeight).toBe(72);
    expect(state.isDirty).toBe(false);
    expect(state.saveStatus).toBe('saved');
  });

  it('sets project name', () => {
    useProjectStore.getState().setProjectName('Renamed Quilt');
    expect(useProjectStore.getState().projectName).toBe('Renamed Quilt');
  });

  it('sets save status', () => {
    useProjectStore.getState().setSaveStatus('saving');
    expect(useProjectStore.getState().saveStatus).toBe('saving');
  });

  it('sets dirty flag', () => {
    useProjectStore.getState().setDirty(true);
    expect(useProjectStore.getState().isDirty).toBe(true);
  });

  it('sets canvas dimensions', () => {
    useProjectStore.getState().setCanvasDimensions(100, 120);
    expect(useProjectStore.getState().canvasWidth).toBe(100);
    expect(useProjectStore.getState().canvasHeight).toBe(120);
  });

  it('sets last saved timestamp', () => {
    const now = new Date();
    useProjectStore.getState().setLastSavedAt(now);
    expect(useProjectStore.getState().lastSavedAt).toBe(now);
  });

  it('resets to default state', () => {
    useProjectStore.getState().setProject({
      id: 'x',
      name: 'Test',
      width: 99,
      height: 99,
    });
    useProjectStore.getState().setDirty(true);
    useProjectStore.getState().reset();

    const state = useProjectStore.getState();
    expect(state.projectId).toBeNull();
    expect(state.projectName).toBe('Untitled Quilt');
    expect(state.canvasWidth).toBe(48);
    expect(state.isDirty).toBe(false);
  });

  describe('worktables', () => {
    it('starts with default worktable', () => {
      const state = useProjectStore.getState();
      expect(state.worktables).toHaveLength(1);
      expect(state.worktables[0]?.name).toBe('Main');
      expect(state.activeWorktableId).toBe('main');
    });

    it('adds worktable up to 10', () => {
      const store = useProjectStore.getState();
      store.addWorktable('Block 1');
      expect(useProjectStore.getState().worktables).toHaveLength(2);

      for (let i = 2; i < 10; i++) {
        store.addWorktable(`Block ${i}`);
      }
      expect(useProjectStore.getState().worktables).toHaveLength(10);

      const before = useProjectStore.getState().worktables.length;
      store.addWorktable('Should fail');
      expect(useProjectStore.getState().worktables.length).toBe(before);
    });

    it('cannot delete last worktable', () => {
      const store = useProjectStore.getState();
      const before = store.worktables.length;
      store.deleteWorktable('main');
      expect(useProjectStore.getState().worktables.length).toBe(before);
    });

    it('deletes worktable and switches active', () => {
      const store = useProjectStore.getState();
      store.addWorktable('Second');
      const secondId = useProjectStore.getState().worktables[1].id;

      store.deleteWorktable('main');
      expect(useProjectStore.getState().worktables).toHaveLength(1);
      expect(useProjectStore.getState().activeWorktableId).toBe(secondId);
    });

    it('renames worktable', () => {
      const store = useProjectStore.getState();
      store.renameWorktable('main', 'Quilt Top');
      expect(useProjectStore.getState().worktables[0]?.name).toBe('Quilt Top');
    });

    it('duplicates worktable', () => {
      const store = useProjectStore.getState();
      store.duplicateWorktable('main');
      expect(useProjectStore.getState().worktables).toHaveLength(2);
      expect(useProjectStore.getState().worktables[1]?.name).toBe('Main Copy');
    });

    it('does not duplicate beyond 10', () => {
      const store = useProjectStore.getState();
      for (let i = 0; i < 9; i++) {
        store.addWorktable(`Block ${i}`);
      }
      const before = useProjectStore.getState().worktables.length;
      store.duplicateWorktable('main');
      expect(useProjectStore.getState().worktables.length).toBe(before);
    });

    it('addWorktable marks dirty', () => {
      const store = useProjectStore.getState();
      store.addWorktable('New');
      expect(useProjectStore.getState().isDirty).toBe(true);
    });

    it('setWorktables sets worktables directly', () => {
      useProjectStore.getState().setWorktables([
        { id: 'w1', name: 'A', canvasData: {}, order: 0 },
        { id: 'w2', name: 'B', canvasData: {}, order: 1 },
      ]);
      expect(useProjectStore.getState().worktables).toHaveLength(2);
    });

    it('setActiveWorktableId changes active', () => {
      const store = useProjectStore.getState();
      store.addWorktable('Second');
      const secondId = useProjectStore.getState().worktables[1].id;
      store.setActiveWorktableId(secondId);
      expect(useProjectStore.getState().activeWorktableId).toBe(secondId);
    });

    it('updateWorktableCanvas updates canvas data', () => {
      const store = useProjectStore.getState();
      store.updateWorktableCanvas('main', { objects: [{ type: 'rect' }] });
      expect(useProjectStore.getState().worktables[0]?.canvasData).toEqual({ objects: [{ type: 'rect' }] });
    });
  });

  describe('fabricPresets', () => {
    it('adds fabric preset', () => {
      const store = useProjectStore.getState();
      store.addFabricPreset({ id: 'f1', name: 'Blue', imageUrl: '/blue.png' });
      expect(useProjectStore.getState().fabricPresets).toHaveLength(1);
    });

    it('does not add duplicate fabric preset', () => {
      const store = useProjectStore.getState();
      store.addFabricPreset({ id: 'f1', name: 'Blue', imageUrl: '/blue.png' });
      store.addFabricPreset({ id: 'f1', name: 'Blue', imageUrl: '/blue.png' });
      expect(useProjectStore.getState().fabricPresets).toHaveLength(1);
    });

    it('removes fabric preset', () => {
      const store = useProjectStore.getState();
      store.addFabricPreset({ id: 'f1', name: 'Blue', imageUrl: '/blue.png' });
      store.removeFabricPreset('f1');
      expect(useProjectStore.getState().fabricPresets).toHaveLength(0);
    });

    it('addFabricPreset marks dirty', () => {
      const store = useProjectStore.getState();
      store.addFabricPreset({ id: 'f1', name: 'Blue', imageUrl: '/blue.png' });
      expect(useProjectStore.getState().isDirty).toBe(true);
    });

    it('setFabricPresets sets presets directly', () => {
      useProjectStore.getState().setFabricPresets([
        { id: 'f1', name: 'A', imageUrl: '/a.png' },
      ]);
      expect(useProjectStore.getState().fabricPresets).toHaveLength(1);
    });
  });

  it('reset clears all state including worktables and fabricPresets', () => {
    const store = useProjectStore.getState();
    store.addWorktable('New');
    store.addFabricPreset({ id: 'f1', name: 'Blue', imageUrl: '/blue.png' });
    store.setProjectName('My Project');

    store.reset();
    const state = useProjectStore.getState();
    expect(state.worktables).toHaveLength(1);
    expect(state.fabricPresets).toHaveLength(0);
    expect(state.projectName).toBe('Untitled Quilt');
    expect(state.activeWorktableId).toBe('main');
  });

  it('setCanvasWidth and setCanvasHeight work', () => {
    useProjectStore.getState().setCanvasWidth(100);
    expect(useProjectStore.getState().canvasWidth).toBe(100);
    useProjectStore.getState().setCanvasHeight(200);
    expect(useProjectStore.getState().canvasHeight).toBe(200);
  });
});
