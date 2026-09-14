import { create } from "zustand";
import { contextManager } from "../modules/ai/ContextManager";
import type { ProjectContext, ProjectKey } from "../types";

interface ProjectState {
  activeKey: ProjectKey;
  projects: ProjectContext[];
  activeProject: ProjectContext;
  switchProject: (key: ProjectKey) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  activeKey: "jarvis",
  projects: contextManager.all(),
  activeProject: contextManager.get("jarvis"),
  switchProject: (key) =>
    set({
      activeKey: key,
      activeProject: contextManager.get(key)
    })
}));
