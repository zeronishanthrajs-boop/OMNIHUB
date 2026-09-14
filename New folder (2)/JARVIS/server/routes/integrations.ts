import type { FSWatcher } from "chokidar";
import type { Router } from "express";
import { Router as createRouter } from "express";
import chokidar from "chokidar";
import fs from "node:fs/promises";

export const integrationsRouter: Router = createRouter();
let venomWatcher: FSWatcher | null = null;
let venomPath = "";
let venomLastScan = new Date().toISOString();
const venomFindings: Array<{ id: string; severity: "low"; title: string; file: string; at: string }> = [];

integrationsRouter.get("/venom/health", (_request, response) => {
  response.json({
    status: getVenomStatus(),
    watchers: venomWatcher ? 1 : 0,
    path: venomPath || null,
    cached: !process.env.VENOM_API_URL,
    scan_results: {
      last_scan: venomLastScan,
      findings: venomFindings.slice(-10)
    }
  });
});

integrationsRouter.get("/venom/findings", async (_request, response) => {
  const folder = venomPath || process.env.VENOM_FOLDER_PATH || process.cwd();
  if (!folder) {
    response.json(venomFindings);
    return;
  }
  try {
    const files = await fs.readdir(folder);
    response.json([
      ...venomFindings.slice(-10),
      ...files.slice(0, 10).map((file, index) => ({ id: `venom-${index}`, severity: "low", title: `Indexed ${file}`, file }))
    ]);
  } catch {
    response.json(venomFindings);
  }
});

integrationsRouter.post("/venom/analysis", (request, response) => {
  response.json({ accepted: Boolean(request.body?.summary), at: new Date().toISOString() });
});

integrationsRouter.post("/venom/watch", (request, response) => {
  const folder = String(request.body?.path ?? process.env.VENOM_FOLDER_PATH ?? process.cwd());
  void venomWatcher?.close();
  venomPath = folder;
  venomLastScan = new Date().toISOString();
  venomWatcher = chokidar.watch(folder, {
    depth: 4,
    ignoreInitial: true,
    ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/logs/**"]
  });
  venomWatcher.on("all", (event, file) => {
    venomLastScan = new Date().toISOString();
    venomFindings.push({
      id: `venom-${Date.now()}`,
      severity: "low",
      title: `Observed ${event}`,
      file,
      at: venomLastScan
    });
    if (venomFindings.length > 100) venomFindings.shift();
  });
  response.json({ status: "watching", watching: true, watchers: 1, path: folder });
});

integrationsRouter.get("/github/repositories", (_request, response) => response.json(["zeroops", "venom", "sector", "unigate"]));
integrationsRouter.get("/asana/tasks", (_request, response) => response.json(["Review VENOM findings", "Ship JARVIS Elite"]));
integrationsRouter.get("/slack/channels", (_request, response) => response.json(["#zeroops", "#security", "#jarvis"]));

integrationsRouter.post("/browser/screenshot", async (request, response) => {
  const url = String(request.body?.url ?? "https://zeroops.in");
  const safeUrl = /^https?:\/\//.test(url) ? url : `https://${url}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const upstream = await fetch(safeUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 JARVIS-Elite" }
    });
    const html = await upstream.text();
    const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() ?? safeUrl;
    const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? "Captured page snapshot.";
    const links = Array.from(html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)).map((match) => match[1]);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><rect width="900" height="520" fill="#050A14"/><text x="40" y="80" fill="#00D4FF" font-family="monospace" font-size="28">${escapeXml(title)}</text><text x="40" y="130" fill="#E8F4FF" font-family="monospace" font-size="16">${escapeXml(safeUrl)}</text><text x="40" y="180" fill="#4A6FA5" font-family="monospace" font-size="14">${escapeXml(description.slice(0, 120))}</text></svg>`;
    response.json({ url: safeUrl, title, description, links, imageDataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, capturedAt: new Date().toISOString() });
  } catch {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><rect width="900" height="520" fill="#050A14"/><text x="40" y="80" fill="#FF3D3D" font-family="monospace" font-size="24">Offline capture fallback</text></svg>`;
    response.json({ url: safeUrl, title: "Offline", description: "You're offline. Cached responses only.", links: [], imageDataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, capturedAt: new Date().toISOString() });
  } finally {
    clearTimeout(timer);
  }
});

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[char] ?? char);
}

export function getVenomStatus() {
  if (venomWatcher) return "watching";
  return process.env.VENOM_API_URL ? "healthy" : "ready";
}
