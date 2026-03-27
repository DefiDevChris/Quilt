import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '@/stores/projectStore';

function resetStore() {
  useProjectStore.setState({
    projectId: null,
    projectName: 'Untitled Quilt',
    saveStatus: 'saved',
    canvasWidth: 48,
    canvasHeight: 48,
    isDirty: false,
    lastSavedAt: null,
  });
}

describe('projectStore', () => {
  beforeEach(resetStore);

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
});
