import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { buildOfflineResponse, markResponded, queueMessage } from "./offlineHandler.js";

const router: Router = createRouter();

router.post("/webhook/discord", async (request: Request, response: Response) => {
  const from = String(request.body?.from ?? "").trim();
  const text = String(request.body?.text ?? "").trim();
  const isGroup = Boolean(request.body?.group || request.body?.guild_id);
  if (!from || !text || isGroup) {
    response.status(400).json({ error: "Discord personal DM payload required" });
    return;
  }

  const messageId = await queueMessage(from, "discord", text);
  const jarvisResponse = buildOfflineResponse(text);
  await markResponded(messageId, jarvisResponse);
  response.json({ status: "queued", message_id: messageId, jarvis_response: jarvisResponse });
});

export default router;
