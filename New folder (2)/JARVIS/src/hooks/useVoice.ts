import { useState } from "react";
import { STTEngine } from "../modules/voice/STTEngine";
import { TTSEngine } from "../modules/voice/TTSEngine";

// Module-level singletons so TTS queue persists across renders
const globalStt = new STTEngine();
const globalTts = new TTSEngine();

export function useVoice() {
  const [listening, setListening] = useState(false);

  const listen = async () => {
    setListening(true);
    const result = await globalStt.listenOnce();
    setListening(false);
    return result;
  };

  return {
    listening,
    listen,
    /**
     * Enqueue a piece of text for TTS immediately.
     * App.tsx feeds pre-split sentences here so we skip re-chunking
     * and just enqueue the string as-is for zero extra latency.
     */
    speak: (text: string) => globalTts.enqueue(text),
    stop: () => globalTts.stop(),
    onSpeechEnd: (callback: () => void) => globalTts.setOnQueueEmpty(callback),
  };
}
