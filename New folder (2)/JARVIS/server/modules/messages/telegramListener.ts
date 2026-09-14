import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { buildOfflineResponse, markResponded, queueMessage } from "./offlineHandler.js";

const router: Router = createRouter();

router.post("/webhook/telegram", async (request: Request, response: Response) => {
  const from = String(request.body?.from ?? "").trim();
  const text = String(request.body?.text ?? "").trim();
  const chatType = String(request.body?.chat_type ?? "private").trim();
  if (!from || !text || chatType !== "private") {
    response.status(400).json({ error: "Telegram private DM payload required" });
    return;
  }

  const messageId = await queueMessage(from, "telegram", text);
  const jarvisResponse = buildOfflineResponse(text);
  await markResponded(messageId, jarvisResponse);
  response.json({ status: "queued", message_id: messageId, jarvis_response: jarvisResponse });
});

export default router;
