import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import {
  buildOfflineResponse,
  clearQueue,
  getPendingMessages,
  markResponded,
  queueMessage,
  type MessageChannel
} from "../modules/messages/offlineHandler.js";

const channels = new Set<MessageChannel>(["discord", "whatsapp", "instagram", "telegram"]);

export const messagesRouter: Router = createRouter();

messagesRouter.post("/message/receive", async (request: Request, response: Response) => {
  const parsed = parseIncomingMessage(request.body);
  if (!parsed) {
    response.status(400).json({ error: "Missing or invalid from, channel, or text" });
    return;
  }

  try {
    const messageId = await queueMessage(parsed.from, parsed.channel, parsed.text);
    const jarvisResponse = buildOfflineResponse(parsed.text);
    await markResponded(messageId, jarvisResponse);
    response.json({
      status: "queued",
      message_id: messageId,
      jarvis_response: jarvisResponse
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "message handling failed";
    response.status(500).json({ error: message });
  }
});

messagesRouter.get("/message/pending", async (_request: Request, response: Response) => {
  try {
    const messages = await getPendingMessages();
    response.json({ count: messages.length, messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "query failed";
    response.status(500).json({ error: message });
  }
});

messagesRouter.delete("/message/clear", async (_request: Request, response: Response) => {
  try {
    await clearQueue();
    response.json({ status: "cleared" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "clear failed";
    response.status(500).json({ error: message });
  }
});

export function parseIncomingMessage(body: unknown): { from: string; channel: MessageChannel; text: string } | null {
  if (!body || typeof body !== "object") return null;
  const payload = body as Record<string, unknown>;
  const from = String(payload.from ?? "").trim();
  const channel = String(payload.channel ?? "").trim() as MessageChannel;
  const text = String(payload.text ?? "").trim();
  if (!from || !text || !channels.has(channel)) return null;
  return { from, channel, text };
}
