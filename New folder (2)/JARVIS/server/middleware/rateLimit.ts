import type { NextFunction, Request, Response } from "express";

const hits = new Map<string, number[]>();

export function rateLimitMiddleware(request: Request, response: Response, next: NextFunction) {
  const key = request.ip || "local";
  const now = Date.now();
  const windowMs = 60_000;
  const max = 100;
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= max) {
    response.status(429).json({ error: "Rate limit reached. Queued. ~30s wait." });
    return;
  }
  recent.push(now);
  hits.set(key, recent);
  next();
}
