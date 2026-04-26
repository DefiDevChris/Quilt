import { create } from 'zustand';

type StudioMode = 'template' | 'layout' | 'freeform';

interface ProjectConfig {
  mode: StudioMode | null;
  width: number;
  height: number;
  templateId?: string;
  fabricIds: string[];
  isLocked: boolean;
}

interface ProjectState extends ProjectConfig {
  setProject: (config: ProjectConfig) => void;
  reset: () => void;
}

const DEFAULT: ProjectConfig = {
  mode: null,
  width: 60,
  height: 80,
  templateId: undefined,
  fabricIds: [],
  isLocked: false,
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...DEFAULT,
  setProject: (config) => set(config),
  reset: () => set(DEFAULT),
}));
