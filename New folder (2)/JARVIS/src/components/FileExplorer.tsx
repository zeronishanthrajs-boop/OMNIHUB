import { FileText, FolderOpen, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { explainPathDecision, validatePath } from "../utils/pathValidator";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
}

export function FileExplorer() {
  const [path, setPath] = useState(".");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selected, setSelected] = useState<FileEntry | null>(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void load(path);
  }, [path]);

  const load = async (target: string) => {
    if (!validatePath(target)) {
      setStatus(explainPathDecision(target));
      return;
    }
    const response = await fetch(`/api/files/tree?path=${encodeURIComponent(target)}`, { credentials: "include" });
    const data = (await response.json()) as { entries: FileEntry[] };
    setEntries(data.entries ?? []);
  };

  const openFile = async (entry: FileEntry) => {
    setSelected(entry);
    if (entry.type === "directory") {
      setPath(entry.path);
      return;
    }
    const response = await fetch(`/api/files/read?path=${encodeURIComponent(entry.path)}`, { credentials: "include" });
    const data = (await response.json()) as { content: string; error?: string };
    setContent(data.error ?? data.content ?? "");
  };

  const save = async () => {
    if (!selected || !validatePath(selected.path)) {
      setStatus("Path blocked for security. Details →");
      return;
    }
    const response = await fetch("/api/files/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ path: selected.path, content })
    });
    setStatus(response.ok ? "Saved with audit log." : "Save failed.");
  };

  return (
    <section className="tool-grid">
      <aside className="file-tree">
        <div className="breadcrumb">{path}</div>
        {entries.map((entry) => (
          <button key={entry.path} onClick={() => void openFile(entry)}>
            {entry.type === "directory" ? <FolderOpen size={15} /> : <FileText size={15} />} {entry.name}
          </button>
        ))}
      </aside>
      <main className="editor-pane">
        <div className="editor-toolbar">
          <span>{selected?.path ?? "Select a file"}</span>
          <button onClick={() => void save()}><Save size={15} /> Save</button>
        </div>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} aria-label="Code editor" />
        {status && <small>{status}</small>}
      </main>
    </section>
  );
}
