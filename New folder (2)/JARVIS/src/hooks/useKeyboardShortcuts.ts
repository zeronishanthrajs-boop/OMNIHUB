import { useEffect } from "react";
import type { ProjectKey } from "../types";

interface ShortcutHandlers {
  openPalette: () => void;
  submit: () => void;
  close: () => void;
  securityAudit: () => void;
  debugAssistant: () => void;
  profiler: () => void;
  switchProject: (project: ProjectKey) => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        handlers.openPalette();
      }
      if (mod && event.key === "Enter") handlers.submit();
      if (event.key === "Escape") handlers.close();
      if (event.key === "/") handlers.openPalette();
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") handlers.securityAudit();
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") handlers.debugAssistant();
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "p") handlers.profiler();
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "v") handlers.switchProject("venom");
      const projectMap: Record<string, ProjectKey> = { "1": "jarvis", "2": "zeroops", "3": "venom", "4": "sector", "5": "unigate" };
      if (event.ctrlKey && event.shiftKey && projectMap[event.key]) handlers.switchProject(projectMap[event.key]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
