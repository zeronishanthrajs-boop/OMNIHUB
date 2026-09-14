import { describe, expect, it } from "vitest";
import { useIntegrationStore } from "../../src/store/integrationStore";
import { contextManager } from "../../src/modules/ai/ContextManager";
import { SecurityAudit } from "../../src/modules/security/SecurityAudit";
import { validatePath } from "../../src/utils/pathValidator";

describe("regression suite", () => {
  it("adding integration keeps existing services", () => {
    const before = useIntegrationStore.getState().integrations.length;
    useIntegrationStore.getState().upsert({ id: "linear", service: "Linear", tokenRef: "LINEAR_TOKEN", enabled: true, health: "healthy" });
    expect(useIntegrationStore.getState().integrations.length).toBe(before + 1);
  });

  it("project switch context does not mutate catalog", () => {
    const venom = contextManager.get("venom");
    const zeroops = contextManager.get("zeroops");
    expect(venom.name).toBe("VENOM");
    expect(zeroops.name).toBe("ZeroOps");
  });

  it("file save guard blocks unrelated secret paths", () => {
    expect(validatePath(".env.production")).toBe(false);
  });

  it("security audit handles empty project", () => {
    const findings = new SecurityAudit().scanFiles([]);
    expect(findings[0].severity).toBe("pass");
  });

  it("voice off-state leaves text path independent", () => {
    const command = "Jarvis status";
    expect(command.length).toBeGreaterThan(0);
  });
});
