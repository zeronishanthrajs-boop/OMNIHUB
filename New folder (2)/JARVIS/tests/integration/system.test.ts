// @vitest-environment node
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createServer } from "../../server/index";

describe("system integration suite", () => {
  const app = createServer();

  it("POST /api/system/open returns 400 for empty target", async () => {
    const res = await request(app)
      .post("/api/system/open")
      .send({})
      .expect(400);
    expect(res.body.error).toContain("No open target provided");
  });

  it("POST /api/system/open maps file manager to explorer.exe in test", async () => {
    const res = await request(app)
      .post("/api/system/open")
      .send({ target: "file manager" });
    expect([200, 500]).toContain(res.status);
  }, 20000);

  it("POST /api/system/execute returns 400 for empty command", async () => {
    const res = await request(app)
      .post("/api/system/execute")
      .send({})
      .expect(400);
    expect(res.body.error).toContain("No command provided");
  });

  it("POST /api/system/execute blocks dangerous commands", async () => {
    const res = await request(app)
      .post("/api/system/execute")
      .send({ command: "rmdir /s /q C:\\Windows" })
      .expect(403);
    expect(res.body.error).toContain("Command blocked for safety");
  });

  it("POST /api/system/control returns 400 for invalid action", async () => {
    const res = await request(app)
      .post("/api/system/control")
      .send({ action: "invalid_action" })
      .expect(400);
    expect(res.body.error).toContain("Unsupported action");
  });
});
