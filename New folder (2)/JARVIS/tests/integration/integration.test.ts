// @vitest-environment node
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createServer } from "../../server/index";
import { contextManager } from "../../src/modules/ai/ContextManager";

process.env.NODE_ENV = "test";

describe("integration suite", () => {
  const app = createServer();

  it("local brain route succeeds in test fallback mode", async () => {
    const response = await request(app)
      .post("/api/claude/stream")
      .send({ query: "status", tier: 2, projectKey: "zeroops", userContext: "test", systemPrompt: "test" })
      .expect(200);
    expect(response.text).toContain("JARVIS System Status");
  });

  it("local brain stop route accepts active stream ids", async () => {
    const response = await request(app)
      .post("/api/claude/stop")
      .send({ streamId: "test-stream" })
      .expect(200);
    expect(response.body).toEqual({ stopped: false, streamId: "test-stream" });
  });

  it("local brain route falls back cleanly and quickly when Ollama is offline", async () => {
    // Temporarily set NODE_ENV to non-test to force useOllama path
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    // Override OLLAMA_HOST to a dead port so Phase 1 probe always fails fast
    process.env.OLLAMA_HOST = "http://127.0.0.1:19999";

    const startTime = Date.now();
    const response = await request(app)
      .post("/api/claude/stream")
      .send({ query: "status", tier: 2, projectKey: "zeroops", userContext: "test", systemPrompt: "test" })
      .expect(200);
    const duration = Date.now() - startTime;

    // Restore environment
    process.env.NODE_ENV = prevNodeEnv;
    delete process.env.OLLAMA_HOST;

    expect(response.text).toContain("JARVIS System Status");
    // Phase 1 probe fired on dead port — offline fallback triggered
    expect(response.text).toMatch(/offline|Tried routing to local Ollama/i);
    // Must resolve fast — 1.5s probe abort + smart response stream
    expect(duration).toBeLessThan(4500);
  });

  it("VENOM connector reads folder status", async () => {
    const response = await request(app).get("/api/integrations/venom/findings").expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("file explorer loads directory tree", async () => {
    const response = await request(app).get("/api/files/tree").query({ path: "." }).expect(200);
    expect(Array.isArray(response.body.entries)).toBe(true);
  });

  it("voice route completes STT to TTS mock path", async () => {
    const stt = await request(app).post("/api/voice/stt").send({ transcript: "Jarvis status" }).expect(200);
    const tts = await request(app).post("/api/voice/tts").send({ text: stt.body.text }).expect(200);
    expect(tts.body.chunks.length).toBeGreaterThan(0);
  });

  it("project context loads per project", () => {
    expect(contextManager.get("venom").name).toBe("VENOM");
    expect(contextManager.get("unigate").stack).toContain("Express");
  });

  it("keyboard shortcut targets are represented", () => {
    const projects = contextManager.all().map((project) => project.key);
    expect(projects).toEqual(["jarvis", "zeroops", "venom", "sector", "unigate"]);
  });
});
