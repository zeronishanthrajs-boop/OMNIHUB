const blockedPaths = [
  "/etc",
  "/root",
  "/sys",
  "/proc",
  "C:\\Windows",
  "C:\\System32",
  ".env",
  ".env.local",
  ".env.production"
];

const normalize = (input: string): string => input.replaceAll("/", "\\").trim();

export function validatePath(pathValue: string): boolean {
  const normalized = normalize(pathValue);
  if (!normalized) {
    return false;
  }
  const lower = normalized.toLowerCase();
  return !blockedPaths.some((blocked) => {
    const candidate = normalize(blocked).toLowerCase();
    return lower === candidate || lower.startsWith(`${candidate}\\`);
  });
}

export function explainPathDecision(pathValue: string): string {
  return validatePath(pathValue)
    ? "Path is allowed for read-only access."
    : "Path blocked for security. Restricted system or secret paths cannot be read or written.";
}

export function safeJoin(root: string, child: string): string {
  const combined = `${root.replace(/[\\/]+$/, "")}\\${child.replace(/^[\\/]+/, "")}`;
  if (!validatePath(combined)) {
    throw new Error(explainPathDecision(combined));
  }
  return combined;
}

export const BLOCKED_PATHS = [...blockedPaths];
