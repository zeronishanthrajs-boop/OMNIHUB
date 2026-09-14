import { BaseConnector } from "./BaseConnector";

export interface VenomFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  file: string;
}

export class VenomConnector extends BaseConnector {
  readonly capabilities = [
    "read_security_findings",
    "query_venom_status",
    "push_threat_analysis",
    "watch_folder_changes",
    "index_codebase_for_context"
  ];

  constructor(baseUrl = "/api/integrations/venom") {
    super("VENOM", baseUrl);
  }

  async readSecurityFindings(): Promise<VenomFinding[]> {
    return this.request<VenomFinding[]>({ path: "/findings", timeoutMs: 6000 });
  }

  async pushThreatAnalysis(summary: string): Promise<{ accepted: boolean }> {
    return this.request<{ accepted: boolean }>({ path: "/analysis", method: "POST", body: { summary }, timeoutMs: 6000 });
  }
}
