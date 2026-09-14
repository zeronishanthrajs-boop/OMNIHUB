export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((stamp) => now - stamp < this.windowMs);
    if (recent.length >= this.maxRequests) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  remaining(key: string, now = Date.now()): number {
    const recent = (this.hits.get(key) ?? []).filter((stamp) => now - stamp < this.windowMs);
    return Math.max(0, this.maxRequests - recent.length);
  }
}
