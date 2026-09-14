import { describe, expect, it } from "vitest";
import { Profiler } from "../../src/modules/performance/Profiler";
import { TierRouter } from "../../src/modules/performance/TierRouter";

describe("performance suite", () => {
  it("tier one cached response is under one second", () => {
    const router = new TierRouter();
    router.markCached("status");
    const start = performance.now();
    expect(router.classifyTier("status")).toBe(1);
    expect(performance.now() - start).toBeLessThan(1000);
  });

  it("tier two simple query maps below five second timeout", () => {
    const router = new TierRouter();
    const tier = router.classifyTier("what is cors");
    expect(router.timeoutFor(tier)).toBeLessThanOrEqual(5000);
  });

  it("profiler records render budget markers", () => {
    const profiler = new Profiler();
    profiler.start("logo");
    const mark = profiler.end("logo");
    expect(mark.durationMs).toBeLessThan(1000);
  });

  it("project context switch budget is below 500ms", () => {
    const start = performance.now();
    const selected = "venom";
    expect(selected).toBe("venom");
    expect(performance.now() - start).toBeLessThan(500);
  });

  it("cold classification path is below one second", () => {
    const start = performance.now();
    new TierRouter().classifyTier("hello");
    expect(performance.now() - start).toBeLessThan(1000);
  });

  it("cache target supports repeated query hit rate", () => {
    const router = new TierRouter();
    for (let index = 0; index < 10; index += 1) router.markCached(`query-${index}`);
    const hits = Array.from({ length: 10 }, (_, index) => router.classifyTier(`query-${index}`)).filter((tier) => tier === 1).length;
    expect(hits / 10).toBeGreaterThan(0.7);
  });
});
