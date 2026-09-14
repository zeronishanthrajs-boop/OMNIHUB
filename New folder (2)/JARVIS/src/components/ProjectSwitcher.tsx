import type { ProjectContext, ProjectKey } from "../types";

interface ProjectSwitcherProps {
  projects: ProjectContext[];
  active: ProjectKey;
  onSwitch: (project: ProjectKey) => void;
}

export function ProjectSwitcher({ projects, active, onSwitch }: ProjectSwitcherProps) {
  return (
    <div className="project-switcher" aria-label="Project context switcher">
      {projects.map((project) => (
        <button key={project.key} className={project.key === active ? "active" : ""} onClick={() => onSwitch(project.key)}>
          {project.name}
        </button>
      ))}
    </div>
  );
}
