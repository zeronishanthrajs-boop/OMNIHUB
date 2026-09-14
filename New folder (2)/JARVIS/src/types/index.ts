export type Tier = 1 | 2 | 3 | 4;

export type ProjectKey = "jarvis" | "zeroops" | "venom" | "sector" | "unigate";

export type LogoState = "idle" | "listening" | "processing" | "done" | "error";

export type ErrorKind =
  | "api-timeout"
  | "service-down"
  | "rate-limit"
  | "file-denied"
  | "voice-failed"
  | "offline"
  | "auth-expired";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  tier?: Tier;
}

export interface ProjectContext {
  key: ProjectKey;
  name: string;
  prompt: string;
  stack: string[];
  integrations: string[];
  folderPath?: string;
}

export interface IntegrationConfig {
  id: string;
  service: string;
  tokenRef: string;
  webhookUrl?: string;
  customPrompt?: string;
  enabled: boolean;
  health: "unknown" | "healthy" | "degraded" | "down";
  lastChecked?: string;
}

export interface SecurityFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "pass";
  title: string;
  file?: string;
  line?: number;
  details: string;
  recommendation: string;
}

export interface BrowserSnapshot {
  url: string;
  title: string;
  description: string;
  links: string[];
  imageDataUrl: string;
  capturedAt: string;
}

export interface VoiceResult {
  text: string;
  confidence: number;
  durationMs: number;
}

export interface ClaudeStreamEvent {
  type: "token" | "done" | "error" | "aborted";
  value: string;
}
