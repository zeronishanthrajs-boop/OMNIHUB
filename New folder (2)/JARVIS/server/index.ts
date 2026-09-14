import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { authMiddleware } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.js";
import discordRouter from "./modules/messages/discordListener.js";
import instagramRouter from "./modules/messages/instagramListener.js";
import { initializeOfflineQueue } from "./modules/messages/offlineHandler.js";
import telegramRouter from "./modules/messages/telegramListener.js";
import whatsappRouter from "./modules/messages/whatsappListener.js";
import { claudeRouter } from "./routes/claude.js";
import { filesRouter } from "./routes/files.js";
import { getVenomStatus, integrationsRouter } from "./routes/integrations.js";
import { messagesRouter } from "./routes/messages.js";
import { voiceRouter } from "./routes/voice.js";
import { systemRouter } from "./routes/system.js";


dotenv.config();

export function createServer() {
  const app = express();
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: frontendUrl, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser(process.env.COOKIE_SECRET));
  void initializeOfflineQueue().catch((error) => {
    process.stderr.write(`[JARVIS] Offline queue initialization failed: ${String(error)}\n`);
  });
  app.use(authMiddleware);
  app.use(rateLimitMiddleware);

  app.get("/", (_request, response) => {
    response.redirect("/api/health");
  });

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "operational",
      version: "3.0.0",
      time: new Date().toISOString(),
      services: {
        express: "up",
        vite: "expected-on-3000",
        ollama: process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434",
        venom: getVenomStatus(),
        message_queue: "listening"
      },
      system: {
        uptime_seconds: Math.round(process.uptime()),
        memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    });
  });

  app.use("/api/claude", claudeRouter);
  app.use("/api/files", filesRouter);
  app.use("/api/voice", voiceRouter);
  app.use("/api/system", systemRouter);
  app.use("/api/integrations", integrationsRouter);
  app.use("/api", messagesRouter);
  app.use(discordRouter);
  app.use(whatsappRouter);
  app.use(instagramRouter);
  app.use(telegramRouter);
  app.get("/events", (_request, response) => {
    response.setHeader("Content-Type", "text/event-stream");
    response.write(`event: status\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  });
  return app;
}

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3001);
  const httpServer = createServer().listen(port, "127.0.0.1", () => {
    process.stdout.write(`JARVIS Elite backend listening on http://127.0.0.1:${port}\n`);
  });
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      process.stdout.write(
        [
          "",
          `[JARVIS] Port ${port} is already in use - backend is already running.`,
          "[JARVIS] If you need to restart: close the existing terminal window that started the backend, then run again.",
          `[JARVIS] Or run: npx kill-port ${port} - then restart.`,
          ""
        ].join("\n")
      );
      process.exit(0);
    }
    throw err;
  });
}
