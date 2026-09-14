import { BaseConnector } from "./BaseConnector";

export class AsanaConnector extends BaseConnector {
  constructor() {
    super("Asana", "/api/integrations/asana");
  }

  async tasks(): Promise<string[]> {
    return this.request<string[]>({ path: "/tasks", timeoutMs: 6000 });
  }
}
