export interface ThreatEntry {
  category: "Spoofing" | "Tampering" | "Repudiation" | "Information Disclosure" | "Denial of Service" | "Elevation of Privilege";
  risk: string;
  mitigation: string;
}

export class ThreatModel {
  analyze(feature: string): ThreatEntry[] {
    return [
      { category: "Spoofing", risk: `${feature} may receive forged identity claims.`, mitigation: "Use signed httpOnly session cookies and connector token verification." },
      { category: "Tampering", risk: `${feature} data may be modified between client and server.`, mitigation: "Validate schemas on every route and log writes." },
      { category: "Repudiation", risk: "Operators may deny sensitive actions.", mitigation: "Write audit records for file, integration, and security operations." },
      { category: "Information Disclosure", risk: "Secrets may appear in prompts or logs.", mitigation: "Redact .env paths and token patterns before logging." },
      { category: "Denial of Service", risk: "Expensive scans may exhaust local resources.", mitigation: "Rate-limit and queue tier 4 jobs." },
      { category: "Elevation of Privilege", risk: "File tools may cross workspace boundaries.", mitigation: "Enforce pathGuard middleware and read-only defaults." }
    ];
  }
}
