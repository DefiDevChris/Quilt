/**
 * Lazy store accessors to break circular dependencies between Zustand stores.
 *
 * Problem: canvasStore needs projectStore's canvasWidth/canvasHeight for viewport
 * centering, but importing projectStore directly creates a circular module graph
 * when other files import both stores.
 *
 * Solution: This bridge module lazily resolves the store reference on first call,
 * avoiding the import-time circular dependency.
 */

interface ProjectDimensions {
  canvasWidth: number;
  canvasHeight: number;
}

type ProjectStoreAccessor = {
  getState: () => ProjectDimensions;
};

let _projectStore: ProjectStoreAccessor | null = null;

export function getProjectDimensions(): ProjectDimensions {
  if (!_projectStore) {
    // Dynamic require deferred to first call — module graph is fully resolved by then.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/stores/projectStore') as {
      useProjectStore: ProjectStoreAccessor;
    };
    _projectStore = mod.useProjectStore;
  }
  return _projectStore.getState();
}
