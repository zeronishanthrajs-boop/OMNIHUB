import type { ClaudeStreamEvent, ProjectContext, Tier } from "../../types";

const userContext = `Name: Nishanth Raj S (CS)
Role: BCA 6th Semester Student | Co-founder & Full-Stack Developer at ZeroOps
Location: Bengaluru, Karnataka | Timezone: IST
Security mindset: audit, versioning, safe fallbacks.
Active projects: ZeroOps, VENOM, SECTOR, UniGate.`;

export class ClaudeClient {
  constructor(private readonly baseUrl = "/api/claude") {}

  async *streamQuery(
    query: string,
    tier: Tier,
    project: ProjectContext,
    options: { signal?: AbortSignal; streamId?: string } = {}
  ): AsyncGenerator<ClaudeStreamEvent> {
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
    const timeout = window.setTimeout(() => controller.abort(), this.timeoutFor(tier));
    try {
      const response = await fetch(`${this.baseUrl}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query,
          tier,
          projectKey: project.key,
          userContext,
          systemPrompt: project.prompt,
          streamId: options.streamId
        }),
        signal: controller.signal
      });
      
      // Clear connection timeout immediately once the response headers are received
      window.clearTimeout(timeout);

      if (!response.ok || !response.body) {
        yield { type: "error", value: `Local brain route returned ${response.status}` };
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        if (options.signal?.aborted) {
          yield { type: "aborted", value: "Response stopped." };
          return;
        }
        const chunk = await reader.read();
        done = chunk.done;
        const value = decoder.decode(chunk.value ?? new Uint8Array(), { stream: !done });
        if (value) {
          yield { type: "token", value };
        }
      }
      yield { type: "done", value: "" };
    } catch (error) {
      if (options.signal?.aborted || controller.signal.aborted) {
        yield { type: "aborted", value: "Response stopped." };
        return;
      }
      const message = error instanceof Error ? error.message : "Unknown local brain stream error";
      yield { type: "error", value: message.includes("abort") ? "Connection timed out. Retrying (2/3)..." : message };
    } finally {
      options.signal?.removeEventListener("abort", abortFromCaller);
      window.clearTimeout(timeout);
    }
  }

  async stopStream(streamId: string): Promise<void> {
    await fetch(`${this.baseUrl}/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ streamId })
    }).catch(() => undefined);
  }

  private timeoutFor(tier: Tier): number {
    return { 1: 180000, 2: 240000, 3: 300000, 4: 300000 }[tier];
  }
}

export const claudeClient = new ClaudeClient();
