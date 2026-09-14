import type { Tier } from "../../types";

const securityWords = ["threat", "stride", "architecture", "audit", "exploit", "cve", "venom", "sector"];
const multiStepWords = ["debug", "fix", "investigate", "compare", "design", "analyze"];
const simpleWords = ["hello", "hi", "status", "define", "what is", "time"];

export class TierRouter {
  private readonly cacheKeys = new Set<string>();

  markCached(query: string): void {
    this.cacheKeys.add(this.normalize(query));
  }

  classifyTier(query: string): Tier {
    const normalized = this.normalize(query);
    if (this.cacheKeys.has(normalized)) {
      return 1;
    }
    if (simpleWords.some((word) => normalized.includes(word)) && normalized.length < 120) {
      return 2;
    }
    if (securityWords.some((word) => normalized.includes(word))) {
      return 4;
    }
    if (multiStepWords.some((word) => normalized.includes(word)) || normalized.length > 240) {
      return 3;
    }
    return 2;
  }

  timeoutFor(tier: Tier): number {
    return { 1: 1000, 2: 5000, 3: 15000, 4: 30000 }[tier];
  }

  labelFor(tier: Tier): string {
    return { 1: "INSTANT", 2: "FAST", 3: "STANDARD", 4: "DEEP" }[tier];
  }

  private normalize(query: string): string {
    return query.trim().toLowerCase().replace(/\s+/g, " ");
  }
}

export const tierRouter = new TierRouter();
