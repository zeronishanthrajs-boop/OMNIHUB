import type { NextFunction, Request, Response } from "express";
import path from "node:path";

const blocked = [
  "/etc",
  "/root",
  "/sys",
  "/proc",
  "C:\\Windows",
  "C:\\System32",
  ".env",
  ".env.local",
  ".env.production"
];

export function validateServerPath(input: string): boolean {
  const resolved = path.resolve(input);
  const lower = resolved.toLowerCase();
  return !blocked.some((item) => {
    const normalized = path.resolve(item).toLowerCase();
    return lower === normalized || lower.startsWith(`${normalized}${path.sep}`);
  });
}

export function pathGuard(request: Request, response: Response, next: NextFunction) {
  const raw = String(request.query.path ?? request.body?.path ?? "");
  if (raw && !validateServerPath(raw)) {
    response.status(403).json({ error: "Path blocked for security. Details →" });
    return;
  }
  next();
}
