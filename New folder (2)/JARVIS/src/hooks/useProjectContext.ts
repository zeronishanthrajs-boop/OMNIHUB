import { useProjectStore } from "../store/projectStore";

export function useProjectContext() {
  return useProjectStore((state) => ({
    activeProject: state.activeProject,
    projects: state.projects,
    switchProject: state.switchProject
  }));
}
