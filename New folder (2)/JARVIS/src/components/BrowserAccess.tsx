import { Camera, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { BrowserSnapshot } from "../types";

export function BrowserAccess() {
  const [url, setUrl] = useState("https://zeroops.in");
  const [snapshot, setSnapshot] = useState<BrowserSnapshot | null>(null);
  const [busy, setBusy] = useState(false);

  const capture = async () => {
    setBusy(true);
    const response = await fetch("/api/integrations/browser/screenshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url })
    });
    setSnapshot((await response.json()) as BrowserSnapshot);
    setBusy(false);
  };

  return (
    <section className="browser-access">
      <div className="form-row">
        <input aria-label="URL" value={url} onChange={(event) => setUrl(event.target.value)} />
        <button onClick={() => void capture()}><Camera size={16} /> Capture</button>
      </div>
      {busy && <p>Loading page with 30-second timeout...</p>}
      {snapshot && (
        <article>
          <h3><ExternalLink size={16} /> {snapshot.title}</h3>
          <img src={snapshot.imageDataUrl} alt={`Snapshot of ${snapshot.url}`} />
          <p>{snapshot.description}</p>
          <ul>{snapshot.links.slice(0, 8).map((link) => <li key={link}>{link}</li>)}</ul>
        </article>
      )}
    </section>
  );
}
