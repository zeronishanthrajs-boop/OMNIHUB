import { useEffect, useRef } from "react";
import { useWakeWord } from "../hooks/useWakeWord";

export function WakeWordListener({
  enabled,
  onWake,
}: {
  enabled: boolean;
  onWake: () => void;
}) {
  const wake = useWakeWord(enabled);
  const lastFiredAt = useRef<string | null>(null);

  useEffect(() => {
    if (wake.detectedAt && wake.detectedAt !== lastFiredAt.current) {
      lastFiredAt.current = wake.detectedAt;
      onWake();
    }
  }, [wake.detectedAt, onWake]);

  return (
    <span className="wake-status" aria-live="polite">
      {enabled ? "Listening for JARVIS..." : `Wake Word OFF - False triggers ${wake.falseTriggers}`}
    </span>
  );
}
