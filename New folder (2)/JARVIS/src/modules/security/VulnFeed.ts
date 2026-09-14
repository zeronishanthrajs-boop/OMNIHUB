export interface VulnerabilityItem {
  id: string;
  packageName: string;
  severity: "critical" | "high" | "medium" | "low";
  summary: string;
}

export class VulnFeed {
  async query(packageName: string): Promise<VulnerabilityItem[]> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch("https://api.osv.dev/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: { name: packageName, ecosystem: "npm" } }),
        signal: controller.signal
      });
      if (!response.ok) return [];
      const data = (await response.json()) as { vulns?: Array<{ id: string; summary?: string }> };
      return (data.vulns ?? []).map((item) => ({
        id: item.id,
        packageName,
        severity: "medium",
        summary: item.summary ?? "OSV vulnerability entry"
      }));
    } catch {
      return [];
    } finally {
      window.clearTimeout(timer);
    }
  }
}
