import { Search } from "lucide-react";
import type { ProjectKey } from "../types";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  onProject: (project: ProjectKey) => void;
}

export function CommandPalette({ open, onClose, onAction, onProject }: CommandPaletteProps) {
  if (!open) return null;
  return (
    <div className="modal-layer">
      <div className="command-palette">
        <div className="palette-search"><Search size={16} /><span>Type a command or shortcut</span></div>
        {["Security Audit", "Debug Assistant", "Performance Profiler", "File Explorer", "Browser Access"].map((item) => (
          <button key={item} onClick={() => onAction(item)}>{item}</button>
        ))}
        {(["jarvis", "zeroops", "venom", "sector", "unigate"] as ProjectKey[]).map((project) => (
          <button key={project} onClick={() => onProject(project)}>Switch to {project.toUpperCase()}</button>
        ))}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
