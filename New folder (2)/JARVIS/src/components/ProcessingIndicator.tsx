import type { Tier } from "../types";

export function ProcessingIndicator({ tier, active }: { tier: Tier; active: boolean }) {
  if (!active) return null;
  const labels: Record<Tier, string> = { 1: "INSTANT", 2: "FAST", 3: "STANDARD", 4: "DEEP" };
  return (
    <div className="processing-indicator">
      <span>{labels[tier]}</span>
      <b>Thinking</b>
      <i />
      <i />
      <i />
    </div>
  );
}
