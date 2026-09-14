/**
 * Browser-native SpeechSynthesis TTS engine.
 *
 * Design principles:
 * - Speak-while-streaming: chunks are enqueued immediately as tokens arrive.
 * - Tiny gap between sentences (50 ms pause utterance) — no long dead silence.
 * - Rate 1.25× — fast and natural.
 * - Tracks active utterances so we know when the full response is done.
 */
export class TTSEngine {
  private activeUtterances = new Set<SpeechSynthesisUtterance>();
  private onQueueEmptyCallback: (() => void) | null = null;
  /** Small silent pause injected between sentences (ms). */
  private readonly GAP_MS = 50;

  setOnQueueEmpty(callback: (() => void) | null): void {
    this.onQueueEmptyCallback = callback;
  }

  enqueue(text: string): void {
    if (!("speechSynthesis" in window)) return;
    const clean = text.trim();
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = /[\u0D00-\u0D7F]/.test(clean) ? "ml-IN" : "en-IN";
    utterance.rate = 1.3;   // slightly faster for JARVIS feel
    utterance.pitch = 1.0;

    this.activeUtterances.add(utterance);

    const handleEnd = () => {
      this.activeUtterances.delete(utterance);
      if (this.activeUtterances.size === 0 && this.onQueueEmptyCallback) {
        this.onQueueEmptyCallback();
      }
    };

    utterance.onend = handleEnd;
    utterance.onerror = handleEnd;

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Split text into speakable chunks on sentence boundaries.
   * Returns complete sentences; any trailing fragment is kept as-is.
   */
  chunk(text: string): string[] {
    return (
      text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g)
        ?.map((part) => part.trim())
        .filter(Boolean) ?? []
    );
  }

  stop(): void {
    window.speechSynthesis?.cancel();
    this.activeUtterances.clear();
  }

  get speaking(): boolean {
    return this.activeUtterances.size > 0;
  }
}
