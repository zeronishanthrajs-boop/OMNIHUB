import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommandInput } from "../../src/components/CommandInput";
import "../../src/i18n";
import { TierRouter } from "../../src/modules/performance/TierRouter";
import { WakeWordEngine } from "../../src/modules/voice/WakeWordEngine";
import { CacheLayer } from "../../src/modules/performance/CacheLayer";
import { validatePath } from "../../src/utils/pathValidator";

describe("unit suite", () => {
  it("renders command input", () => {
    render(<CommandInput onSubmit={() => undefined} onVoice={() => undefined} />);
    expect(screen.getByLabelText("Ask JARVIS")).toBeInTheDocument();
  });

  it("shows interrupt control while streaming", () => {
    render(<CommandInput onSubmit={() => undefined} onVoice={() => undefined} onStop={() => undefined} busy />);
    expect(screen.getByLabelText("Stop response")).toBeInTheDocument();
  });

  it("classifies twenty sample queries", () => {
    const router = new TierRouter();
    const samples = [
      "hi",
      "status",
      "what is xss",
      "define csrf",
      "write a node snippet",
      "debug mongo timeout",
      "compare auth strategies",
      "design VENOM threat model",
      "architecture review",
      "audit this package",
      "explain",
      "fix this code",
      "CTF exploit chain",
      "SECTOR dashboard",
      "ZeroOps status",
      "supply chain risk",
      "simple answer",
      "long ".repeat(90),
      "security architecture",
      "hello Jarvis"
    ];
    expect(samples.map((sample) => router.classifyTier(sample))).toHaveLength(20);
    expect(router.classifyTier("design VENOM threat model")).toBe(4);
  });

  it("blocks forbidden paths", () => {
    expect(validatePath("C:\\Windows\\system32")).toBe(false);
    expect(validatePath(".env")).toBe(false);
    expect(validatePath("src\\App.tsx")).toBe(true);
  });

  it("cache layer stores and retrieves", async () => {
    const cache = new CacheLayer(60_000, 5);
    await cache.set("hello", "world");
    await expect(cache.get("hello")).resolves.toBe("world");
  });

  it("wake word accepts Jarvis and ignores product phrase", () => {
    const engine = new WakeWordEngine();
    engine.start();
    expect(engine.feedTranscript("Jarvis")).toBe(true);
    const secondEngine = new WakeWordEngine();
    secondEngine.start();
    expect(secondEngine.feedTranscript("hey jarvis")).toBe(true);
    const productEngine = new WakeWordEngine();
    productEngine.start();
    expect(productEngine.feedTranscript("jarvis pro")).toBe(false);
  });
});
