import { randomUUID } from "node:crypto";
import path from "node:path";
import { spawn } from "node:child_process";

export type MessageChannel = "discord" | "whatsapp" | "instagram" | "telegram";

export interface OfflineMessage {
  id: string;
  from: string;
  channel: MessageChannel;
  text: string;
  timestamp: number;
  jarvis_response?: string | null;
  responded: boolean;
}

const OFFLINE_QUEUE_DB = path.join(process.cwd(), "memory", "offline_queue.db");
const STORE_SCRIPT = path.join(process.cwd(), "server", "modules", "messages", "offline_store.py");
const PYTHON = process.env.PYTHON ?? "python";

function runStore<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, [STORE_SCRIPT, action, OFFLINE_QUEUE_DB], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `offline store exited ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout || "{}") as T);
      } catch (error) {
        reject(error);
      }
    });

    child.stdin.end(payload ? JSON.stringify(payload) : "");
  });
}

export async function initializeOfflineQueue(): Promise<void> {
  await runStore<{ ok: boolean }>("init");
}

export async function queueMessage(from: string, channel: MessageChannel, text: string): Promise<string> {
  const id = randomUUID();
  await runStore<{ id: string }>("queue", {
    id,
    from,
    channel,
    text,
    timestamp: Date.now()
  });
  return id;
}

export async function getPendingMessages(): Promise<OfflineMessage[]> {
  const result = await runStore<{ messages: OfflineMessage[] }>("pending");
  return result.messages;
}

export async function markResponded(messageId: string, jarvisResponse: string): Promise<void> {
  await runStore<{ ok: boolean }>("mark", {
    id: messageId,
    jarvis_response: jarvisResponse
  });
}

export async function clearQueue(): Promise<void> {
  await runStore<{ ok: boolean }>("clear");
}

export function buildOfflineResponse(text: string): string {
  const normalized = text.trim().toLowerCase();
  if (/zeroops|unigate|venom|sector|status|health|jarvis/.test(normalized)) {
    return `Nishanth is offline, but I can help from local context: I received "${text}" and stored it in the offline queue.`;
  }
  return `Nishanth is offline. I'll let him know you asked: ${text}`;
}
