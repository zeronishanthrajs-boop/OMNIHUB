import { create } from "zustand";
import type { IntegrationConfig } from "../types";

interface IntegrationState {
  integrations: IntegrationConfig[];
  upsert: (integration: IntegrationConfig) => void;
  toggle: (id: string, enabled: boolean) => void;
}

const defaults: IntegrationConfig[] = [
  { id: "venom", service: "VENOM", tokenRef: "VENOM_API_KEY", enabled: true, health: "unknown" },
  { id: "github", service: "GitHub", tokenRef: "GITHUB_TOKEN", enabled: false, health: "unknown" },
  { id: "asana", service: "Asana", tokenRef: "ASANA_TOKEN", enabled: false, health: "unknown" },
  { id: "slack", service: "Slack", tokenRef: "SLACK_BOT_TOKEN", enabled: false, health: "unknown" }
];

export const useIntegrationStore = create<IntegrationState>((set) => ({
  integrations: defaults,
  upsert: (integration) =>
    set((state) => ({
      integrations: [...state.integrations.filter((item) => item.id !== integration.id), integration]
    })),
  toggle: (id, enabled) =>
    set((state) => ({
      integrations: state.integrations.map((item) => (item.id === id ? { ...item, enabled } : item))
    }))
}));
