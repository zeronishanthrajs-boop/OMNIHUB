import type { Router } from "express";
import { Router as createRouter } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { pathGuard, validateServerPath } from "../middleware/pathGuard.js";

export const filesRouter: Router = createRouter();

filesRouter.use(pathGuard);

filesRouter.get("/tree", async (request, response) => {
  const target = path.resolve(String(request.query.path ?? "."));
  try {
    const stats = await fs.stat(target);
    const directory = stats.isDirectory() ? target : path.dirname(target);
    const entries = await fs.readdir(directory, { withFileTypes: true });
    response.json({
      entries: entries.slice(0, 200).map((entry) => ({
        name: entry.name,
        path: path.join(directory, entry.name),
        type: entry.isDirectory() ? "directory" : "file",
        size: 0
      }))
    });
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Directory read failed" });
  }
});

filesRouter.get("/read", async (request, response) => {
  const target = path.resolve(String(request.query.path ?? ""));
  if (!validateServerPath(target)) {
    response.status(403).json({ error: "Path blocked for security. Details →" });
    return;
  }
  try {
    const content = await fs.readFile(target, "utf8");
    response.json({ content });
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "File read failed" });
  }
});

filesRouter.post("/write", async (request, response) => {
  const target = path.resolve(String(request.body.path ?? ""));
  if (!validateServerPath(target)) {
    response.status(403).json({ error: "Path blocked for security. Details →" });
    return;
  }
  try {
    await fs.writeFile(target, String(request.body.content ?? ""), "utf8");
    response.json({ ok: true, path: target, at: new Date().toISOString() });
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "File write failed" });
  }
});
