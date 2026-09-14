import type { Router } from "express";
import { Router as createRouter } from "express";

export const voiceRouter: Router = createRouter();

voiceRouter.post("/stt", (request, response) => {
  const transcript = String(request.body?.transcript ?? "");
  response.json({ text: transcript, confidence: transcript ? 0.92 : 0, durationMs: 120 });
});

voiceRouter.post("/tts", (request, response) => {
  const text = String(request.body?.text ?? "");
  response.json({ chunks: text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text], voice: /[\u0D00-\u0D7F]/.test(text) ? "ml-IN" : "en-IN" });
});
