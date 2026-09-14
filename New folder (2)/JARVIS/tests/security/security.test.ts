import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createServer } from "../../server/index";
import { validateServerPath } from "../../server/middleware/pathGuard";
import { SecurityAudit } from "../../src/modules/security/SecurityAudit";
import { validatePath } from "../../src/utils/pathValidator";

process.env.NODE_ENV = "test";

describe("security suite", () => {
  it("finds no source secrets", () => {
    const files = collect(path.resolve("src")).concat(collect(path.resolve("server")));
    const secretRegex = /(anthropic_[a-z0-9_-]{20,}|xox[baprs]-[a-z0-9-]{20,}|ghp_[a-z0-9]{20,})/i;
    const hits = files.filter((file) => secretRegex.test(fs.readFileSync(file, "utf8")));
    expect(hits).toEqual([]);
  });

  it("CORS allows localhost development origin", async () => {
    const response = await request(createServer()).get("/api/health").set("Origin", "http://localhost:3000").expect(200);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("path validators block forbidden paths", () => {
    expect(validatePath("/etc/passwd")).toBe(false);
    expect(validatePath(".env")).toBe(false);
    expect(validateServerPath(".env")).toBe(false);
  });

  it("audit scanner escapes script intent as finding", () => {
    const findings = new SecurityAudit().scanContent("src/example.tsx", "const x = '<script>alert(1)</script>';");
    expect(findings.length).toBe(0);
  });

  it("rate limiter returns 429 after excessive requests", async () => {
    const app = createServer();
    const calls = Array.from({ length: 103 }, () => request(app).get("/api/health"));
    const responses = await Promise.all(calls);
    expect(responses.some((response) => response.status === 429)).toBe(true);
  });
});

function collect(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(root, entry.name);
    return entry.isDirectory() ? collect(full) : full;
  });
}
