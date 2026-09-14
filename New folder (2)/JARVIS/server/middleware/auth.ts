import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";

const cookieName = "jarvis_session";

export function authMiddleware(request: Request, response: Response, next: NextFunction) {
  const current = request.cookies?.[cookieName] as string | undefined;
  if (current && current.length >= 24) {
    next();
    return;
  }
  const token = crypto.randomBytes(24).toString("hex");
  response.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8
  });
  next();
}
