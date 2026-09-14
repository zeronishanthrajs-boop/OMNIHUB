import type { ErrorKind } from "../types";

const errorCopy: Record<ErrorKind, string> = {
  "api-timeout": "Connection timed out. Retrying (2/3)...",
  "service-down": "VENOM unreachable. Using cached data.",
  "rate-limit": "Rate limit reached. Queued. ~30s wait.",
  "file-denied": "Path blocked for security. Details →",
  "voice-failed": "Couldn't hear that. Click mic to retry.",
  offline: "You're offline. Cached responses only.",
  "auth-expired": "Session expired. Re-authenticating..."
};

export function ErrorState({ kind }: { kind: ErrorKind }) {
  return <div className={`error-state ${kind}`}>{errorCopy[kind]}</div>;
}
