import { BaseConnector } from "./BaseConnector";

export class GitHubConnector extends BaseConnector {
  constructor() {
    super("GitHub", "/api/integrations/github");
  }

  async repositories(): Promise<string[]> {
    return this.request<string[]>({ path: "/repositories", timeoutMs: 6000 });
  }
}
