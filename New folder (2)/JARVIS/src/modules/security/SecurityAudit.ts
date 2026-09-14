import type { SecurityFinding } from "../../types";
import { validatePath } from "../../utils/pathValidator";

const secretPatterns = [
  /anthropic_[a-z0-9_-]{20,}/i,
  /xox[baprs]-[a-z0-9-]{20,}/i,
  /ghp_[a-z0-9]{20,}/i,
  /api[_-]?key\s*[:=]\s*["'][^"']{12,}["']/i
];

export class SecurityAudit {
  scanFiles(files: Array<{ path: string; content: string }>): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    for (const file of files) {
      if (!validatePath(file.path)) {
        findings.push(this.finding("critical", "Blocked path access", file.path, "Restricted path requested.", "Use an approved workspace path."));
        continue;
      }
      findings.push(...this.scanContent(file.path, file.content));
    }
    if (findings.length === 0) {
      findings.push(this.finding("pass", "No high-signal findings", undefined, "No OWASP or secret pattern matched.", "Keep scanning before each release."));
    }
    return findings;
  }

  scanContent(path: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (secretPatterns.some((pattern) => pattern.test(line))) {
        findings.push(this.finding("critical", "Potential hardcoded secret", path, "Secret-like token detected.", "Move the value to .env.", index + 1));
      }
      if (/innerHTML\s*=/.test(line)) {
        findings.push(this.finding("high", "XSS sink", path, "Direct innerHTML assignment found.", "Render escaped text or sanitize markdown.", index + 1));
      }
      if (/cors\(\s*\)/.test(line)) {
        findings.push(this.finding("high", "Open CORS", path, "CORS lacks an explicit origin.", "Allow only localhost:3000 in development.", index + 1));
      }
    });
    return findings;
  }

  private finding(
    severity: SecurityFinding["severity"],
    title: string,
    file: string | undefined,
    details: string,
    recommendation: string,
    line?: number
  ): SecurityFinding {
    return { id: crypto.randomUUID(), severity, title, file, line, details, recommendation };
  }
}
