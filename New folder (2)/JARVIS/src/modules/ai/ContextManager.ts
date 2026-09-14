import type { ProjectContext, ProjectKey } from "../../types";

const contexts: Record<ProjectKey, ProjectContext> = {
  jarvis: {
    key: "jarvis",
    name: "JARVIS",
    prompt: "Frame answers around standard desktop execution, personal AI assistant operations, system integrations, and personal automation.",
    stack: ["Node.js", "Express", "Vite", "React", "Ollama"],
    integrations: ["Local System", "Browser", "VENOM"]
  },
  zeroops: {
    key: "zeroops",
    name: "ZeroOps",
    prompt: "Frame answers around SMB automation, delivery speed, maintainability, and security posture.",
    stack: ["Next.js", "Node.js", "MongoDB", "Cloudflare R2"],
    integrations: ["GitHub", "Slack"]
  },
  venom: {
    key: "venom",
    name: "VENOM",
    prompt: "Prioritize secrets management, supply chain safety, cloud security, and auditable threat analysis.",
    stack: ["Security Platform", "Node.js", "Static Analysis"],
    integrations: ["VENOM", "GitHub"],
    folderPath: "VENOM_FOLDER_PATH"
  },
  sector: {
    key: "sector",
    name: "SECTOR",
    prompt: "Optimize for unified security monitoring, signal triage, and operator clarity.",
    stack: ["Dashboard", "Security Monitoring"],
    integrations: ["VENOM"]
  },
  unigate: {
    key: "unigate",
    name: "UniGate",
    prompt: "Answer with production Node.js, Express, MongoDB, and Vercel deployment context.",
    stack: ["Express", "MongoDB", "Vercel"],
    integrations: ["GitHub"]
  }
};

export class ContextManager {
  all(): ProjectContext[] {
    return Object.values(contexts);
  }

  get(key: ProjectKey): ProjectContext {
    return contexts[key] ?? contexts.jarvis;
  }
}

export const contextManager = new ContextManager();
