import { useEffect, useMemo, useRef, useState } from "react";
import { WakeWordEngine } from "../modules/voice/WakeWordEngine";

export function useWakeWord(enabled: boolean) {
  const engine = useMemo(() => new WakeWordEngine(0.6), []);
  const [detectedAt, setDetectedAt] = useState<string | null>(null);
  const prevEnabled = useRef(false);

  useEffect(() => {
    // Register listener once
    const unsub = engine.onDetect((event) => setDetectedAt(event.at));
    return () => {
      unsub();
      engine.stop();
    };
  }, [engine]);

  useEffect(() => {
    if (enabled && !prevEnabled.current) {
      // Transitioning from disabled → enabled: (re)start engine
      engine.start();
    } else if (!enabled && prevEnabled.current) {
      // Transitioning from enabled → disabled: stop engine
      engine.stop();
    }
    prevEnabled.current = enabled;
  }, [enabled, engine]);

  return {
    detectedAt,
    feedTranscript: (transcript: string, durationMs?: number) =>
      engine.feedTranscript(transcript, durationMs),
    falseTriggers: engine.falseTriggerCount(),
  };
}
