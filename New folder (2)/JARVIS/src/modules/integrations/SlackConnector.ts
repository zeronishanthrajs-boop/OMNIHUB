import { BaseConnector } from "./BaseConnector";

export class SlackConnector extends BaseConnector {
  constructor() {
    super("Slack", "/api/integrations/slack");
  }

  async channels(): Promise<string[]> {
    return this.request<string[]>({ path: "/channels", timeoutMs: 6000 });
  }
}
