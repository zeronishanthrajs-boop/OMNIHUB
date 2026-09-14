export type DebugCategory = "Environment" | "Logic" | "Dependency" | "Integration" | "Security";

export interface DebugReport {
  category: DebugCategory;
  confidence: number;
  rootCause: string;
  fixes: string[];
  similarIssues: string[];
}

export class DebugAssistant {
  analyze(errorText: string, codeSnippet = ""): DebugReport {
    const text = `${errorText}\n${codeSnippet}`.toLowerCase();
    const category = this.classify(text);
    return {
      category,
      confidence: this.confidence(text, category),
      rootCause: this.rootCause(text, category),
      fixes: this.fixes(category),
      similarIssues: this.similarIssues(category)
    };
  }

  private classify(text: string): DebugCategory {
    if (/(token|secret|csrf|xss|injection|cors)/.test(text)) return "Security";
    if (/(module not found|dependency|package|version)/.test(text)) return "Dependency";
    if (/(mongo|api|webhook|slack|github|asana|venom)/.test(text)) return "Integration";
    if (/(env|path|permission|port|timeout)/.test(text)) return "Environment";
    return "Logic";
  }

  private confidence(text: string, category: DebugCategory): number {
    const signalCount = category === "Logic" ? 2 : text.split(category.toLowerCase()).length;
    return Math.min(96, 70 + signalCount * 8);
  }

  private rootCause(text: string, category: DebugCategory): string {
    if (category === "Dependency") return "A required package or version is unavailable in the active runtime.";
    if (category === "Security") return "Input or configuration crossed a security boundary and needs explicit validation.";
    if (category === "Integration") return "A service connector returned an unhealthy response or missing credentials.";
    if (category === "Environment") return "The local runtime configuration does not match the expected port, path, or environment variable.";
    return text.length > 0 ? "Application logic entered an unexpected branch." : "No stack trace was supplied.";
  }

  private fixes(category: DebugCategory): string[] {
    return {
      Dependency: ["Run setup.bat to restore dependencies.", "Check package.json version alignment.", "Clear node_modules and reinstall if lockfile drifted."],
      Security: ["Validate and escape input at the boundary.", "Move secrets to .env.", "Add a regression test for the exploit path."],
      Integration: ["Verify connector health.", "Check token names in .env.", "Use cached data while service is unavailable."],
      Environment: ["Confirm ports 3001 and 3000 are free.", "Validate paths through pathValidator.", "Restart with run.bat."],
      Logic: ["Add a failing unit test.", "Patch the smallest branch.", "Rewrite the isolated function if state coupling is unclear."]
    }[category];
  }

  private similarIssues(category: DebugCategory): string[] {
    return [`${category} issue pattern from JARVIS local history`, "Known Node/React setup drift case", "Security-first fallback case"];
  }
}
